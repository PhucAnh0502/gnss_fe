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

  const coordinates = historyData
    .map((item) => item.location?.coordinates)
    .filter(Boolean)
    .map(([lng, lat]) => [lat, lng]);

  if (coordinates.length === 0) {
    return null;
  }

  const latitudes = coordinates.map(([lat]) => lat);
  const longitudes = coordinates.map(([, lng]) => lng);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  return {
    center: [(minLat + maxLat) / 2, (minLng + maxLng) / 2],
    polyline: coordinates,
  };
};

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