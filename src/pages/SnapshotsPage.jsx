import { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  Clock,
  Download,
  ImageOff,
  MapPin,
  RefreshCw,
  Satellite,
  ShieldCheck,
  Upload,
  Loader2,
  Filter,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { useDevices } from '../features/useDevices';
import {
  getDeviceSnapshots,
  getLatestTrackingForDevice,
  getCaptureModeClass,
  getSnapshotStatusClass,
} from '../services/snapshotService.jsx';

const MotionSection = motion.section;

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const statusOptions = ['all', 'pending', 'uploaded', 'synced', 'failed'];

function StatCard({ label, value, description, icon: Icon, accentColor = 'blue' }) {
  const colorMap = {
    blue: 'bg-blue-500/12 text-blue-300 border-blue-500/20',
    amber: 'bg-amber-500/12 text-amber-300 border-amber-500/20',
    emerald: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/20',
    violet: 'bg-violet-500/12 text-violet-300 border-violet-500/20',
  };

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-950/40 backdrop-blur-sm p-5 transition-all hover:border-slate-600/60">
      <div className={`inline-flex rounded-xl border p-2.5 ${colorMap[accentColor]}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="mt-4 text-sm text-slate-400">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-1.5 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-3.5 py-2.5">
      <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-medium">{label}</p>
      <p className="mt-1 text-sm text-slate-200">{value || '—'}</p>
    </div>
  );
}

function EmptyGallery({ isLoading, hasDevice }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {isLoading ? (
        <>
          <Loader2 className="h-8 w-8 text-slate-500 animate-spin" />
          <p className="mt-4 text-sm text-slate-400">Loading snapshots...</p>
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-6">
            <ImageOff className="h-10 w-10 text-slate-600" />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-300">
            {hasDevice ? 'No snapshots found' : 'Select a device'}
          </p>
          <p className="mt-1 text-xs text-slate-500 max-w-xs">
            {hasDevice
              ? 'No snapshots match the current filter. Try changing the status filter or check if the device has captured any snapshots.'
              : 'Choose a device from the list to view its snapshots.'}
          </p>
        </>
      )}
    </div>
  );
}

function SnapshotImage({ src, alt, className = '' }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src || hasError) {
    return (
      <div className={`flex items-center justify-center bg-slate-900/80 ${className}`}>
        <div className="text-center">
          <ImageOff className="h-8 w-8 text-slate-600 mx-auto" />
          <p className="mt-2 text-xs text-slate-500">No image available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
          <Loader2 className="h-6 w-6 text-slate-500 animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`object-cover w-full h-full ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
        onError={() => { setHasError(true); setIsLoading(false); }}
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
}

export default function SnapshotsPage() {
  const queryClient = useQueryClient();
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSnapshotId, setSelectedSnapshotId] = useState(null);
  const { data: devices = [], isLoading: devicesLoading, isError: devicesError } = useDevices();

  useEffect(() => {
    if (devices.length && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  const selectedDevice = useMemo(
    () => devices.find((device) => device.id === selectedDeviceId) || null,
    [devices, selectedDeviceId],
  );

  const latestTrackingQuery = useQuery({
    queryKey: ['snapshot-latest-tracking', selectedDeviceId],
    queryFn: () => getLatestTrackingForDevice(selectedDeviceId),
    enabled: Boolean(selectedDeviceId),
    staleTime: 30 * 1000,
  });

  const snapshotsQuery = useQuery({
    queryKey: ['device-snapshots', selectedDeviceId, selectedStatus],
    queryFn: () => getDeviceSnapshots({
      deviceId: selectedDeviceId,
      status: selectedStatus === 'all' ? undefined : selectedStatus,
    }),
    enabled: Boolean(selectedDeviceId),
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });

  const snapshots = snapshotsQuery.data || [];
  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) || snapshots[0] || null,
    [snapshots, selectedSnapshotId],
  );

  useEffect(() => {
    if (selectedSnapshot && selectedSnapshot.id !== selectedSnapshotId) {
      setSelectedSnapshotId(selectedSnapshot.id);
    }
  }, [selectedSnapshot?.id]);

  const counters = useMemo(() => snapshots.reduce((acc, item) => {
    acc[item.syncStatus] = (acc[item.syncStatus] || 0) + 1;
    return acc;
  }, {}), [snapshots]);

  const refreshSnapshots = async () => {
    await queryClient.invalidateQueries({ queryKey: ['device-snapshots', selectedDeviceId] });
    await queryClient.invalidateQueries({ queryKey: ['snapshot-latest-tracking', selectedDeviceId] });
  };

  const latestPoint = latestTrackingQuery.data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ===== HEADER ===== */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Snapshots</h1>
            <p className="mt-1.5 text-sm text-slate-400 max-w-lg">
              View field snapshots captured by devices. Each snapshot includes GPS metadata recorded at the moment of capture.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshSnapshots}
            className="btn-outline"
            disabled={snapshotsQuery.isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${snapshotsQuery.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* ===== ERROR BANNER ===== */}
        {snapshotsQuery.isError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/8 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-300">Failed to load snapshots</p>
              <p className="mt-1 text-xs text-red-400/80">
                {snapshotsQuery.error?.response?.data?.message || snapshotsQuery.error?.message || 'Please check your connection and try again.'}
              </p>
            </div>
          </div>
        )}

        {/* ===== STATS ===== */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Snapshots" value={snapshots.length} description="All records for this device" icon={Camera} accentColor="blue" />
          <StatCard label="Pending Upload" value={counters.pending || 0} description="Awaiting file upload" icon={Upload} accentColor="amber" />
          <StatCard label="Synced" value={counters.synced || 0} description="Verified and complete" icon={ShieldCheck} accentColor="emerald" />
          <StatCard label="Uploaded" value={counters.uploaded || 0} description="File stored successfully" icon={Satellite} accentColor="violet" />
        </div>

        {/* ===== MAIN CONTENT ===== */}
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          {/* Device selector panel */}
          <MotionSection variants={cardVariants} initial="hidden" animate="visible" className="rounded-2xl border border-slate-700/50 bg-slate-950/40 backdrop-blur-sm p-5">
            <h2 className="text-base font-semibold text-white">Devices</h2>
            <p className="mt-1 text-xs text-slate-500">Select a device to view its snapshots</p>

            {/* Status filter */}
            <div className="mt-4">
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <Filter className="h-3.5 w-3.5" />
                <span>Filter by status</span>
              </div>
              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="w-full rounded-xl border border-slate-700/60 bg-slate-900/60 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-brand-blue/50 transition-colors"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Device list */}
            <div className="mt-4 space-y-2.5 max-h-[400px] overflow-y-auto">
              {devicesLoading && (
                <div className="flex items-center gap-2 py-4 justify-center text-xs text-slate-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading devices...
                </div>
              )}

              {devices.map((device) => {
                const isActive = device.id === selectedDeviceId;
                return (
                  <button
                    key={device.id}
                    type="button"
                    onClick={() => {
                      setSelectedDeviceId(device.id);
                      setSelectedSnapshotId(null);
                    }}
                    className={`w-full rounded-xl border p-3.5 text-left transition-all ${
                      isActive
                        ? 'border-brand-blue/40 bg-brand-blue/8 shadow-sm'
                        : 'border-slate-800/60 bg-slate-900/30 hover:bg-slate-800/40 hover:border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                          {device.deviceName}
                        </p>
                        <p className="mt-0.5 text-[11px] font-mono text-slate-500 truncate">{device.deviceCode}</p>
                      </div>
                      <span className={`shrink-0 w-2 h-2 rounded-full ${device.status === 'active' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    </div>
                  </button>
                );
              })}

              {devicesError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/8 p-3 text-xs text-red-300">
                  Failed to load devices. Please check your connection.
                </div>
              )}
            </div>
          </MotionSection>

          {/* Gallery */}
          <MotionSection variants={cardVariants} initial="hidden" animate="visible" className="rounded-2xl border border-slate-700/50 bg-slate-950/40 backdrop-blur-sm p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">Gallery</h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  {selectedDevice ? `${selectedDevice.deviceName} — ${snapshots.length} snapshot${snapshots.length !== 1 ? 's' : ''}` : 'Select a device'}
                </p>
              </div>
              {selectedDevice && (
                <span className="rounded-lg border border-slate-700/60 bg-slate-900/60 px-2.5 py-1 text-[11px] font-mono text-slate-400">
                  {selectedDevice.deviceCode}
                </span>
              )}
            </div>

            {snapshots.length === 0 ? (
              <EmptyGallery isLoading={snapshotsQuery.isLoading} hasDevice={Boolean(selectedDeviceId)} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {snapshots.map((snapshot) => {
                    const isSelected = snapshot.id === selectedSnapshot?.id;

                    return (
                      <motion.button
                        key={snapshot.id}
                        type="button"
                        layout
                        initial={{ opacity: 0, scale: 0.97 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        onClick={() => setSelectedSnapshotId(snapshot.id)}
                        className={`group overflow-hidden rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'border-brand-blue/50 bg-brand-blue/5 ring-1 ring-brand-blue/20'
                            : 'border-slate-800/60 bg-slate-900/30 hover:bg-slate-800/40 hover:border-slate-700/60'
                        }`}
                      >
                        {/* Image */}
                        <div className="relative h-32 bg-slate-900">
                          <SnapshotImage
                            src={snapshot.imageUrl}
                            alt={`${selectedDevice?.deviceName || 'Device'} snapshot`}
                            className="h-full w-full"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />

                          {/* Badges */}
                          <div className="absolute top-2 left-2 flex items-center gap-1.5">
                            <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${getSnapshotStatusClass(snapshot.syncStatus)}`}>
                              {snapshot.syncStatus}
                            </span>
                          </div>

                          {/* View indicator on hover */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="rounded-full bg-white/10 backdrop-blur-sm p-2">
                              <Eye className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-slate-200 truncate">
                              {snapshot.capturedAtLabel}
                            </p>
                            <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-medium ${getCaptureModeClass(snapshot.captureMode)}`}>
                              {snapshot.captureMode}
                            </span>
                          </div>
                          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {snapshot.locationLabel}
                            </span>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </MotionSection>
        </div>

        {/* ===== DETAIL PANEL ===== */}
        <MotionSection variants={cardVariants} initial="hidden" animate="visible" className="rounded-2xl border border-slate-700/50 bg-slate-950/40 backdrop-blur-sm p-5 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">Snapshot Detail</h2>
              <p className="mt-0.5 text-xs text-slate-500">
                {selectedSnapshot ? 'Full metadata and image preview' : 'Select a snapshot from the gallery'}
              </p>
            </div>
            {selectedSnapshot?.imageUrl && (
              <a
                href={selectedSnapshot.imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors"
              >
                <Download className="h-3.5 w-3.5" /> Download image
              </a>
            )}
          </div>

          {selectedSnapshot ? (
            <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
              {/* Image preview */}
              <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/40">
                <SnapshotImage
                  src={selectedSnapshot.imageUrl}
                  alt={`${selectedDevice?.deviceName || 'Device'} snapshot detail`}
                  className="h-80 md:h-96 w-full"
                />
              </div>

              {/* Metadata */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${getSnapshotStatusClass(selectedSnapshot.syncStatus)}`}>
                    {selectedSnapshot.syncStatus}
                  </span>
                  <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${getCaptureModeClass(selectedSnapshot.captureMode)}`}>
                    {selectedSnapshot.captureMode}
                  </span>
                </div>

                <DetailRow label="Device" value={`${selectedDevice?.deviceName || '—'} (${selectedDevice?.deviceCode || selectedSnapshot.deviceId})`} />
                <DetailRow label="Captured" value={selectedSnapshot.capturedAtLabel} />
                <DetailRow label="Location" value={selectedSnapshot.locationLabel} />
                <DetailRow label="GNSS Quality" value={`HDOP ${selectedSnapshot.hdop} · ${selectedSnapshot.satellitesUsed}/${selectedSnapshot.satellitesCount} satellites`} />
                <DetailRow label="Motion" value={`${selectedSnapshot.speed} km/h · Heading ${selectedSnapshot.heading}°`} />
                <DetailRow label="Tracking ID" value={selectedSnapshot.trackingId || 'Not linked'} />
                {selectedSnapshot.note && <DetailRow label="Note" value={selectedSnapshot.note} />}
                {selectedSnapshot.imagePath && <DetailRow label="Storage Path" value={selectedSnapshot.imagePath} />}
              </div>
            </div>
          ) : (
            <div className="mt-5 flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-2xl border border-dashed border-slate-700/60 bg-slate-900/20 p-5">
                <Camera className="h-8 w-8 text-slate-600" />
              </div>
              <p className="mt-4 text-sm text-slate-400">
                {snapshotsQuery.isLoading ? 'Loading...' : 'Select a snapshot to view its details'}
              </p>
            </div>
          )}
        </MotionSection>

        {/* ===== LATEST TRACKING METADATA ===== */}
        {selectedDeviceId && latestPoint && (
          <MotionSection variants={cardVariants} initial="hidden" animate="visible" className="rounded-2xl border border-slate-700/50 bg-slate-950/40 backdrop-blur-sm p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">Current GNSS Position</h2>
                <p className="mt-0.5 text-xs text-slate-500">Latest tracking data for the selected device</p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 bg-slate-900/60 px-2.5 py-1.5 text-[11px] text-slate-400">
                <Clock className="h-3 w-3" />
                {new Date(latestPoint.timestamp).toLocaleString()}
              </span>
            </div>

            <div className="mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
              <DetailRow
                label="Position"
                value={latestPoint.location?.coordinates
                  ? `${latestPoint.location.coordinates[1].toFixed(6)}, ${latestPoint.location.coordinates[0].toFixed(6)}`
                  : 'N/A'}
              />
              <DetailRow label="Speed" value={`${Number(latestPoint.speed || 0).toFixed(1)} km/h`} />
              <DetailRow label="HDOP" value={Number(latestPoint.hdop || 0).toFixed(2)} />
              <DetailRow label="Satellites" value={`${latestPoint.satellites_used || 0} / ${latestPoint.satellites_count || 0}`} />
            </div>
          </MotionSection>
        )}
      </div>
    </DashboardLayout>
  );
}
