import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';

export const DEFAULT_LOOKBACK_DAYS = 7;

export const getDefaultStartDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - DEFAULT_LOOKBACK_DAYS);
  return date.toISOString().split('T')[0];
};

export const getDefaultEndDate = () => new Date().toISOString().split('T')[0];

export const buildRouteMapData = (historyData) => {
  if (historyData.length === 0) {
    return null;
  }

  // Quality filter: remove GPS jitter (indoor/weak signal points)
  const filteredData = filterLowQualityPoints(historyData);

  if (filteredData.length === 0) {
    return null;
  }

  // Build segments based on segmentFlag
  const segments = [];
  let currentSegment = [];

  for (const item of filteredData) {
    const coords = item.location?.coordinates;
    if (!coords) continue;

    const [lng, lat] = coords;
    const point = [lat, lng];
    const flag = item.segmentFlag || 'none';

    if (flag === 'start') {
      // Start a new segment
      if (currentSegment.length > 0) {
        segments.push(currentSegment);
      }
      currentSegment = [point];
    } else if (flag === 'end') {
      currentSegment.push(point);
      segments.push(currentSegment);
      currentSegment = [];
    } else {
      currentSegment.push(point);
    }
  }

  // Don't forget the last segment
  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  // Flatten all points for bounds calculation
  const allPoints = segments.flat();
  if (allPoints.length === 0) return null;

  const latitudes = allPoints.map(([lat]) => lat);
  const longitudes = allPoints.map(([, lng]) => lng);

  return {
    center: [(Math.min(...latitudes) + Math.max(...latitudes)) / 2, (Math.min(...longitudes) + Math.max(...longitudes)) / 2],
    polyline: allPoints,  // Keep for backward compat (bounds, selected point)
    segments,             // NEW: array of polyline arrays
  };
};

/**
 * Filter out low-quality GPS points that cause jitter on the map.
 * Criteria:
 * - Remove points with hdop > 8 (very poor geometry)
 * - Remove points with satellites_used < 4 (insufficient fix)
 * - Remove "teleport" points (impossible speed between consecutive points)
 */
function filterLowQualityPoints(historyData) {
  const MAX_HDOP = 8;
  const MIN_SAT_USED = 4;
  const MAX_SPEED_KMH = 200; // max realistic speed

  const filtered = [];

  for (let i = 0; i < historyData.length; i++) {
    const item = historyData[i];

    // Always keep start/end points for segment integrity
    if (item.segmentFlag === 'start' || item.segmentFlag === 'end') {
      filtered.push(item);
      continue;
    }

    // Filter by HDOP
    if (item.hdop > MAX_HDOP && item.hdop !== 0) continue;

    // Filter by satellite count
    if (item.satellites_used < MIN_SAT_USED && item.satellites_used !== 0) continue;

    // Filter by teleport (check against previous valid point)
    if (filtered.length > 0) {
      const prev = filtered[filtered.length - 1];
      const prevCoords = prev.location?.coordinates;
      const currCoords = item.location?.coordinates;

      if (prevCoords && currCoords) {
        const dist = haversineDistance(prevCoords[1], prevCoords[0], currCoords[1], currCoords[0]);
        const timeDiff = (new Date(item.timestamp) - new Date(prev.timestamp)) / 1000; // seconds

        if (timeDiff > 0) {
          const speedKmh = (dist / timeDiff) * 3.6;
          if (speedKmh > MAX_SPEED_KMH) continue; // teleport - skip
        }
      }
    }

    filtered.push(item);
  }

  return filtered;
}

