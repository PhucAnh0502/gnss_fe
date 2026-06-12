import { useQuery } from '@tanstack/react-query';
import { useDevices } from './useDevices';
import { getDashboardSnapshot } from '../services/dashboardService.jsx';

const DASHBOARD_KEY = ['dashboard'];

/**
 * Hook quản lý data cho Dashboard page.
 * Tự động fetch metrics khi danh sách devices thay đổi.
 */
export const useDashboard = () => {
  const { data: devices = [], isLoading: devicesLoading } = useDevices();

  const {
    data: snapshot,
    isLoading: snapshotLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...DASHBOARD_KEY, devices.map((d) => d.id).join(',')],
    queryFn: () => getDashboardSnapshot(devices),
    enabled: devices.length > 0,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000,
  });

  return {
    // Data
    devices,
    cards: snapshot?.cards || null,
    telemetrySeries: snapshot?.telemetrySeries || [],
    health: snapshot?.health || [],
    alerts: snapshot?.alerts || [],
    activities: snapshot?.activities || [],
    updatedAt: snapshot?.updatedAt || null,

    // Loading/Error
    isLoading: devicesLoading || snapshotLoading,
    isError,
    error,

    // Actions
    refetch,
  };
};
