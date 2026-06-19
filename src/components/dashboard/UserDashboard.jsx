import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from '@tanstack/react-router';
import {
  Camera,
  Clock,
  Gauge,
  MapPinned,
  Radio,
  Satellite,
  Smartphone,
  Map,
  History,
  Loader2,
} from 'lucide-react';
import { useDashboard } from '../../features/useDashboard';

const MotionSection = motion.section;

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.28, ease: 'easeOut' } },
};

function formatRelativeTime(isoString) {
  if (!isoString) return 'N/A';
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function UserDashboard() {
  const navigate = useNavigate();
  const { devices, cards, activities, isLoading, updatedAt } = useDashboard();

  const deviceCards = useMemo(() => {
    return devices.map((device) => {
      const activity = activities.find((a) => a.id === device.deviceCode);
      return {
        ...device,
        speed: activity?.speed || '0 km/h',
        position: activity?.position || 'N/A',
        time: activity?.time || 'N/A',
        status: device.status,
      };
    });
  }, [devices, activities]);

  const stats = useMemo(() => {
    if (!cards) return null;
    return {
      totalDevices: cards.totalDevices,
      activeDevices: cards.activeDevices,
      totalDistanceKm: cards.totalDistanceKm,
      avgSpeed: cards.avgSpeed,
      avgHdop: cards.avgHdop,
      avgCn0: cards.avgCn0,
      avgSatUsed: cards.avgSatUsed,
    };
  }, [cards]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Header */}
      <MotionSection variants={sectionVariants} initial="hidden" animate="visible" className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50">My Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Quick overview of your devices and tracking activity.</p>
        </div>
        {updatedAt && (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400">
            <Clock className="h-3 w-3" />
            Updated {formatRelativeTime(updatedAt)}
          </span>
        )}
      </MotionSection>

      {/* Quick Stats */}
      {stats && (
        <MotionSection variants={sectionVariants} initial="hidden" animate="visible" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
          <motion.div variants={cardVariants} className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">My Devices</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stats.activeDevices}/{stats.totalDevices}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-2.5">
                <Smartphone className="h-5 w-5 text-emerald-300" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">{stats.activeDevices} online now</p>
          </motion.div>

          <motion.div variants={cardVariants} className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">Distance Today</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stats.totalDistanceKm} km</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-2.5">
                <MapPinned className="h-5 w-5 text-sky-300" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">Total from all your devices</p>
          </motion.div>

          <motion.div variants={cardVariants} className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">Avg Speed</p>
                <p className="mt-2 text-3xl font-semibold text-white">{stats.avgSpeed} km/h</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-2.5">
                <Gauge className="h-5 w-5 text-amber-300" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">{stats.avgSatUsed} satellites avg</p>
          </motion.div>

          <motion.div variants={cardVariants} className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-400">GNSS Quality</p>
                <p className="mt-2 text-3xl font-semibold text-white">HDOP {stats.avgHdop}</p>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-2.5">
                <Satellite className="h-5 w-5 text-violet-300" />
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">C/N₀: {stats.avgCn0} dB-Hz</p>
          </motion.div>
        </MotionSection>
      )}

      {/* Device Status Cards */}
      <MotionSection variants={sectionVariants} initial="hidden" animate="visible" className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Device Status</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {deviceCards.map((device) => (
            <motion.div
              key={device.id}
              variants={cardVariants}
              className="rounded-2xl border border-slate-700/70 bg-slate-950/50 p-5 hover:border-slate-600/60 transition-colors cursor-pointer"
              onClick={() => navigate({ to: '/map' })}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${device.status === 'active' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                  <div>
                    <p className="text-sm font-semibold text-white">{device.deviceName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{device.deviceCode}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full border font-medium ${
                  device.status === 'active'
                    ? 'text-emerald-300 border-emerald-400/30 bg-emerald-500/10'
                    : 'text-slate-400 border-slate-600/30 bg-slate-500/10'
                }`}>
                  {device.status === 'active' ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-slate-900/50 px-2.5 py-2">
                  <p className="text-slate-500">Speed</p>
                  <p className="text-slate-200 font-medium mt-0.5">{device.speed}</p>
                </div>
                <div className="rounded-lg bg-slate-900/50 px-2.5 py-2">
                  <p className="text-slate-500">Last seen</p>
                  <p className="text-slate-200 font-medium mt-0.5">{device.time}</p>
                </div>
              </div>
            </motion.div>
          ))}

          {deviceCards.length === 0 && !isLoading && (
            <div className="col-span-full rounded-2xl border border-dashed border-slate-700 p-8 text-center">
              <Smartphone className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No devices yet. Add a device to get started.</p>
            </div>
          )}
        </div>
      </MotionSection>

      {/* Quick Actions */}
      <MotionSection variants={sectionVariants} initial="hidden" animate="visible">
        <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => navigate({ to: '/map' })}
            className="flex items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-950/50 p-4 text-left hover:border-blue-400/30 hover:bg-blue-500/5 transition-colors"
          >
            <div className="rounded-lg bg-blue-500/15 p-2.5">
              <Map className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Live Map</p>
              <p className="text-xs text-slate-400">Track devices in real-time</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: '/history' })}
            className="flex items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-950/50 p-4 text-left hover:border-emerald-400/30 hover:bg-emerald-500/5 transition-colors"
          >
            <div className="rounded-lg bg-emerald-500/15 p-2.5">
              <History className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">View History</p>
              <p className="text-xs text-slate-400">Browse tracking records</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate({ to: '/snapshots' })}
            className="flex items-center gap-3 rounded-xl border border-slate-700/70 bg-slate-950/50 p-4 text-left hover:border-amber-400/30 hover:bg-amber-500/5 transition-colors"
          >
            <div className="rounded-lg bg-amber-500/15 p-2.5">
              <Camera className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Snapshots</p>
              <p className="text-xs text-slate-400">View captured photos</p>
            </div>
          </button>
        </div>
      </MotionSection>

      {isLoading && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-slate-700 bg-slate-950/90 px-4 py-2 text-sm text-slate-200 flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-sky-300" />
          Loading data
        </div>
      )}
    </motion.div>
  );
}
