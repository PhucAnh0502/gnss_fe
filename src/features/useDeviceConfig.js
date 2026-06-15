import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { io } from 'socket.io-client';
import { getDeviceConfig, updateDeviceConfig } from '../services/deviceConfigService.jsx';
import { getSocketBaseUrl } from '../services/mapService.jsx';

const CONFIG_KEY = ['device-config'];

/**
 * Hook quản lý remote config cho 1 device (tracking + auto-capture).
 * Tự động refetch khi nhận Socket.IO event 'config:{deviceCode}'.
 */
export const useDeviceConfig = (deviceId, deviceCode) => {
  const queryClient = useQueryClient();

  const {
    data: config,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: [...CONFIG_KEY, deviceId],
    queryFn: () => getDeviceConfig(deviceId),
    enabled: !!deviceId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Listen for real-time config updates from app (bi-directional sync)
  useEffect(() => {
    if (!deviceCode) return;

    const socketBaseUrl = getSocketBaseUrl();
    const socket = io(socketBaseUrl, { transports: ['websocket'] });

    socket.on(`config:${deviceCode}`, (updatedConfig) => {
      // Update cache directly for instant UI update
      queryClient.setQueryData([...CONFIG_KEY, deviceId], updatedConfig);
    });

    return () => {
      socket.off(`config:${deviceCode}`);
      socket.disconnect();
    };
  }, [deviceCode, deviceId, queryClient]);

  const updateMutation = useMutation({
    mutationFn: (updates) => updateDeviceConfig({ deviceId, config: updates }),
    onSuccess: (data) => {
      queryClient.setQueryData([...CONFIG_KEY, deviceId], data);
      toast.success('Config Updated', { description: 'Device configuration has been saved and pushed.' });
    },
    onError: (err) => {
      toast.error('Update Failed', { description: err.response?.data?.message || 'Unable to save configuration.' });
    },
  });

  return {
    config,
    isLoading,
    isError,
    error,
    refetch,
    updateConfig: updateMutation.mutateAsync,
    isSaving: updateMutation.isPending,
  };
};
