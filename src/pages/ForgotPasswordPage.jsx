import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { EarthModel } from '../components/ui/EarthModel'
import { useForgotPassword } from '../features/useAuth.js';
import { buildSparkleDots, validateEmail, clearResetOtpVerification } from '../services/authPageService.jsx';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const forgotPassword = useForgotPassword();

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    clearResetOtpVerification();
    forgotPassword.mutate({ email }, {
      onSuccess: () => {
        window.location.href = `/verify-otp?email=${encodeURIComponent(email.trim())}`;
      }
    });
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
        {/* Left Side: Space Graphic */}
        <div className="hidden md:flex w-1/2 p-12 flex-col items-center justify-center bg-slate-900/60 border-r border-slate-700/50">
          <h1 className="text-6xl font-black text-white italic tracking-tighter">GNSS Tracker</h1>
          <EarthModel modelUrl="/models/earth_orbit.glb" />
          <p className="mt-8 text-slate-500 font-mono text-xs uppercase tracking-[0.4em]">Proprietary Tracking System</p>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight">Reset Password</h2>
            <p className="text-slate-400 mt-1">Get a one-time OTP code to reset your password.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input 
                label="Email Address" 
                icon="email" 
                placeholder="abc@gmail.com"
                value={email}
                onChange={e => setEmail(e.target.value)} 
              />
              {error && <p className="text-red-400 text-xs mt-1 ml-1">{error}</p>}
            </div>

            <Button isLoading={forgotPassword.isPending}>Send OTP</Button>

            <p className="text-sm text-slate-400 text-center">
              Remember your password?{' '}
              <Link to="/login" className="text-slate-200 hover:text-brand-blue transition-colors font-semibold">
                Login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
