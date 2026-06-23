import {
  AlertTriangle,
  Camera,
  Clock,
  Gauge,
  Loader2,
  MapPinned,
  RadioTower,
  Satellite,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { DashboardLayout } from '../DashboardLayout';
import { useDashboard } from '../../features/useDashboard';

const MotionDiv = motion.div;
const MotionSection = motion.section;
const MotionArticle = motion.article;

const pageVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: 'easeOut',
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const cardGridVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.28, ease: 'easeOut' },
  },
};

const getSeverityTone = (severity) => {
  if (severity === 'High') return 'text-rose-300 bg-rose-500/15 border border-rose-500/25';
  if (severity === 'Medium') return 'text-amber-300 bg-amber-500/15 border border-amber-500/25';
  return 'text-sky-300 bg-sky-500/15 border border-sky-500/25';
};

const getStatusBadge = (status) => {
  if (status === 'In transit') return 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30';
  if (status === 'Slow move') return 'text-amber-300 bg-amber-500/15 border-amber-500/30';
  return 'text-slate-400 bg-slate-500/10 border-slate-600/30';
};

function ChartWithTooltip({ telemetrySeries, devices = [] }) {
  const [hovered, setHovered] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState(() =>
    devices.map((d) => d.deviceCode)
  );

  const allCodes = devices.map((d) => d.deviceCode).join(',');
  useMemo(() => {
    setSelectedDevices(devices.map((d) => d.deviceCode));
  }, [allCodes]);

  const toggleDevice = (code) => {
    setSelectedDevices((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const TRACK_COLORS = ['#22d3ee', '#f97316', '#a78bfa', '#34d399', '#f43f5e', '#eab308', '#60a5fa', '#fb923c'];

  const allDeviceEntries = useMemo(() => {
    return devices.map((device, index) => {
      const series = telemetrySeries.find((s) => s.deviceCode === device.deviceCode);
      return {
        deviceCode: device.deviceCode,
        deviceName: device.deviceName,
        color: series?.color || TRACK_COLORS[index % TRACK_COLORS.length],
        hasData: !!series,
      };
    });
  }, [devices, telemetrySeries]);

  const visibleSeries = telemetrySeries.filter((s) => selectedDevices.includes(s.deviceCode));

  const allVisibleSeries = useMemo(() => {
    const result = [...visibleSeries];
    allDeviceEntries.forEach((entry) => {
      if (!entry.hasData && selectedDevices.includes(entry.deviceCode)) {
        result.push({
          deviceCode: entry.deviceCode,
          deviceName: entry.deviceName,
          color: entry.color,
          points: [
            { x: 0, label: '—', value: 0 },
            { x: 23, label: '—', value: 0 },
          ],
        });
      }
    });
    return result;
  }, [visibleSeries, allDeviceEntries, selectedDevices]);

  const deviceCharts = useMemo(() => {
    const padding = 14;
    const width = 600;
    const height = 180;
    const innerWidth = width - padding * 2;
    const innerHeight = height - padding * 2;

    return allVisibleSeries.map((series) => {
      if (!series.points.length) return null;
      const stepX = series.points.length > 1 ? innerWidth / (series.points.length - 1) : innerWidth;

      const points = series.points.map((item, index) => ({
        x: padding + index * stepX,
        y: padding + ((100 - item.value) / 100) * innerHeight,
        value: item.value,
        label: item.label,
      }));

      const line = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
        .join(' ');

      return { ...series, chartPoints: points, linePath: line };
    }).filter(Boolean);
  }, [allVisibleSeries]);

  const handleMouseMove = (e) => {
    if (!deviceCharts.length) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 600;

    let closest = null;
    let minDist = Infinity;
    deviceCharts.forEach((dc) => {
      dc.chartPoints.forEach((point) => {
        const dist = Math.abs(point.x - mouseX);
        if (dist < minDist) {
          minDist = dist;
          closest = { ...point, deviceCode: dc.deviceCode, color: dc.color };
        }
      });
    });
    if (closest && minDist < 30) {
      setHovered(closest);
    } else {
      setHovered(null);
    }
  };

  const selectedCount = selectedDevices.length;

  return (
    <div className="relative">
      <div className="relative mb-3">
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700/60 transition-colors"
        >
          <span>{selectedCount}/{allDeviceEntries.length} devices selected</span>
          <svg className={`w-3 h-3 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 w-64 rounded-lg border border-slate-700 bg-slate-900/95 backdrop-blur-sm shadow-xl py-1 max-h-48 overflow-y-auto">
            {allDeviceEntries.map((entry) => (
              <label
                key={entry.deviceCode}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-800/60 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedDevices.includes(entry.deviceCode)}
                  onChange={() => toggleDevice(entry.deviceCode)}
                  className="sr-only"
                />
                <span
                  className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-colors ${
                    selectedDevices.includes(entry.deviceCode)
                      ? 'border-transparent'
                      : 'border-slate-600'
                  }`}
                  style={{ backgroundColor: selectedDevices.includes(entry.deviceCode) ? entry.color : 'transparent' }}
                >
                  {selectedDevices.includes(entry.deviceCode) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                </span>
                <span className="text-xs text-slate-200 flex-1 truncate">{entry.deviceName}</span>
                {!entry.hasData && (
                  <span className="text-[10px] text-slate-500">no data</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      <svg
        viewBox="0 0 600 180"
        className="w-full h-48 cursor-crosshair"
        preserveAspectRatio="none"
        role="img"
        aria-label="Telemetry chart"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
      >
        <text x="8" y="20" fill="#64748b" fontSize="9">100%</text>
        <text x="8" y="95" fill="#64748b" fontSize="9">50%</text>
        <text x="8" y="172" fill="#64748b" fontSize="9">0%</text>

        {deviceCharts.length > 0 ? (
          <>
            {deviceCharts.map((dc) => (
              <path
                key={dc.deviceCode}
                d={dc.linePath}
                fill="none"
                stroke={dc.color}
                strokeWidth="2.5"
                strokeLinecap="round"
                className="animate-[drawLine_1.5s_ease-out_both]"
                style={{ strokeDasharray: 2000, strokeDashoffset: 0 }}
              />
            ))}

            {hovered && (
              <>
                <line x1={hovered.x} y1="14" x2={hovered.x} y2="166" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
                <circle cx={hovered.x} cy={hovered.y} r="5" fill={hovered.color} stroke="#fff" strokeWidth="2" />
              </>
            )}
          </>
        ) : (
          <text x="300" y="95" textAnchor="middle" fill="#94a3b8" fontSize="14">No telemetry data available</text>
        )}

        {deviceCharts.length > 0 && deviceCharts[0].chartPoints
          .filter((_, i, arr) => i % Math.max(1, Math.floor(arr.length / 6)) === 0 || i === arr.length - 1)
          .map((point, idx) => (
            <text key={`t-${idx}`} x={point.x} y="178" textAnchor="middle" fill="#64748b" fontSize="8" className="select-none">
              {point.label}
            </text>
          ))}
      </svg>

      {hovered && (
        <div
          className="absolute pointer-events-none rounded-lg border border-slate-700 bg-slate-900/95 px-3 py-1.5 text-xs shadow-lg"
          style={{
            left: `${(hovered.x / 600) * 100}%`,
            bottom: `${100 - (hovered.y / 180) * 100 + 12}%`,
            transform: 'translateX(-50%)',
          }}
        >
          <p className="font-semibold" style={{ color: hovered.color }}>{hovered.value}%</p>
          <p className="text-slate-400">{hovered.label} · {hovered.deviceCode}</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ item }) {
  const Icon = item.icon;
  return (
    <MotionArticle
      variants={cardVariants}
      className="rounded-2xl border border-slate-700/70 bg-slate-950/50 backdrop-blur-sm overflow-hidden"
    >
      <div className={`h-1.5 w-full bg-linear-to-r ${item.accent}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-400">{item.title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-50">{item.value}</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-2.5">
            <Icon className={`h-5 w-5 ${item.textColor}`} />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-500">{item.note}</p>
      </div>
    </MotionArticle>
  );
}

function formatRelativeTime(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

export function AdminDashboard() {
  const navigate = useNavigate();

  const {
    devices,
    cards: snapshotCards,
    telemetrySeries,
    health,
    alerts,
    activities,
    isLoading,
    updatedAt,
  } = useDashboard();

  const cards = useMemo(() => (
    snapshotCards || {
      totalDevices: devices.length,
      activeDevices: devices.filter((item) => item.status === 'active').length,
      inactiveDevices: devices.filter((item) => item.status !== 'active').length,
      totalDistanceKm: 0,
      avgSpeed: 0,
      avgHdop: 0,
      activeRate: 0,
      avgSatUsed: 0,
      avgCn0: 0,
    }
  ), [snapshotCards, devices]);

  const stats = useMemo(() => ([
    {
      title: 'Active Devices',
      value: `${cards.activeDevices}/${cards.totalDevices}`,
      note: `${cards.activeRate}% sent data in last 5 minutes`,
      icon: RadioTower,
      accent: 'from-emerald-500/25 to-emerald-400/5',
      textColor: 'text-emerald-300',
    },
    {
      title: 'Distance (24h)',
      value: `${cards.totalDistanceKm} km`,
      note: 'Total distance from all devices today',
      icon: MapPinned,
      accent: 'from-sky-500/25 to-sky-400/5',
      textColor: 'text-sky-300',
    },
    {
      title: 'Average Speed',
      value: `${cards.avgSpeed} km/h`,
      note: `${cards.avgSatUsed} satellites used on average`,
      icon: Gauge,
      accent: 'from-amber-500/25 to-amber-400/5',
      textColor: 'text-amber-300',
    },
    {
      title: 'GNSS Quality',
      value: `HDOP ${cards.avgHdop}`,
      note: `Avg C/N₀: ${cards.avgCn0} dB-Hz · Lower HDOP = better`,
      icon: Satellite,
      accent: 'from-violet-500/25 to-violet-400/5',
      textColor: 'text-violet-300',
    },
  ]), [cards]);

  const health_ = health.length ? health : [
    { label: 'Excellent Signal', value: 0, tone: 'bg-emerald-400' },
    { label: 'Moderate Signal', value: 0, tone: 'bg-sky-400' },
    { label: 'Low Signal', value: 0, tone: 'bg-amber-400' },
  ];

  const telemetrySeries_ = useMemo(() => telemetrySeries, [telemetrySeries]);

  const updatedAtLabel = updatedAt ? formatRelativeTime(updatedAt) : '';

  return (
    <DashboardLayout>
      <MotionDiv
        variants={pageVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <MotionSection variants={sectionVariants} className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">GNSS Dashboard</h1>
          {updatedAtLabel && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400">
              <Clock className="h-3 w-3" />
              Updated {updatedAtLabel}
            </span>
          )}
        </MotionSection>

        {/* Stat Cards */}
        <MotionSection
          variants={cardGridVariants}
          initial="hidden"
          animate="visible"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {stats.map((item) => (
            <StatCard key={item.title} item={item} />
          ))}
        </MotionSection>

        {/* Live Telemetry + Fleet Health + Alerts */}
        <MotionSection variants={sectionVariants} className="mt-6 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          {/* Live Telemetry */}
          <article className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Live Telemetry</h2>
                <p className="text-sm text-slate-400 mt-1">GNSS quality score per device</p>
              </div>
              <span className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                {telemetrySeries_.length} devices
              </span>
            </div>

            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <ChartWithTooltip telemetrySeries={telemetrySeries_} devices={devices} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/55 p-3">
                <p className="text-xs text-slate-400">Peak Quality</p>
                <p className="mt-1 text-xl font-semibold text-sky-300">
                  {telemetrySeries_.length ? Math.max(...telemetrySeries_.flatMap((s) => s.points.map((p) => p.value))).toFixed(1) : '0.0'}%
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/55 p-3">
                <p className="text-xs text-slate-400">Avg Satellites</p>
                <p className="mt-1 text-xl font-semibold text-emerald-300">{cards.avgSatUsed}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/55 p-3">
                <p className="text-xs text-slate-400">Avg C/N₀</p>
                <p className="mt-1 text-xl font-semibold text-amber-300">{cards.avgCn0} dB-Hz</p>
              </div>
            </div>
          </article>

          {/* Right column: Fleet Health + Alerts */}
          <div className="grid gap-5">
            {/* Fleet Health */}
            <article className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-5">
              <h2 className="text-lg font-semibold text-slate-100">Fleet Health</h2>
              <p className="text-sm text-slate-400 mt-1">Signal classification across active devices</p>

              <div className="mt-5 space-y-4">
                {health_.map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="text-slate-400">{item.value}%</span>
                    </div>
                    <div className="mt-2 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${item.tone}`}
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            {/* Critical Alerts */}
            <article className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-semibold text-slate-100">Critical Alerts</h2>
                <AlertTriangle className="h-5 w-5 text-amber-300" />
              </div>
              <div className="mt-4 space-y-3">
                {!alerts.length && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
                    <p className="text-sm text-emerald-300">All systems normal. No alerts.</p>
                  </div>
                )}
                {alerts.map((alert, index) => (
                  <div key={`${alert.title}-${index}`} className="rounded-xl border border-slate-800 bg-slate-900/65 p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-200">{alert.title}</p>
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${getSeverityTone(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">{alert.detail}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </MotionSection>

        {/* Recent Operations */}
        <MotionSection variants={sectionVariants} className="mt-6 rounded-2xl border border-slate-700/70 bg-slate-950/50 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Recent Operations</h2>
              <p className="mt-1 text-sm text-slate-400">Latest updates from field devices</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">
              <Camera className="h-3.5 w-3.5" />
              {activities.length} updates
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-800">
                  <th className="py-3 pr-4 font-medium">Device</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                  <th className="py-3 pr-4 font-medium">Speed</th>
                  <th className="py-3 pr-4 font-medium">Position</th>
                  <th className="py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {!activities.length && (
                  <tr>
                    <td className="py-6 text-slate-400" colSpan={5}>No tracking activity available.</td>
                  </tr>
                )}
                {activities.map((activity) => (
                  <tr
                    key={activity.id}
                    onClick={() => navigate({ to: '/map' })}
                    className="border-b border-slate-900/90 cursor-pointer hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-3.5 pr-4 text-slate-200 font-medium">{activity.id}</td>
                    <td className="py-3.5 pr-4">
                      <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${getStatusBadge(activity.status)}`}>
                        {activity.status}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-slate-300">{activity.speed}</td>
                    <td className="py-3.5 pr-4 text-slate-400 font-mono text-xs">{activity.position}</td>
                    <td className="py-3.5 text-slate-400">{activity.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </MotionSection>
      </MotionDiv>

      {isLoading && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-slate-700 bg-slate-950/90 px-4 py-2 text-sm text-slate-200 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-sky-300" />
          Updating dashboard data
        </div>
      )}
    </DashboardLayout>
  );
}
