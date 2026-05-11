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

  const totalDistanceMeter = perDeviceData.reduce((sum, item) => {
    const distance = Number(item.summary?.totalDistanceMeter || 0);
    return sum + (Number.isFinite(distance) ? distance : 0);
  }, 0);

  const avgSpeed = safeAverage(allLatest.map((item) => Number(item?.speed || 0)));
  const avgHdop = safeAverage(allLatest.map((item) => Number(item?.hdop || 0)));
  const avgSatUsed = safeAverage(allLatest.map((item) => Number(item?.satellites_used || 0)));
  const avgCn0 = safeAverage(allLatest.map((item) => Number(item?.avg_cn0 || 0)));

  const excellentCount = allLatest.filter((item) => Number(item?.hdop || 0) <= 1.5).length;
  const moderateCount = allLatest.filter((item) => {
    const hdop = Number(item?.hdop || 0);
    return hdop > 1.5 && hdop <= 3;
  }).length;
  const lowCount = allLatest.filter((item) => Number(item?.hdop || 0) > 3).length;
  const qualityBase = Math.max(allLatest.length, 1);

  const telemetrySeries = perDeviceData
    .filter((item) => item.latest)
    .slice(0, 12)
    .map((item, index) => {
      const satUsed = Number(item.latest?.satellites_used || 0);
      const avgCn0Value = Number(item.latest?.avg_cn0 || 0);
      const score = clampPercent((satUsed * 6) + (avgCn0Value * 1.2));

      return {
        x: index,
        label: item.device.deviceCode,
        value: toFixedNumber(score, 1),
      };
    });

  const inactiveAlerts = devices
    .filter((item) => item.status !== 'active')
    .slice(0, 2)
    .map((item) => ({
      title: 'Device inactive',
      detail: `${item.deviceCode} has not sent data for over 5 minutes.`,
      severity: 'High',
    }));

  const gnssAlerts = perDeviceData
    .filter((item) => item.latest)
    .flatMap((item) => {
      const list = [];
      const satUsed = Number(item.latest?.satellites_used || 0);
      const hdop = Number(item.latest?.hdop || 0);

      if (satUsed > 0 && satUsed < 4) {
        list.push({
          title: 'Low satellites used',
          detail: `${item.device.deviceCode} is using only ${satUsed} satellites for fix.`,
          severity: 'Medium',
        });
      }

      if (hdop > 3) {
        list.push({
          title: 'Poor positioning precision',
          detail: `${item.device.deviceCode} has HDOP ${hdop.toFixed(2)} (higher is worse).`,
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
