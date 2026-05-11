export const buildSparkleDots = (count = 56) => (
  Array.from({ length: count }, (_, index) => ({
    top: `${(index * 37) % 100}%`,
    left: `${(index * 53) % 100}%`,
    delay: `${(index * 0.17) % 3.5}s`,
    duration: `${2.2 + (index % 5) * 0.45}s`,
    size: `${1 + (index % 3)}px`,
  }))
);

export const validateEmail = (email) => {
  if (!email.trim()) {
    return 'Email is required';
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return 'Invalid email format';
  }

  return '';
};

export const validateRegisterForm = (form) => {
  const newErrors = {};

  if (!form.username.trim()) newErrors.username = 'Username is required';
  if (!form.email.trim()) newErrors.email = 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = 'Invalid email format';
  if (form.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
  if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

  return newErrors;
};

export const validateChangePasswordForm = (form) => {
  const newErrors = {};

  if (!form.oldPassword) newErrors.oldPassword = 'Old password is required';
  if (form.newPassword.length < 6) newErrors.newPassword = 'New password must be at least 6 characters';
  if (!/(?=.*[0-9])(?=.*[!@#$%^&*])/.test(form.newPassword)) {
    newErrors.newPassword = 'New password must contain at least 1 digit and 1 special character';
  }
  if (form.newPassword === form.oldPassword) {
    newErrors.newPassword = 'New password cannot be the same as old password';
  }
  if (form.confirmPassword !== form.newPassword) {
    newErrors.confirmPassword = 'Confirm password does not match new password';
  }

  return newErrors;
};

export const validateResetPasswordForm = (form) => {
  const newErrors = {};

  if (form.password.length < 6) {
    newErrors.password = 'Password must be at least 6 characters';
  } else if (!/^(?=.*[0-9])(?=.*[!@#$%^&*])/.test(form.password)) {
    newErrors.password = 'Password must contain at least 1 digit and 1 special character';
  }

  if (form.password !== form.confirmPassword) {
    newErrors.confirmPassword = 'Passwords do not match';
  }

  return newErrors;
};

export const validateOtpCode = (otp) => {
  if (!/^\d{6}$/.test(otp)) {
    return 'OTP must be 6 digits';
  }

  return '';
};

export const readResetOtpVerification = () => {
  try {
    const raw = sessionStorage.getItem('resetOtpVerified');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearResetOtpVerification = () => {
  sessionStorage.removeItem('resetOtpVerified');
};

export const saveResetOtpVerification = ({ email, otp }) => {
  sessionStorage.setItem('resetOtpVerified', JSON.stringify({ email, otp }));
};
