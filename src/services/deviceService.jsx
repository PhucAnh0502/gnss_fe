import axiosInstance from '../api/axiosInstance.js';

export async function getDevices() {
  const { data } = await axiosInstance.get('/devices');
  return data.data || [];
}

export async function addDevice(deviceData) {
  const { data } = await axiosInstance.post('/devices', deviceData);
  return data.device || data;
}

export async function updateDevice(deviceId, deviceData) {
  const { data } = await axiosInstance.put(`/devices/${deviceId}`, deviceData);
  return data;
}

export async function deleteDevice(deviceId) {
  const { data } = await axiosInstance.delete(`/devices/${deviceId}`);
  return data;
}
