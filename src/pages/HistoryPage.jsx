import { useMemo, useRef, useState } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useDevices } from '../features/useDevices';
import { HistoryFiltersPanel } from '../components/history/HistoryFiltersPanel';
import { HistoryRouteMap } from '../components/history/HistoryRouteMap';
import { HistoryPointList } from '../components/history/HistoryPointList';
import axiosInstance from '../api/axiosInstance';
import {
  buildRouteMapData,
  exportHistoryPdf,
  fetchHistoryData,
  getDefaultEndDate,
  getDefaultStartDate,
} from '../services/historyService.jsx';

export default function HistoryPage() {
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [endDate, setEndDate] = useState(getDefaultEndDate);
  const [historyData, setHistoryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);
  const mapRef = useRef(null);

  const { data: devices = [] } = useDevices();

  const mapData = useMemo(() => buildRouteMapData(historyData), [historyData]);

  const fetchHistory = () =>
    fetchHistoryData({
      axiosInstance,
      deviceId: selectedDeviceId,
      startDate,
      endDate,
      onLoadingChange: setIsLoading,
      onSuccess: (data) => {
        setHistoryData(data);
        setSelectedPointIndex(null);
      },
    });

  const handleExportPDF = () =>
    exportHistoryPdf({
      historyData,
      devices,
      selectedDeviceId,
      startDate,
      endDate,
      mapRef,
      mapData,
      onExportingChange: setIsExporting,
    });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Tracking History</h1>
          <p className="text-slate-400 mt-1">View and export detailed location history for your devices</p>
        </div>

        <HistoryFiltersPanel
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onSelectedDeviceChange={setSelectedDeviceId}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          onSearch={fetchHistory}
          isLoading={isLoading}
          onExportPDF={handleExportPDF}
          isExporting={isExporting}
          canExport={historyData.length > 0}
        />

        <HistoryRouteMap
          mapData={mapData}
          mapRef={mapRef}
          selectedPointIndex={selectedPointIndex}
        />

        <HistoryPointList
          historyData={historyData}
          isLoading={isLoading}
          selectedDeviceId={selectedDeviceId}
          onPointSelect={setSelectedPointIndex}
        />
      </div>
    </DashboardLayout>
  );
}