/**
 * Calculate distance between two points using Haversine formula.
 * Returns distance in meters.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export async function fetchHistoryData({
  axiosInstance,
  deviceId,
  startDate,
  endDate,
  onLoadingChange,
  onSuccess,
  onEmpty,
  onError,
}) {
  if (!deviceId) {
    toast.error('Please select a device');
    return [];
  }

  onLoadingChange(true);
  try {
    // Convert date strings to UTC timestamps (fix timezone bug)
    const [startYear, startMonth, startDay] = startDate.split('-');
    const [endYear, endMonth, endDay] = endDate.split('-');
    const from = new Date(Date.UTC(startYear, startMonth - 1, startDay)).toISOString();
    const to = new Date(Date.UTC(endYear, endMonth - 1, endDay, 23, 59, 59, 999)).toISOString();

    const response = await axiosInstance.get(`/tracking/history/${deviceId}`, {
      params: {
        from,
        to,
      },
    });

    if (!response.data.success || !response.data.data) {
      const message = 'Failed to fetch history. Please try again.';
      toast.error(message);
      onError?.(message);
      return [];
    }

    const data = response.data.data;
    onSuccess?.(data, response.data.summary);

    if (data.length === 0) {
      toast.info('No tracking data found for the selected period');
      onEmpty?.();
    } else {
      const distance = response.data.summary?.totalDistanceMeter;
      const distanceText = distance ? ` (${(distance / 1000).toFixed(2)} km traveled)` : '';
      toast.success(`Found ${data.length} tracking records${distanceText}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching history:', error);
    const errorMsg = error.response?.data?.message || 'Failed to fetch history. Please try again.';
    toast.error(errorMsg);
    onError?.(errorMsg);
    return [];
  } finally {
    onLoadingChange(false);
  }
}

export async function exportHistoryPdf({
  historyData,
  devices,
  selectedDeviceId,
  startDate,
  endDate,
  mapRef,
  mapData,
  onExportingChange,
}) {
  if (historyData.length === 0) {
    toast.warning('No data to export');
    return;
  }

  onExportingChange(true);
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 15;
    let yPosition = 15;

    const device = devices.find((item) => item.id === selectedDeviceId);

    pdf.setFontSize(16);
    pdf.text('Tracking History Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    pdf.setFontSize(10);
    pdf.text(`Device: ${device?.deviceName || 'Unknown'}`, marginX, yPosition);
    yPosition += 6;
    pdf.text(`Period: ${startDate} to ${endDate}`, marginX, yPosition);
    yPosition += 6;
    pdf.text(`Total Records: ${historyData.length}`, marginX, yPosition);
    yPosition += 10;

    if (mapRef.current && mapData) {
      try {
        const mapElement = mapRef.current.querySelector('.leaflet-container') || mapRef.current;

        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        const mapCanvas = await html2canvas(mapElement, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          logging: false,
        });
        const mapImage = mapCanvas.toDataURL('image/png');
        const mapWidth = pageWidth - marginX * 2;
        const mapHeight = 80;
        pdf.addImage(mapImage, 'PNG', marginX, yPosition, mapWidth, mapHeight);
        yPosition += mapHeight + 10;
      } catch (error) {
        console.error('Error capturing map:', error);
      }
    }

    if (yPosition > pageHeight - 50) {
      pdf.addPage();
      yPosition = 15;
    }

    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');

    const tableColumns = ['Time', 'Lat', 'Lng', 'Speed', 'Alt', 'Sats'];
    const columnWidths = [
      (pageWidth - marginX * 2) * 0.2,
      (pageWidth - marginX * 2) * 0.15,
      (pageWidth - marginX * 2) * 0.15,
      (pageWidth - marginX * 2) * 0.15,
      (pageWidth - marginX * 2) * 0.15,
      (pageWidth - marginX * 2) * 0.2,
    ];

    let xPosition = marginX;
    tableColumns.forEach((column, index) => {
      pdf.text(column, xPosition, yPosition, { maxWidth: columnWidths[index] });
      xPosition += columnWidths[index];
    });

    yPosition += 8;
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(8);

    historyData.forEach((row, index) => {
      const [lng, lat] = row.location?.coordinates || [0, 0];
      const time = new Date(row.timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const rowData = [
        time,
        parseFloat(lat).toFixed(4),
        parseFloat(lng).toFixed(4),
        (row.speed || 0).toFixed(1),
        (row.altitude || 0).toFixed(0),
        row.satellites_used || 0,
      ];

      xPosition = marginX;
      rowData.forEach((value, columnIndex) => {
        pdf.text(String(value), xPosition, yPosition, { maxWidth: columnWidths[columnIndex] });
        xPosition += columnWidths[columnIndex];
      });

      yPosition += 6;

      if (yPosition > pageHeight - 15 && index < historyData.length - 1) {
        pdf.addPage();
        yPosition = 15;
      }
    });

    pdf.setFontSize(8);
    pdf.text(`Generated: ${new Date().toLocaleString('vi-VN')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    pdf.save(`history_${selectedDeviceId}_${startDate}_${endDate}.pdf`);
    toast.success('History exported as PDF successfully with map!');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    toast.error('Failed to export PDF');
  } finally {
    onExportingChange(false);
  }
}