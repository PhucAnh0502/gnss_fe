import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera,
  ChevronLeft,
  ChevronRight,
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
  X,
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

const statusOptions = ['all', 'pending', 'uploaded', 'failed'];

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
  const [modalOpen, setModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;
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
  const totalPages = Math.max(1, Math.ceil(snapshots.length / ITEMS_PER_PAGE));
  const paginatedSnapshots = snapshots.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.id === selectedSnapshotId) || null,
    [snapshots, selectedSnapshotId],
  );

  // Close modal if selected snapshot is no longer in the list
  useEffect(() => {
    if (modalOpen && selectedSnapshotId && !snapshots.find((s) => s.id === selectedSnapshotId)) {
      setModalOpen(false);
    }
  }, [snapshots, selectedSnapshotId, modalOpen]);

  // Close modal on Escape key and prevent body scroll
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [modalOpen]);

  // Reset page when device or status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDeviceId, selectedStatus]);

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
          <StatCard label="Uploaded" value={counters.uploaded || 0} description="File stored successfully" icon={Satellite} accentColor="emerald" />
          <StatCard label="Failed" value={counters.failed || 0} description="Upload failed" icon={ShieldCheck} accentColor="rose" />
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
                      setCurrentPage(1);
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
              <>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {paginatedSnapshots.map((snapshot) => {
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
                          onClick={() => {
                            setSelectedSnapshotId(snapshot.id);
                            setModalOpen(true);
                          }}
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

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-5 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900/60 p-2 text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-900/60 disabled:hover:text-slate-300"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          if (totalPages <= 7) return true;
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - currentPage) <= 1) return true;
                          return false;
                        })
                        .reduce((acc, page, idx, arr) => {
                          if (idx > 0 && page - arr[idx - 1] > 1) {
                            acc.push('ellipsis-' + page);
                          }
                          acc.push(page);
                          return acc;
                        }, [])
                        .map((item) => {
                          if (typeof item === 'string') {
                            return (
                              <span key={item} className="px-1 text-xs text-slate-500">
                                …
                              </span>
                            );
                          }
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => setCurrentPage(item)}
                              className={`inline-flex items-center justify-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                                item === currentPage
                                  ? 'border-brand-blue/50 bg-brand-blue/15 text-white'
                                  : 'border-slate-700/60 bg-slate-900/60 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                              }`}
                            >
                              {item}
                            </button>
                          );
                        })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center justify-center rounded-lg border border-slate-700/60 bg-slate-900/60 p-2 text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-900/60 disabled:hover:text-slate-300"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    <span className="ml-3 text-xs text-slate-500">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, snapshots.length)} / {snapshots.length}
                    </span>
                  </div>
                )}
              </>
            )}
          </MotionSection>
        </div>

        {/* ===== SNAPSHOT DETAIL MODAL ===== */}
        {createPortal(
          <AnimatePresence>
            {modalOpen && selectedSnapshot && (
              <motion.div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Backdrop */}
                <motion.div
                  className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setModalOpen(false)}
                />

                {/* Modal content */}
                <motion.div
                  className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700/50 bg-slate-950/95 backdrop-blur-xl shadow-2xl"
                  initial={{ opacity: 0, scale: 0.92, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 30 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                >
                  {/* Modal header */}
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-700/50 bg-slate-950/90 backdrop-blur-sm px-6 py-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">Snapshot Detail</h2>
                      <p className="mt-0.5 text-xs text-slate-500">Full metadata and image preview</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedSnapshot.imageUrl && (
                        <a
                          href={selectedSnapshot.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800/60 hover:text-white transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" /> Download
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => setModalOpen(false)}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-700/60 bg-slate-900/60 p-2 text-slate-400 hover:bg-slate-800/60 hover:text-white transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Modal body */}
                  <div className="p-6 space-y-6">
                    {/* Snapshot detail */}
                    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                      {/* Image preview */}
                      <div className="overflow-hidden rounded-xl border border-slate-800/60 bg-slate-900/40">
                        <SnapshotImage
                          src={selectedSnapshot.imageUrl}
                          alt={`${selectedDevice?.deviceName || 'Device'} snapshot detail`}
                          className="h-80 md:h-[28rem] w-full"
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
                        {selectedSnapshot.note && <DetailRow label="Note" value={selectedSnapshot.note} />}
                      </div>
                    </div>

                    {/* Current GNSS Position */}
                    {selectedDeviceId && latestPoint && (
                      <div className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="text-sm font-semibold text-white">Current GNSS Position</h3>
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
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
      </div>
    </DashboardLayout>
  );
}
