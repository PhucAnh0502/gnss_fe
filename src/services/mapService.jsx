import axiosInstance from '../api/axiosInstance.js';
import { io } from 'socket.io-client';

export const HANOI_CENTER = [21.0285, 105.8542];
export const HISTORY_LOOKBACK_HOURS = 24;
export const TRACK_COLORS = ['#38bdf8', '#f97316', '#a78bfa', '#34d399', '#f43f5e', '#eab308'];

export const getSocketBaseUrl = (configured = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api') => {
  try {
    const url = new URL(configured);
    const isLoopbackHost = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    const runtimeHost = window.location.hostname;
    const isRuntimeLoopback = ['localhost', '127.0.0.1', '::1'].includes(runtimeHost);

    if (isLoopbackHost && !isRuntimeLoopback) {
      url.hostname = runtimeHost;
    }

    return url.toString().replace(/\/api\/?$/, '').replace(/\/$/, '');
  } catch {
    return configured.replace(/\/api\/?$/, '');
  }
};

export const buildDisplayDevices = (devices) => devices.map((item, index) => ({
  id: item.id || `device-${index}`,
  deviceName: item.deviceName || `Device ${index + 1}`,
  deviceCode: item.deviceCode,
  status: item.status || 'inactive',
}));

export const buildDeviceTracks = ({ displayDevices, historyTrackByCode, liveTrackByCode }) => (
  displayDevices.map((device, index) => {
    const liveTrack = liveTrackByCode[device.deviceCode] || [];
    const historyTrack = historyTrackByCode[device.deviceCode] || [];
    const points = liveTrack.length ? [...historyTrack, ...liveTrack].slice(-180) : historyTrack;

    return {
      id: device.id,
      deviceCode: device.deviceCode,
      deviceName: device.deviceName,
      status: device.status,
      color: TRACK_COLORS[index % TRACK_COLORS.length],
      points,
      isLive: liveTrack.length > 0,
    };
  })
);

export const buildDevicePoints = (deviceTracks) => (
  deviceTracks.map((track) => ({
    deviceCode: track.deviceCode,
    deviceName: track.deviceName,
    status: track.status,
    isLive: track.isLive,
    point: track.points[track.points.length - 1] || null,
  }))
);

export const buildSelectedDeviceTrack = (deviceTracks, selectedDevice) => (
  selectedDevice ? deviceTracks.find((track) => track.id === selectedDevice.id) || null : null
);

export const buildFixSvidSet = (latestPoint) => {
  const statusList = latestPoint?.raw?.status || [];
  return new Set(statusList.filter((s) => s.usedInFix).map((s) => s.svid));
};

export const buildAllSatelliteIds = (deviceTracks) => {
  const ids = new Set();
  deviceTracks.forEach((track) => {
    const latest = track.points[track.points.length - 1];
    (latest?.raw?.status || []).forEach((status) => ids.add(status.svid));
  });
  return [...ids].sort((a, b) => a - b);
};

export async function loadHistoryTracks(displayDevices) {
  if (!displayDevices.length) {
    return {};
  }

  const to = new Date();
  const from = new Date(to.getTime() - HISTORY_LOOKBACK_HOURS * 60 * 60 * 1000);

  const entries = await Promise.all(displayDevices.map(async (device) => {
    try {
      const response = await axiosInstance.get(`/tracking/history/${device.id}`, {
        params: {
          from: from.toISOString(),
          to: to.toISOString(),
        },
      });

      const history = response.data?.data || [];
      const points = history.map((item) => {
        const coordinates = item?.location?.coordinates || [];
        const lng = Number(coordinates[0]);
        const lat = Number(coordinates[1]);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return null;
        }

        return {
          trackingId: item.id,
          deviceCode: device.deviceCode,
          lat,
          lng,
          mapLat: lat,
          mapLng: lng,
          ts: item.timestamp ? Math.floor(new Date(item.timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000),
          sp: item.speed ?? 0,
          hd: item.heading ?? 0,
          alt: item.altitude ?? 0,
          hdop: item.hdop ?? 0,
          sat: item.satellites_count ?? 0,
          satUsed: item.satellites_used ?? 0,
          avgCn0: item.avg_cn0 ?? 0,
          raw: null,
        };
      }).filter(Boolean);

      if (!points.length) {
        const latestResponse = await axiosInstance.get(`/tracking/latest/${device.id}`);
        const latest = latestResponse.data?.data;
        const latestCoordinates = latest?.location?.coordinates || [];
        const latestLng = Number(latestCoordinates[0]);
        const latestLat = Number(latestCoordinates[1]);

        if (Number.isFinite(latestLat) && Number.isFinite(latestLng)) {
          return [device.deviceCode, [{
            trackingId: latest.id,
            deviceCode: device.deviceCode,
            lat: latestLat,
            lng: latestLng,
            mapLat: latestLat,
            mapLng: latestLng,
            ts: latest.timestamp ? Math.floor(new Date(latest.timestamp).getTime() / 1000) : Math.floor(Date.now() / 1000),
            sp: latest.speed ?? 0,
            hd: latest.heading ?? 0,
            alt: latest.altitude ?? 0,
            hdop: latest.hdop ?? 0,
            sat: latest.satellites_count ?? 0,
            satUsed: latest.satellites_used ?? 0,
            avgCn0: latest.avg_cn0 ?? 0,
            raw: null,
          }]];
        }
      }

      return [device.deviceCode, points];
    } catch {
      return [device.deviceCode, []];
    }
  }));

  return Object.fromEntries(entries);
}

export function subscribeLiveTracks({
  displayDevices,
  socketBaseUrl,
  onPoint,
}) {
  if (!displayDevices.length) {
    return () => {};
  }

  const socket = io(socketBaseUrl, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  const handlers = [];

  displayDevices.forEach((device) => {
    const eventName = `live:${device.deviceCode}`;

    const handler = (point) => {
      if (typeof point?.lat !== 'number' || typeof point?.lng !== 'number') {
        return;
      }

      const ts = typeof point.ts === 'number'
        ? (point.ts > 1_000_000_000_000 ? Math.floor(point.ts / 1000) : point.ts)
        : Math.floor(Date.now() / 1000);

      onPoint(device.deviceCode, {
        ...point,
        deviceCode: device.deviceCode,
        ts,
        mapLat: point.lat,
        mapLng: point.lng,
        sp: point.sp ?? 0,
        hd: point.hd ?? 0,
        alt: point.alt ?? 0,
        hdop: point.hdop ?? 0,
        sat: point.sat ?? 0,
        satUsed: point.satUsed ?? 0,
        avgCn0: point.avgCn0 ?? 0,
        raw: point.raw ?? null,
      });
    };

    socket.on(eventName, handler);
    handlers.push({ eventName, handler });
  });

  return () => {
    handlers.forEach(({ eventName, handler }) => {
      socket.off(eventName, handler);
    });
    socket.disconnect();
  };
}
