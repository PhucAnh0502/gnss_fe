import axiosInstance from '../api/axiosInstance.js';

const STATUS_COLORS = {
  pending: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  uploaded: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  synced: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  failed: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

const MODE_BADGE = {
  manual: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  auto: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
};

export const getSnapshotStatusClass = (status) => STATUS_COLORS[status] || STATUS_COLORS.pending;
export const getCaptureModeClass = (mode) => MODE_BADGE[mode] || MODE_BADGE.manual;

const toDateLabel = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
};

const toCoordinatesText = (snapshot) => {
  const latitude = Number(snapshot?.latitude);
  const longitude = Number(snapshot?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return 'N/A';
  }
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
};

export const normalizeSnapshot = (item) => ({
  id: item.id?.toString() || '',
  deviceId: item.deviceId?.toString() || item.device_id?.toString() || '',
  capturedAt: item.capturedAt || item.captured_at || new Date().toISOString(),
  capturedAtLabel: toDateLabel(item.capturedAt || item.captured_at),
  captureMode: (item.captureMode || item.capture_mode || 'manual').toString(),
  latitude: item.latitude ?? null,
  longitude: item.longitude ?? null,
  locationLabel: toCoordinatesText(item),
  altitude: Number(item.altitude ?? 0),
  speed: Number(item.speed ?? 0),
  heading: Number(item.heading ?? 0),
  hdop: Number(item.hdop ?? 0),
  satellitesCount: Number(item.satellites_count ?? item.satellitesCount ?? 0),
  satellitesUsed: Number(item.satellites_used ?? item.satellitesUsed ?? 0),
  avgCn0: Number(item.avg_cn0 ?? item.avgCn0 ?? 0),
  imageBucket: item.imageBucket || item.image_bucket || null,
  imagePath: item.imagePath || item.image_path || null,
  imageUrl: item.imageUrl && item.imageUrl.trim() !== '' ? item.imageUrl : null,
  mimeType: item.mimeType || item.mime_type || null,
  fileSizeBytes: item.fileSizeBytes || item.file_size_bytes || null,
  note: item.note || null,
  syncStatus: (item.syncStatus || item.sync_status || 'pending').toString(),
});

export const getDeviceSnapshots = async ({ deviceId, from, to, status }) => {
  const { data } = await axiosInstance.get(`/snapshots/devices/${deviceId}`, {
    params: {
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(status ? { status } : {}),
    },
  });

  return (data?.data || []).map(normalizeSnapshot);
};

export const getLatestTrackingForDevice = async (deviceId) => {
  const { data } = await axiosInstance.get(`/tracking/latest/${deviceId}`);
  return data?.data || null;
};

export const initSnapshot = async (payload) => {
  const { data } = await axiosInstance.post('/snapshots/init', payload);
  return data?.data || null;
};

export const uploadSnapshotFile = async ({ snapshotId, file }) => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await axiosInstance.post(`/snapshots/${snapshotId}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return normalizeSnapshot(data?.data || {});
};