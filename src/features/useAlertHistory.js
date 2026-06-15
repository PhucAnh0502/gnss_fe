import { useQuery } from '@tanstack/react-query';
import { fetchAlertHistory } from '../services/alertZoneService.jsx';

const ALERT_HISTORY_KEY = ['alert-history'];

export const useAlertHistory = (filters = {}) => {
  const { page = 1, limit = 20, deviceCode, zoneId, alertType, startDate, endDate } = filters;

  // Build query params (only include non-empty values)
  const params = { page, limit };
  if (deviceCode) params.deviceCode = deviceCode;
  if (zoneId) params.zoneId = zoneId;
  if (alertType) params.alertType = alertType;
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;

  return useQuery({
    queryKey: [...ALERT_HISTORY_KEY, params],
    queryFn: () => fetchAlertHistory(params),
    staleTime: 30 * 1000,
  });
};
