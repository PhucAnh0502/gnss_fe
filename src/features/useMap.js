import { useEffect, useMemo, useState } from 'react';
import { useDevices } from './useDevices';
import {
  buildAllSatelliteIds,
  buildDevicePoints,
  buildDeviceTracks,
  buildDisplayDevices,
  buildFixSvidSet,
  buildSelectedDeviceTrack,
  getSocketBaseUrl,
  loadHistoryTracks,
  subscribeLiveTracks,
} from '../services/mapService.jsx';

/**
 * Hook quản lý toàn bộ state + logic cho Map page.
 * Bao gồm: load history, subscribe live, build tracks/points.
 */
export const useMap = () => {
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [liveTrackByCode, setLiveTrackByCode] = useState({});
  const [historyTrackByCode, setHistoryTrackByCode] = useState({});
  const [historyLoading, setHistoryLoading] = useState(false);

  const { data: devices = [], isLoading: devicesLoading, isError: devicesError } = useDevices();

  const socketBaseUrl = useMemo(() => getSocketBaseUrl(), []);
  const displayDevices = useMemo(() => buildDisplayDevices(devices), [devices]);

  const selectedDevice = useMemo(
    () => displayDevices.find((item) => item.id === selectedDeviceId) || null,
    [displayDevices, selectedDeviceId]
  );

  // Load history tracks when devices change
  useEffect(() => {
    if (displayDevices.length === 0) return;
    setHistoryLoading(true);
    loadHistoryTracks(displayDevices)
      .then(setHistoryTrackByCode)
      .finally(() => setHistoryLoading(false));
  }, [displayDevices]);

  // Subscribe to live tracks via Socket.IO
  useEffect(() => {
    if (displayDevices.length === 0) return;
    return subscribeLiveTracks({
      displayDevices,
      socketBaseUrl,
      onPoint: (deviceCode, point) => {
        setLiveTrackByCode((prev) => {
          const current = prev[deviceCode] || [];
          return { ...prev, [deviceCode]: [...current, point].slice(-60) };
        });
      },
    });
  }, [displayDevices, socketBaseUrl]);

  // Computed values
  const deviceTracks = useMemo(
    () => buildDeviceTracks({ displayDevices, historyTrackByCode, liveTrackByCode }),
    [displayDevices, historyTrackByCode, liveTrackByCode]
  );

  const devicePoints = useMemo(() => buildDevicePoints(deviceTracks), [deviceTracks]);

  const selectedDeviceTrack = useMemo(
    () => buildSelectedDeviceTrack(deviceTracks, selectedDevice),
    [deviceTracks, selectedDevice]
  );

  const latestPoint = useMemo(() => {
    if (!selectedDeviceTrack) return null;
    return selectedDeviceTrack.points[selectedDeviceTrack.points.length - 1] || null;
  }, [selectedDeviceTrack]);

  const fixSvidSet = useMemo(() => buildFixSvidSet(latestPoint), [latestPoint]);
  const allSatelliteIds = useMemo(() => buildAllSatelliteIds(deviceTracks), [deviceTracks]);

  return {
    // State
    selectedDeviceId,
    setSelectedDeviceId,
    selectedDevice,

    // Data
    devices,
    displayDevices,
    deviceTracks,
    devicePoints,
    selectedDeviceTrack,
    latestPoint,
    fixSvidSet,
    allSatelliteIds,
    historyTrackByCode,
    liveTrackByCode,

    // Loading/Error
    isLoading: devicesLoading || historyLoading,
    isError: devicesError,
  };
};
