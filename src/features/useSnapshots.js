import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDevices } from './useDevices';
import {
  getDeviceSnapshots,
  getLatestTrackingForDevice,
  initSnapshot,
  uploadSnapshotFile,
} from '../services/snapshotService.jsx';

const SNAPSHOTS_KEY = ['snapshots'];

/**
 * Hook quản lý toàn bộ logic Snapshots page.
 * Bao gồm: filter, fetch list, upload mới.
 */
export const useSnapshots = () => {
  const queryClient = useQueryClient();
  const { data: devices = [], isLoading: devicesLoading } = useDevices();

  // Filters
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [statusFilter, setStatusFilter] = useState('all');

  // Auto-select first device
  const effectiveDeviceId = selectedDeviceId || (devices.length > 0 ? devices[0].id : null);

  // Fetch snapshots
  const {
    data: snapshots = [],
    isLoading: snapshotsLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...SNAPSHOTS_KEY, effectiveDeviceId, dateRange.from, dateRange.to, statusFilter],
    queryFn: () => getDeviceSnapshots({
      deviceId: effectiveDeviceId,
      from: dateRange.from,
      to: dateRange.to,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    enabled: !!effectiveDeviceId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Upload snapshot mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, metadata }) => {
      const snapshotRecord = await initSnapshot(metadata);
      if (!snapshotRecord?.id) throw new Error('Failed to init snapshot');
      return uploadSnapshotFile({ snapshotId: snapshotRecord.id, file });
    },
    onSuccess: () => {
      toast.success('Snapshot Uploaded', { description: 'Photo has been captured and uploaded.' });
      queryClient.invalidateQueries({ queryKey: SNAPSHOTS_KEY });
    },
    onError: (err) => {
      toast.error('Upload Failed', { description: err.message || 'Unable to upload snapshot.' });
    },
  });

  // Get latest tracking for capture metadata
  const getLatestTracking = async (deviceId) => {
    try {
      return await getLatestTrackingForDevice(deviceId);
    } catch {
      return null;
    }
  };

  // Stats
  const stats = useMemo(() => {
    const total = snapshots.length;
    const autoCount = snapshots.filter((s) => s.captureMode === 'auto').length;
    const manualCount = snapshots.filter((s) => s.captureMode === 'manual').length;
    const uploadedCount = snapshots.filter((s) => s.syncStatus === 'uploaded').length;
    return { total, autoCount, manualCount, uploadedCount };
  }, [snapshots]);

  return {
    // Data
    devices,
    snapshots,
    stats,

    // Filters
    selectedDeviceId: effectiveDeviceId,
    setSelectedDeviceId,
    dateRange,
    setDateRange,
    statusFilter,
    setStatusFilter,

    // Loading/Error
    isLoading: devicesLoading || snapshotsLoading,
    isError,
    error,

    // Actions
    refetch,
    upload: uploadMutation.mutateAsync,
    isUploading: uploadMutation.isPending,
    getLatestTracking,
  };
};
