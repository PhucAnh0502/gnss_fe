import axiosInstance from '../api/axiosInstance.js';

const HISTORY_LOOKBACK_HOURS = 24;

const clampPercent = (value) => Math.max(0, Math.min(100, value));

const toFixedNumber = (value, digits = 1) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Number(value.toFixed(digits));
};

const toCoordinatesText = (point) => {
  const coordinates = point?.location?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return 'N/A';
  }

  const [lng, lat] = coordinates;
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) {
    return 'N/A';
  }

  return `${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}`;
};

const getTodayRange = () => {
  const now = new Date();
  const from = new Date(now.getTime() - HISTORY_LOOKBACK_HOURS * 60 * 60 * 1000);
  return { from: from.toISOString(), to: now.toISOString() };
};

const safeAverage = (values) => {
  const list = values.filter((item) => Number.isFinite(item));
  if (!list.length) {
    return 0;
  }

  const total = list.reduce((sum, current) => sum + current, 0);
  return total / list.length;
};

const formatRelativeTime = (isoString) => {
  if (!isoString) {
    return 'N/A';
  }

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return 'N/A';
  }

  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getActivityStatus = (point) => {
  const speed = Number(point?.speed || 0);

  if (speed > 10) {
    return 'In transit';
  }

  if (speed > 0) {
    return 'Slow move';
  }

  return 'Idle';
};

