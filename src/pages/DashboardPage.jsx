import {
  AlertTriangle,
  ArrowUpRight,
  Camera,
  Clock,
  Gauge,
  Loader2,
  MapPinned,
  RadioTower,
  Satellite,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { DashboardLayout } from '../components/DashboardLayout';
import { useDevices } from '../features/useDevices';
import { getDashboardSnapshot } from '../services/dashboardService.jsx';

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

const buildAreaPath = (series, width, height, padding) => {
  if (!series.length) return null;

  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;
  const stepX = series.length > 1 ? innerWidth / (series.length - 1) : innerWidth;

  const points = series.map((item, index) => {
    const x = padding + (index * stepX);
    const y = padding + ((100 - item.value) / 100) * innerHeight;
    return { x, y };
  });

  const line = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  const area = `${line} L${(padding + innerWidth).toFixed(2)} ${(height - padding).toFixed(2)} L${padding.toFixed(2)} ${(height - padding).toFixed(2)} Z`;

  return { line, area, points };
};

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

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data: devices = [] } = useDevices();

  const {
    data: snapshot,
    isLoading,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['dashboard-snapshot', devices.map((device) => device.id).join(',')],
    queryFn: () => getDashboardSnapshot(devices),
    enabled: devices.length > 0,
    refetchInterval: 60 * 1000,
    staleTime: 30 * 1000,
  });

  const cards = useMemo(() => (
    snapshot?.cards || {
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
  ), [snapshot?.cards, devices]);

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

  const health = snapshot?.health || [
    { label: 'Excellent Signal', value: 0, tone: 'bg-emerald-400' },
    { label: 'Moderate Signal', value: 0, tone: 'bg-sky-400' },
    { label: 'Low Signal', value: 0, tone: 'bg-amber-400' },
  ];

  const alerts = snapshot?.alerts || [];
  const activities = snapshot?.activities || [];
  const telemetrySeries = useMemo(() => snapshot?.telemetrySeries || [], [snapshot?.telemetrySeries]);

  const chart = useMemo(() => buildAreaPath(telemetrySeries, 600, 180, 14), [telemetrySeries]);

  const updatedAtLabel = dataUpdatedAt ? formatRelativeTime(new Date(dataUpdatedAt).toISOString()) : '';

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
                {telemetrySeries.length} devices
              </span>
            </div>

            <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <svg viewBox="0 0 600 180" className="w-full h-48" preserveAspectRatio="none" role="img" aria-label="Telemetry chart">
                <defs>
                  <linearGradient id="signalLine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                  <linearGradient id="signalArea" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Y-axis labels */}
                <text x="8" y="20" fill="#64748b" fontSize="9">100%</text>
                <text x="8" y="95" fill="#64748b" fontSize="9">50%</text>
                <text x="8" y="172" fill="#64748b" fontSize="9">0%</text>

                {chart ? (
                  <>
                    <path d={chart.area} fill="url(#signalArea)" />
                    <path d={chart.line} fill="none" stroke="url(#signalLine)" strokeWidth="3.5" strokeLinecap="round" />
                    {/* Data point dots */}
                    {chart.points.map((point, i) => (
                      <circle key={i} cx={point.x} cy={point.y} r="4" fill="#22d3ee" stroke="#0f172a" strokeWidth="2" />
                    ))}
                  </>
                ) : (
                  <text x="300" y="95" textAnchor="middle" fill="#94a3b8" fontSize="14">No telemetry data available</text>
                )}

                {/* X-axis device labels */}
                {telemetrySeries.length > 0 && chart?.points && chart.points.map((point, i) => (
                  <text
                    key={`label-${i}`}
                    x={point.x}
                    y="178"
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="8"
                    className="select-none"
                  >
                    {telemetrySeries[i]?.label?.slice(-4) || ''}
                  </text>
                ))}
              </svg>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/55 p-3">
                <p className="text-xs text-slate-400">Peak Quality</p>
                <p className="mt-1 text-xl font-semibold text-sky-300">
                  {telemetrySeries.length ? Math.max(...telemetrySeries.map((item) => item.value)).toFixed(1) : '0.0'}%
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
                {health.map((item) => (
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
