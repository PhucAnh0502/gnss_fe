import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { History, Loader, AlertTriangle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useAlertHistory } from '../features/useAlertHistory';
import { useAlertZones } from '../features/useAlertZones';
import { useDevices } from '../features/useDevices';

function getDefaultDateRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

function formatTimestamp(timestamp) {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function AlertTypeBadge({ type }) {
  const config = {
    proximity: { label: 'Proximity', className: 'bg-blue-500/20 text-blue-300 border-blue-400/30' },
    breach: { label: 'Breach', className: 'bg-rose-500/20 text-rose-300 border-rose-400/30' },
    exit: { label: 'Exit', className: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' },
  };
  const { label, className } = config[type] || { label: type, className: 'bg-slate-500/20 text-slate-300 border-slate-400/30' };
  return (
    <span className={`text-xs px-3 py-1 rounded-full border font-medium ${className}`}>
      {label}
    </span>
  );
}

export default function AlertHistoryPage() {
  const defaultRange = useMemo(() => getDefaultDateRange(), []);

  const [page, setPage] = useState(1);
  const [deviceCode, setDeviceCode] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [alertType, setAlertType] = useState('');
  const [startDate, setStartDate] = useState(defaultRange.startDate);
  const [endDate, setEndDate] = useState(defaultRange.endDate);

  const filters = {
    page,
    limit: 20,
    ...(deviceCode && { deviceCode }),
    ...(zoneId && { zoneId }),
    ...(alertType && { alertType }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  };

  const { data: historyResult, isLoading, isError, refetch } = useAlertHistory(filters);
  const { data: zones = [] } = useAlertZones();
  const { data: devices = [] } = useDevices();

  const alerts = historyResult?.data || [];
  const pagination = historyResult?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  const handleStartDateChange = (e) => {
    const newStart = e.target.value;
    // Enforce max 90-day range
    if (endDate) {
      const diff = (new Date(endDate) - new Date(newStart)) / (1000 * 60 * 60 * 24);
      if (diff > 90) {
        const adjusted = new Date(newStart);
        adjusted.setDate(adjusted.getDate() + 90);
        setEndDate(adjusted.toISOString().split('T')[0]);
      }
    }
    setStartDate(newStart);
    setPage(1);
  };

  const handleEndDateChange = (e) => {
    const newEnd = e.target.value;
    // Enforce max 90-day range
    if (startDate) {
      const diff = (new Date(newEnd) - new Date(startDate)) / (1000 * 60 * 60 * 24);
      if (diff > 90) {
        const adjusted = new Date(newEnd);
        adjusted.setDate(adjusted.getDate() - 90);
        setStartDate(adjusted.toISOString().split('T')[0]);
      }
    }
    setEndDate(newEnd);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Alert History</h1>
        <p className="text-slate-400 mt-1">View and filter historical alert events across all devices and zones.</p>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Device Filter */}
          <select
            value={deviceCode}
            onChange={(e) => { setDeviceCode(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all"
          >
            <option value="">All Devices</option>
            {devices.map((device) => (
              <option key={device.id} value={device.deviceCode}>
                {device.deviceName || device.deviceCode}
              </option>
            ))}
          </select>

          {/* Zone Filter */}
          <select
            value={zoneId}
            onChange={(e) => { setZoneId(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all"
          >
            <option value="">All Zones</option>
            {zones.map((zone) => (
              <option key={zone.id} value={zone.id}>
                {zone.name}
              </option>
            ))}
          </select>

          {/* Alert Type Filter */}
          <select
            value={alertType}
            onChange={(e) => { setAlertType(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all"
          >
            <option value="">All Types</option>
            <option value="proximity">Proximity</option>
            <option value="breach">Breach</option>
            <option value="exit">Exit</option>
          </select>

          {/* Start Date */}
          <input
            type="date"
            value={startDate}
            onChange={handleStartDateChange}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all scheme-dark"
          />

          {/* End Date */}
          <input
            type="date"
            value={endDate}
            onChange={handleEndDateChange}
            className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-slate-200 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all scheme-dark"
          />
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : alerts.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Table */}
          <div className="border border-slate-700 rounded-2xl overflow-hidden bg-slate-900/45 backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/60">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Device</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Zone</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Timestamp</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Distance</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert, index) => (
                    <motion.tr
                      key={alert.id || index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="border-b border-slate-800 hover:bg-slate-900/60 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-slate-200 font-mono">
                        {alert.deviceCode}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-200">
                        {alert.zoneName}
                      </td>
                      <td className="px-6 py-4">
                        <AlertTypeBadge type={alert.alertType} />
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300">
                        {formatTimestamp(alert.timestamp)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 text-right font-mono">
                        {alert.distance != null ? `${alert.distance}m` : '—'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 px-2">
            <p className="text-sm text-slate-400">
              Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

function LoadingSkeleton() {
  return (
    <div className="border border-slate-700 rounded-2xl overflow-hidden bg-slate-900/45">
      <div className="p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="h-4 w-24 bg-slate-700 rounded" />
            <div className="h-4 w-32 bg-slate-700 rounded" />
            <div className="h-4 w-20 bg-slate-700 rounded" />
            <div className="h-4 w-36 bg-slate-700 rounded" />
            <div className="h-4 w-16 bg-slate-700 rounded ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="p-8 border border-rose-700/50 rounded-2xl bg-rose-500/10 text-center">
      <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
      <p className="text-rose-300 font-medium mb-1">Failed to load alert history</p>
      <p className="text-slate-400 text-sm mb-4">An error occurred while fetching the data. Please try again.</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Retry
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-12 border border-dashed border-slate-700 rounded-2xl text-center">
      <History className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
      <p className="text-slate-400">No alerts found matching your current filters.</p>
      <p className="text-slate-500 text-sm mt-1">Try adjusting your filters or date range.</p>
    </div>
  );
}
