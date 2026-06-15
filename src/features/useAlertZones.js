import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchAlertZones, createAlertZone, updateAlertZone, deleteAlertZone } from '../services/alertZoneService.jsx';

const ALERT_ZONES_KEY = ['alert-zones'];

export const useAlertZones = () => {
  return useQuery({
    queryKey: ALERT_ZONES_KEY,
    queryFn: fetchAlertZones,
    staleTime: 30 * 1000,
  });
};

export const useCreateAlertZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAlertZone,
    onSuccess: () => {
      toast.success('Alert Zone Created', { description: 'New alert zone has been created successfully.' });
      queryClient.invalidateQueries({ queryKey: ALERT_ZONES_KEY });
    },
    onError: (err) => {
      const message = err.response?.data?.message || 'Failed to create alert zone';
      toast.error('Error', { description: message });
    },
  });
};

export const useUpdateAlertZone = (zoneId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (zoneData) => updateAlertZone(zoneId, zoneData),
    onSuccess: () => {
      toast.success('Alert Zone Updated', { description: 'Alert zone has been updated.' });
      queryClient.invalidateQueries({ queryKey: ALERT_ZONES_KEY });
    },
    onError: (err) => {
      const message = err.response?.data?.message || 'Failed to update alert zone';
      toast.error('Error', { description: message });
    },
  });
};

export const useDeleteAlertZone = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAlertZone,
    onSuccess: () => {
      toast.success('Alert Zone Deleted', { description: 'Alert zone has been removed.' });
      queryClient.invalidateQueries({ queryKey: ALERT_ZONES_KEY });
    },
    onError: (err) => {
      const message = err.response?.data?.message || 'Failed to delete alert zone';
      toast.error('Error', { description: message });
    },
  });
};
