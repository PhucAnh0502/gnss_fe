import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { EarthModel } from '../components/ui/EarthModel';
import { useResetPassword } from '../features/useAuth.js';
import { buildSparkleDots, readResetOtpVerification, validateResetPasswordForm, clearResetOtpVerification } from '../services/authPageService.jsx';

export default function ResetPasswordPage() {
  const verifiedData = useMemo(() => {
    return readResetOtpVerification();
  }, []);

  const hasVerifiedData = Boolean(verifiedData?.email && verifiedData?.otp);

  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const resetPassword = useResetPassword();

  useEffect(() => {
    if (!hasVerifiedData) {
      window.location.href = '/forgot-password';
    }
  }, [hasVerifiedData]);

  if (!hasVerifiedData) {
    return null;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateResetPasswordForm(form);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    resetPassword.mutate(
      {
        email: verifiedData.email,
        otp: verifiedData.otp,
        password: form.password,
        confirmPassword: form.confirmPassword,
      },
      {
        onSuccess: () => {
          clearResetOtpVerification();
        },
        onError: (err) => {
          const backendErrors = err.response?.data?.errors;
          if (backendErrors && Array.isArray(backendErrors)) {
            const errorMap = {};
            backendErrors.forEach((error) => {
              errorMap[error.field] = error.message;
            });
            setErrors(errorMap);
          } else {
            setErrors({
              general: err.response?.data?.message || 'Unable to reset password.',
            });
          }
        },
      }
    );
  };

  const sparkleDots = buildSparkleDots();

  return (
    <div className="min-h-screen bg-primary-dark flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {sparkleDots.map((dot, i) => (
          <span
            key={`sparkle-${i}`}
            className="twinkle-dot"
            style={{
              top: dot.top,
              left: dot.left,
              width: dot.size,
              height: dot.size,
              animationDelay: dot.delay,
              animationDuration: dot.duration,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-5xl glass-panel rounded-glass flex flex-col md:flex-row overflow-hidden relative z-10">
        <div className="hidden md:flex w-1/2 p-12 flex-col items-center justify-center bg-slate-900/60 border-r border-slate-700/50">
          <h1 className="text-6xl font-black text-white italic tracking-tighter">GNSS Tracker</h1>
          <EarthModel modelUrl="/models/earth_orbit.glb" />
          <p className="mt-8 text-slate-500 font-mono text-xs uppercase tracking-[0.4em]">
            Proprietary Tracking System
          </p>
        </div>

        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight">Create New Password</h2>
            <p className="text-slate-400 mt-1">Create a new password for {verifiedData.email}.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="New Password"
                icon="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              {errors.password && <p className="text-red-400 text-xs mt-1 ml-1">{errors.password}</p>}
            </div>

            <div>
              <Input
                label="Confirm Password"
                icon="password"
                type="password"
                placeholder="••••••••"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1 ml-1">{errors.confirmPassword}</p>
              )}
            </div>

            <Button isLoading={resetPassword.isPending}>Reset Password</Button>

            {errors.general && (
              <p className="text-red-400 text-xs text-center">{errors.general}</p>
            )}

            <p className="text-sm text-slate-400 text-center">
              <Link
                to="/login"
                className="text-slate-200 hover:text-brand-blue transition-colors font-semibold"
              >
                Back to Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
