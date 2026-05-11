import axiosInstance from '../api/axiosInstance.js';

export async function login(credentials) {
  const { data } = await axiosInstance.post('/auth/login', credentials);
  return data;
}

export async function register(userData) {
  const { data } = await axiosInstance.post('/auth/register', userData);
  return data;
}

export async function sendForgotPasswordOtp(payload) {
  const { data } = await axiosInstance.post('/auth/forgot-password', payload);
  return data;
}

export async function verifyResetOtp(payload) {
  const { data } = await axiosInstance.post('/auth/verify-reset-otp', payload);
  return data;
}

export async function resetPassword(payload) {
  const { data } = await axiosInstance.put('/auth/reset-password', payload);
  return data;
}

export async function changePassword(payload) {
  const { data } = await axiosInstance.put('/auth/change-password', payload);
  return data;
}