export async function getDashboardSnapshot(devices) {
  if (!Array.isArray(devices) || devices.length === 0) {
    return {
      cards: {
        totalDevices: 0,
        activeDevices: 0,
        inactiveDevices: 0,
        totalDistanceKm: 0,
        avgSpeed: 0,
        avgHdop: 0,
        activeRate: 0,
        avgSatUsed: 0,
        avgCn0: 0,
      },
      telemetrySeries: [],
      health: [
        { label: 'Excellent Signal', value: 0, tone: 'bg-emerald-400' },
        { label: 'Moderate Signal', value: 0, tone: 'bg-sky-400' },
        { label: 'Low Signal', value: 0, tone: 'bg-amber-400' },
      ],
      alerts: [],
      activities: [],
      updatedAt: new Date().toISOString(),
    };
  }

  const range = getTodayRange();

  const perDeviceData = await Promise.all(
    devices.map(async (device) => {
      try {
        const [latestRes, historyRes] = await Promise.all([
          axiosInstance.get(`/tracking/latest/${device.id}`),
          axiosInstance.get(`/tracking/history/${device.id}`, {
            params: {
              from: range.from,
              to: range.to,
            },
          }),
        ]);

        return {
          device,
          latest: latestRes.data?.data || null,
          history: historyRes.data?.data || [],
          summary: historyRes.data?.summary || {},
        };
      } catch {
        return {
          device,
          latest: null,
          history: [],
          summary: {},
        };
      }
    })
  );

  const totalDevices = devices.length;
  const activeDevices = devices.filter((item) => item.status === 'active').length;
  const inactiveDevices = devices.filter((item) => item.status !== 'active').length;

  const allLatest = perDeviceData.map((item) => item.latest).filter(Boolean);

  // Use ALL history points (24h) for meaningful averages instead of just latest point
  // Filter out low-quality points (indoor/no-fix) for stats calculation
  const allHistoryPoints = perDeviceData.flatMap((item) => item.history || []);
  const qualityHistoryPoints = allHistoryPoints.filter((item) => {
    const hdop = Number(item?.hdop || 0);
    return hdop > 0 && hdop < 10; // Only include points with reasonable GPS fix
  });

  const totalDistanceMeter = perDeviceData.reduce((sum, item) => {
    const distance = Number(item.summary?.totalDistanceMeter || 0);
    return sum + (Number.isFinite(distance) ? distance : 0);
  }, 0);

  // Calculate averages from quality-filtered history
  const avgSpeed = safeAverage(qualityHistoryPoints.map((item) => Number(item?.speed || 0)));
  const avgHdop = safeAverage(qualityHistoryPoints.map((item) => Number(item?.hdop || 0)));
  const avgSatUsed = safeAverage(qualityHistoryPoints.map((item) => Number(item?.satellites_used || 0)));
  const avgCn0 = safeAverage(qualityHistoryPoints.map((item) => Number(item?.avg_cn0 || 0)));

  // Fleet health from quality points
  const qualityPoints = qualityHistoryPoints.filter((item) => Number(item?.hdop || 0) > 0);
  const excellentCount = qualityPoints.filter((item) => Number(item?.hdop || 0) <= 1.5).length;
  const moderateCount = qualityPoints.filter((item) => {
    const hdop = Number(item?.hdop || 0);
    return hdop > 1.5 && hdop <= 3;
  }).length;
  const lowCount = qualityPoints.filter((item) => Number(item?.hdop || 0) > 3).length;
  const qualityBase = Math.max(qualityPoints.length, 1);

  // Build time-series telemetry data PER DEVICE (sampled every ~15min)
  const TRACK_COLORS = ['#22d3ee', '#f97316', '#a78bfa', '#34d399', '#f43f5e', '#eab308', '#60a5fa', '#fb923c'];
  
  const telemetrySeries = perDeviceData
    .filter((item) => item.history.length > 0)
    .map((item, deviceIndex) => {
      const sorted = [...item.history]
        .filter((p) => Number(p?.hdop || 0) > 0 && Number(p?.hdop || 0) < 10)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      if (sorted.length === 0) return null;

      const maxPoints = 24;
      const step = Math.max(1, Math.floor(sorted.length / maxPoints));
      const points = [];
      for (let i = 0; i < sorted.length && points.length < maxPoints; i += step) {
        const point = sorted[i];
        const hdop = Number(point?.hdop || 0);
        const satUsed = Number(point?.satellites_used || 0);
        const cn0 = Number(point?.avg_cn0 || 0);
        const hdopScore = clampPercent((1 - Math.min(hdop, 5) / 5) * 60);
        const satScore = clampPercent(satUsed * 3);
        const cn0Score = clampPercent(cn0 * 1.2);
        const score = clampPercent(hdopScore + satScore * 0.3 + cn0Score * 0.3);

        const time = new Date(point.timestamp);
        points.push({
          x: points.length,
          label: `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`,
          value: toFixedNumber(score, 1),
        });
      }

      return {
        deviceCode: item.device.deviceCode,
        deviceName: item.device.deviceName,
        color: TRACK_COLORS[deviceIndex % TRACK_COLORS.length],
        points,
      };
    })
    .filter(Boolean);

  const inactiveAlerts = devices
    .filter((item) => item.status !== 'active')
    .slice(0, 2)
    .map((item) => ({
      title: 'Device inactive',
      detail: `${item.deviceCode} has not sent data for over 5 minutes.`,
      severity: 'High',
    }));

  const gnssAlerts = perDeviceData
    .filter((item) => item.history.length > 0)
    .flatMap((item) => {
      const list = [];
      // Use average from history for alerts
      const points = item.history;
      const avgSatUsedDevice = safeAverage(points.map((p) => Number(p?.satellites_used || 0)));
      const avgHdopDevice = safeAverage(points.map((p) => Number(p?.hdop || 0)));

      if (avgSatUsedDevice > 0 && avgSatUsedDevice < 4) {
        list.push({
          title: 'Low satellites used',
          detail: `${item.device.deviceCode} averaged only ${avgSatUsedDevice.toFixed(1)} satellites in 24h.`,
          severity: 'Medium',
        });
      }

      if (avgHdopDevice > 3) {
        list.push({
          title: 'Poor positioning precision',
          detail: `${item.device.deviceCode} has avg HDOP ${avgHdopDevice.toFixed(2)} in 24h (higher is worse).`,
          severity: 'Low',
        });
      }

      return list;
    })
    .slice(0, 3);

  const alerts = [...inactiveAlerts, ...gnssAlerts].slice(0, 4);

  const activities = perDeviceData
    .filter((item) => item.latest)
    .sort((a, b) => new Date(b.latest.timestamp).getTime() - new Date(a.latest.timestamp).getTime())
    .slice(0, 8)
    .map((item) => ({
      id: item.device.deviceCode,
      status: getActivityStatus(item.latest),
      speed: `${toFixedNumber(Number(item.latest?.speed || 0), 1)} km/h`,
      position: toCoordinatesText(item.latest),
      time: formatRelativeTime(item.latest.timestamp),
    }));

  return {
    cards: {
      totalDevices,
      activeDevices,
      inactiveDevices,
      totalDistanceKm: toFixedNumber(totalDistanceMeter / 1000, 2),
      avgSpeed: toFixedNumber(avgSpeed, 1),
      avgHdop: toFixedNumber(avgHdop, 2),
      activeRate: toFixedNumber((activeDevices / Math.max(totalDevices, 1)) * 100, 1),
      avgSatUsed: toFixedNumber(avgSatUsed, 1),
      avgCn0: toFixedNumber(avgCn0, 1),
    },
    telemetrySeries,
    health: [
      { label: 'Excellent Signal', value: toFixedNumber((excellentCount / qualityBase) * 100, 1), tone: 'bg-emerald-400' },
      { label: 'Moderate Signal', value: toFixedNumber((moderateCount / qualityBase) * 100, 1), tone: 'bg-sky-400' },
      { label: 'Low Signal', value: toFixedNumber((lowCount / qualityBase) * 100, 1), tone: 'bg-amber-400' },
    ],
    alerts,
    activities,
    updatedAt: new Date().toISOString(),
  };
}
