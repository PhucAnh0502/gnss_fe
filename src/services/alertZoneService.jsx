import axiosInstance from '../api/axiosInstance.js';

export async function fetchAlertZones() {
  const { data } = await axiosInstance.get('/alert-zones');
  return data.data || [];
}

export async function fetchAlertZone(id) {
  const { data } = await axiosInstance.get(`/alert-zones/${id}`);
  return data.data || null;
}

export async function createAlertZone(zoneData) {
  const { data } = await axiosInstance.post('/alert-zones', zoneData);
  return data.data || null;
}

export async function updateAlertZone(id, zoneData) {
  const { data } = await axiosInstance.put(`/alert-zones/${id}`, zoneData);
  return data.data || null;
}

export async function deleteAlertZone(id) {
  const { data } = await axiosInstance.delete(`/alert-zones/${id}`);
  return data;
}

export async function fetchAlertHistory(params = {}) {
  const { data } = await axiosInstance.get('/alert-events', { params });
  return {
    data: data.data || [],
    pagination: data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
  };
}
