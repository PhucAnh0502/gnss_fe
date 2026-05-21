import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  MapPin,
  Clock,
  Gauge,
  Mountain,
  Compass,
  Satellite,
  Signal,
  Radio,
  Loader2,
  Navigation,
} from 'lucide-react';
import axiosInstance from '../../api/axiosInstance';

export function PointDetailModal({ point, pointIndex, onClose }) {
  const [rawData, setRawData] = useState(undefined); // undefined = not fetched, null = no data
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('satellites');

  useEffect(() => {
    if (!point?.id) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setRawData(undefined);

    axiosInstance
      .get(`/telemetry/raw/${point.id}`)
      .then((res) => {
        if (!cancelled) {
          setRawData(res.data?.success && res.data?.data ? res.data.data : null);
        }
      })
      .catch(() => { if (!cancelled) setRawData(null); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [point?.id]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!point) return null;

  const coordinates = point.location?.coordinates || [];
  const lng = coordinates[0];
  const lat = coordinates[1];
  const time = new Date(point.timestamp);

  const tabs = [
    { id: 'satellites', label: 'Satellites' },
    { id: 'measurements', label: 'Measurements' },
    { id: 'clock', label: 'Clock' },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-9999 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 380, mass: 0.5 }}
        className="relative w-full max-w-4xl max-h-[85vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header with point info summary */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-700/60 bg-slate-800/40 shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
              <Navigation className="w-4.5 h-4.5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Point #{pointIndex + 1} — Raw GNSS Data
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {time.toLocaleDateString('vi-VN')} {time.toLocaleTimeString('vi-VN')}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {lat != null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'N/A'}
                </span>
                <span className="flex items-center gap-1">
                  <Gauge className="w-3 h-3" />
                  {(point.speed || 0).toFixed(1)} km/h
                </span>
                <span className="flex items-center gap-1">
                  <Compass className="w-3 h-3" />
                  {(point.heading || 0).toFixed(1)}° {getCardinalDirection(point.heading || 0)}
                </span>
                <span className="flex items-center gap-1">
                  <Mountain className="w-3 h-3" />
                  {(point.altitude || 0).toFixed(1)} m
                </span>
                <span className="flex items-center gap-1">
                  <Satellite className="w-3 h-3" />
                  {point.satellites_used || 0}/{point.satellites_count || 0} sats
                </span>
                <span className="flex items-center gap-1">
                  <Signal className="w-3 h-3" />
                  HDOP {(point.hdop || 0).toFixed(2)}
                </span>
                <span className="flex items-center gap-1">
                  <Radio className="w-3 h-3" />
                  {(point.avg_cn0 || 0).toFixed(1)} dB-Hz
                </span>
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 pb-2 shrink-0 border-b border-slate-800/60">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-500/20 border border-blue-400/40 text-blue-200'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading && <LoadingState text="Loading raw GNSS data..." />}

          {!isLoading && rawData === null && (
            <EmptyState text="No raw GNSS data available for this tracking point." />
          )}

          {!isLoading && rawData && (
            <>
              {activeTab === 'satellites' && <SatellitesTab rawData={rawData} />}
              {activeTab === 'measurements' && <MeasurementsTab rawData={rawData} />}
              {activeTab === 'clock' && <ClockTab rawData={rawData} />}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Tab: Satellites ─── */
function SatellitesTab({ rawData }) {
  if (!rawData?.statusRaw || rawData.statusRaw.length === 0) {
    return <EmptyState text="No satellite status data recorded." />;
  }

  const satellites = rawData.statusRaw;
  const inFix = satellites.filter((s) => s.usedInFix);
  const avgCn0 = satellites.reduce((sum, s) => sum + (s.cn0DbHz || 0), 0) / satellites.length;

  // Group by constellation
  const byConstellation = {};
  satellites.forEach((sat) => {
    const name = getConstellationName(sat.constellationType);
    if (!byConstellation[name]) byConstellation[name] = [];
    byConstellation[name].push(sat);
  });

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-white">
          Total: <span className="font-bold">{satellites.length}</span>
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
          In Fix: <span className="font-bold">{inFix.length}</span>
        </span>
        <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-300">
          Avg CN0: <span className="font-bold">{avgCn0.toFixed(1)} dB-Hz</span>
        </span>
        {Object.entries(byConstellation).map(([name, sats]) => (
          <span key={name} className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            {name}: <span className="text-white font-semibold">{sats.length}</span>
          </span>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-800 z-10">
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2.5 px-3 font-semibold">SVID</th>
                <th className="text-left py-2.5 px-3 font-semibold">Constellation</th>
                <th className="text-right py-2.5 px-3 font-semibold">CN0 (dB-Hz)</th>
                <th className="text-right py-2.5 px-3 font-semibold">Elevation°</th>
                <th className="text-right py-2.5 px-3 font-semibold">Azimuth°</th>
                <th className="text-center py-2.5 px-3 font-semibold">In Fix</th>
                <th className="text-center py-2.5 px-3 font-semibold">Almanac</th>
                <th className="text-center py-2.5 px-3 font-semibold">Ephemeris</th>
              </tr>
            </thead>
            <tbody>
              {satellites.map((sat, idx) => (
                <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-700/20 transition-colors">
                  <td className="py-2 px-3 text-white font-mono font-medium">{sat.svid}</td>
                  <td className="py-2 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${getConstellationColor(sat.constellationType)}`}>
                      {getConstellationName(sat.constellationType)}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right">
                    <span className={`font-mono ${getCn0Color(sat.cn0DbHz)}`}>{(sat.cn0DbHz || 0).toFixed(1)}</span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-300 font-mono">{(sat.elevationDegrees || 0).toFixed(1)}</td>
                  <td className="py-2 px-3 text-right text-slate-300 font-mono">{(sat.azimuthDegrees || 0).toFixed(1)}</td>
                  <td className="py-2 px-3 text-center">
                    {sat.usedInFix
                      ? <span className="text-emerald-400 font-bold">✓</span>
                      : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {sat.hasAlmanac
                      ? <span className="text-blue-400">✓</span>
                      : <span className="text-slate-600">—</span>}
                  </td>
                  <td className="py-2 px-3 text-center">
                    {sat.hasEphemeris
                      ? <span className="text-blue-400">✓</span>
                      : <span className="text-slate-600">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab: Measurements ─── */
function MeasurementsTab({ rawData }) {
  if (!rawData?.measurementsRaw || rawData.measurementsRaw.length === 0) {
    return <EmptyState text="No raw measurement data recorded." />;
  }

  const measurements = rawData.measurementsRaw;

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">
        <span className="text-white font-semibold">{measurements.length}</span> signal measurements recorded
      </p>

      <div className="bg-slate-800/30 border border-slate-700/40 rounded-xl overflow-hidden">
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-800 z-10">
              <tr className="text-slate-400 border-b border-slate-700">
                <th className="text-left py-2.5 px-3 font-semibold">SVID</th>
                <th className="text-left py-2.5 px-3 font-semibold">Constellation</th>
                <th className="text-right py-2.5 px-3 font-semibold">CN0 (dB-Hz)</th>
                <th className="text-right py-2.5 px-3 font-semibold">Pseudorange Rate (m/s)</th>
                <th className="text-right py-2.5 px-3 font-semibold">Carrier Freq</th>
                <th className="text-right py-2.5 px-3 font-semibold">Received SV Time (ns)</th>
                <th className="text-right py-2.5 px-3 font-semibold">Accum. Delta Range (m)</th>
                <th className="text-right py-2.5 px-3 font-semibold">State</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((m, idx) => (
                <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-700/20 transition-colors">
                  <td className="py-2 px-3 text-white font-mono font-medium">{m.svid}</td>
                  <td className="py-2 px-3">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${getConstellationColor(m.constellationType)}`}>
                      {getConstellationName(m.constellationType)}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono">
                    <span className={getCn0Color(m.cn0DbHz)}>{(m.cn0DbHz || 0).toFixed(1)}</span>
                  </td>
                  <td className="py-2 px-3 text-right text-slate-300 font-mono">
                    {m.pseudorangeRateMetersPerSecond != null ? m.pseudorangeRateMetersPerSecond.toFixed(3) : '—'}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-300 font-mono">
                    {m.carrierFrequencyHz != null ? `${(m.carrierFrequencyHz / 1e6).toFixed(2)} MHz` : '—'}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-300 font-mono">
                    {m.receivedSvTimeNanos != null ? formatLargeNumber(m.receivedSvTimeNanos) : '—'}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-300 font-mono">
                    {m.accumulatedDeltaRangeMeters != null ? m.accumulatedDeltaRangeMeters.toFixed(2) : '—'}
                  </td>
                  <td className="py-2 px-3 text-right text-slate-400 font-mono">{m.state || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Tab: Clock ─── */
function ClockTab({ rawData }) {
  if (!rawData?.clockRaw || Object.keys(rawData.clockRaw).length === 0) {
    return <EmptyState text="No GNSS clock data recorded." />;
  }

  const clockEntries = Object.entries(rawData.clockRaw);

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-400">
        GNSS receiver clock parameters at the time of measurement.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {clockEntries.map(([key, value]) => (
          <div key={key} className="bg-slate-800/50 border border-slate-700/40 rounded-lg px-4 py-3">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
              {formatClockKey(key)}
            </span>
            <p className="text-sm text-white font-mono break-all">{formatClockValue(value)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Shared Components ─── */
function LoadingState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Loader2 className="w-6 h-6 animate-spin mb-3" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
      <Satellite className="w-8 h-8 mb-3 opacity-50" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

/* ─── Helpers ─── */
function getConstellationName(type) {
  const names = { 1: 'GPS', 2: 'SBAS', 3: 'GLONASS', 4: 'QZSS', 5: 'BeiDou', 6: 'Galileo', 7: 'IRNSS' };
  return names[type] || `Unknown (${type})`;
}

function getConstellationColor(type) {
  const colors = {
    1: 'bg-blue-500/20 text-blue-300',
    2: 'bg-slate-500/20 text-slate-300',
    3: 'bg-red-500/20 text-red-300',
    4: 'bg-orange-500/20 text-orange-300',
    5: 'bg-rose-500/20 text-rose-300',
    6: 'bg-emerald-500/20 text-emerald-300',
    7: 'bg-purple-500/20 text-purple-300',
  };
  return colors[type] || 'bg-slate-500/20 text-slate-300';
}

function getCn0Color(cn0) {
  if (cn0 >= 35) return 'text-emerald-400';
  if (cn0 >= 25) return 'text-cyan-300';
  if (cn0 >= 15) return 'text-amber-300';
  return 'text-red-400';
}

function getCardinalDirection(heading) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(heading / 22.5) % 16;
  return directions[index];
}

function formatClockKey(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();
}

function formatClockValue(value) {
  if (typeof value === 'number') {
    if (Math.abs(value) > 1e12) return value.toExponential(6);
    if (Math.abs(value) > 1e9) return value.toExponential(4);
    if (Math.abs(value) < 0.001 && value !== 0) return value.toExponential(6);
    return value.toLocaleString('en-US', { maximumFractionDigits: 4 });
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function formatLargeNumber(value) {
  if (Math.abs(value) > 1e12) return value.toExponential(4);
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
