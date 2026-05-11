import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { addDevice, deleteDevice, getDevices, updateDevice } from '../services/deviceService.jsx';

const DEVICES_KEY = ['devices'];

export const useDevices = () => {
  return useQuery({
    queryKey: DEVICES_KEY,
    queryFn: getDevices,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
};

export const useAddDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addDevice,
    onSuccess: () => {
      toast.success('Device Added', { description: 'New device has been added successfully.' });
      queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
    },
    onError: (err) => {
      const message = err.response?.data?.message || 'Failed to add device';
      toast.error('Error', { description: message });
    }
  });
};

export const useUpdateDevice = (deviceId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceData) => updateDevice(deviceId, deviceData),
    onSuccess: () => {
      toast.success('Device Updated', { description: 'Device information has been updated.' });
      queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
    },
    onError: (err) => {
      const message = err.response?.data?.message || 'Failed to update device';
      toast.error('Error', { description: message });
    }
  });
};

export const useDeleteDevice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDevice,
    onSuccess: () => {
      toast.success('Device Deleted', { description: 'Device has been removed.' });
      queryClient.invalidateQueries({ queryKey: DEVICES_KEY });
    },
    onError: (err) => {
      const message = err.response?.data?.message || 'Failed to delete device';
      toast.error('Error', { description: message });
    }
  });
};
