import axiosInstance from '../api/axiosInstance.js';

export const getDeviceConfig = async (deviceId) => {
  const { data } = await axiosInstance.get(`/devices/${deviceId}/config`);
  return data?.data || null;
};

export const updateDeviceConfig = async ({ deviceId, config }) => {
  const { data } = await axiosInstance.put(`/devices/${deviceId}/config`, config);
  return data?.data || null;
};
