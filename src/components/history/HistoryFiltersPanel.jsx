import { Calendar, Download, Loader } from 'lucide-react';

export function HistoryFiltersPanel({
  devices,
  selectedDeviceId,
  onSelectedDeviceChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onSearch,
  isLoading,
  onExportPDF,
  isExporting,
  canExport,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/40 backdrop-blur-sm">
      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">Select Device</label>
          <select
            value={selectedDeviceId || ''}
            onChange={(event) => onSelectedDeviceChange(event.target.value || null)}
            className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-400"
          >
            <option value="">-- Choose a device --</option>
            {devices.map((device) => (
              <option key={device.id} value={device.id}>
                {device.deviceName} ({device.deviceCode})
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-white mb-2">Start Date</label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(event) => onStartDateChange(event.target.value)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-white mb-2">End Date</label>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(event) => onEndDateChange(event.target.value)}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onSearch}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Loading...</span>
              </>
            ) : (
              <span>Search History</span>
            )}
          </button>
          <button
            onClick={onExportPDF}
            disabled={!canExport || isExporting}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}