import { useCallback, useRef, useState } from 'react';
import { useDevices } from './useDevices';
import axiosInstance from '../api/axiosInstance.js';
import {
  buildRouteMapData,
  exportHistoryPdf,
  fetchHistoryData,
  getDefaultEndDate,
  getDefaultStartDate,
} from '../services/historyService.jsx';

/**
 * Hook quản lý toàn bộ logic History page.
 * Bao gồm: filter, fetch data, export PDF.
 */
export const useHistory = () => {
  const { data: devices = [], isLoading: devicesLoading } = useDevices();

  // Filters
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());

  // Data
  const [historyData, setHistoryData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Map ref for PDF export
  const mapRef = useRef(null);

  // Auto-select first device
  const effectiveDeviceId = selectedDeviceId || (devices.length > 0 ? devices[0].id : null);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    if (!effectiveDeviceId) return;

    await fetchHistoryData({
      axiosInstance,
      deviceId: effectiveDeviceId,
      startDate,
      endDate,
      onLoadingChange: setIsLoading,
      onSuccess: (data, summaryData) => {
        setHistoryData(data);
        setSummary(summaryData);
      },
      onEmpty: () => {
        setHistoryData([]);
        setSummary(null);
      },
      onError: () => {
        setHistoryData([]);
        setSummary(null);
      },
    });
  }, [effectiveDeviceId, startDate, endDate]);

  // Map data for route visualization
  const mapData = buildRouteMapData(historyData);

  // Export PDF
  const exportPdf = useCallback(async () => {
    await exportHistoryPdf({
      historyData,
      devices,
      selectedDeviceId: effectiveDeviceId,
      startDate,
      endDate,
      mapRef,
      mapData,
      onExportingChange: setIsExporting,
    });
  }, [historyData, devices, effectiveDeviceId, startDate, endDate, mapData]);

  return {
    // Data
    devices,
    historyData,
    summary,
    mapData,
    mapRef,

    // Filters
    selectedDeviceId: effectiveDeviceId,
    setSelectedDeviceId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,

    // Loading
    isLoading: devicesLoading || isLoading,
    isExporting,

    // Actions
    fetchHistory,
    exportPdf,
  };
};
