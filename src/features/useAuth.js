import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  changePassword,
  login,
  register,
  resetPassword,
  sendForgotPasswordOtp,
  verifyResetOtp,
} from '../services/authService.jsx';

export const useLogin = () => {
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem('token', data.token);
      toast.success('Access Granted', { description: 'Welcome to the GNSS Dashboard.' });
      window.location.href = '/dashboard'; 
    },
    onError: (err) => {
      toast.error('Auth Failed', { description: err.response?.data?.message || 'Unauthorized access.' });
    }
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: register,
    onSuccess: () => {
      toast.success('Registration Success', { description: 'Your account has been created. Please login.' });
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors && Array.isArray(errors)) {
        errors.forEach(error => {
          toast.error(error.field, { description: error.message });
        });
      } else {
        toast.error('Registration Failed', { description: err.response?.data?.message || 'Unable to create account.' });
      }
    }
  });
};

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: sendForgotPasswordOtp,
    onError: (err) => {
      toast.error('Error', { description: err.response?.data?.message || 'Unable to process request.' });
    }
  });
};

export const useVerifyResetOtp = () => {
  return useMutation({
    mutationFn: verifyResetOtp,
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors && Array.isArray(errors)) {
        errors.forEach(error => {
          toast.error(error.field, { description: error.message });
        });
      } else {
        toast.error('OTP Verify Failed', { description: err.response?.data?.message || 'Unable to verify OTP.' });
      }
    }
  });
};

export const useResetPassword = () => {
  return useMutation({
    mutationFn: resetPassword,
    onSuccess: () => {
      toast.success('Password Reset Success', { description: 'Your password has been updated. Please login.' });
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors && Array.isArray(errors)) {
        errors.forEach(error => {
          toast.error(error.field, { description: error.message });
        });
      } else {
        toast.error('Reset Failed', { description: err.response?.data?.message || 'Unable to reset password.' });
      }
    }
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      toast.success('Password Changed', { description: 'Your password has been updated successfully.' });
    },
    onError: (err) => {
      const errors = err.response?.data?.errors;
      if (errors && Array.isArray(errors)) {
        errors.forEach(error => {
          toast.error(error.field, { description: error.message });
        });
      } else {
        toast.error('Change Password Failed', { description: err.response?.data?.message || 'Unable to change password.' });
      }
    }
  });
};