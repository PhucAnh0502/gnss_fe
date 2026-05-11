import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { EarthModel } from '../components/ui/EarthModel';
import { useVerifyResetOtp } from '../features/useAuth.js';
import { buildSparkleDots, validateEmail, validateOtpCode, clearResetOtpVerification, saveResetOtpVerification } from '../services/authPageService.jsx';

export default function VerifyOtpPage() {
  const queryEmail = useMemo(() => {
    const search = new URLSearchParams(window.location.search);
    return search.get('email') || '';
  }, []);

  const [email, setEmail] = useState(queryEmail);
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(''));
  const [error, setError] = useState('');
  const verifyOtp = useVerifyResetOtp();

  const otp = otpDigits.join('');

  const setOtpByIndex = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);
    if (error) setError('');

    if (digit && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleOtpPaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const nextDigits = Array(6).fill('');
    pasted.split('').forEach((digit, idx) => {
      nextDigits[idx] = digit;
    });
    setOtpDigits(nextDigits);
    if (error) setError('');

    const lastIndex = Math.min(pasted.length, 6) - 1;
    document.getElementById(`otp-${Math.max(lastIndex, 0)}`)?.focus();
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    const otpError = validateOtpCode(otp);
    if (otpError) {
      setError(otpError);
      return;
    }

    setError('');
    clearResetOtpVerification();

    verifyOtp.mutate(
      { email: email.trim(), otp },
      {
        onSuccess: () => {
          saveResetOtpVerification({ email: email.trim(), otp });
          window.location.href = '/reset-password';
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
          <p className="mt-8 text-slate-500 font-mono text-xs uppercase tracking-[0.4em]">Proprietary Tracking System</p>
        </div>

        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight">Verify OTP</h2>
            <p className="text-slate-400 mt-1">Enter the 6-digit OTP sent to your email.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input
                label="Email Address"
                icon="email"
                placeholder="abc@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-semibold ml-1 text-slate-400">OTP Code</label>
              <div className="mt-2 flex gap-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <input
                    key={`otp-${index}`}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otpDigits[index] || ''}
                    onChange={(e) => setOtpByIndex(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="h-12 w-11 rounded-high-tech border border-slate-700 bg-slate-900/80 text-center text-lg font-bold text-slate-100 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue/50"
                  />
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <Button isLoading={verifyOtp.isPending}>Verify OTP</Button>

            <p className="text-sm text-slate-400 text-center">
              Didn't receive code?{' '}
              <Link to="/forgot-password" className="text-slate-200 hover:text-brand-blue transition-colors font-semibold">
                Send again
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
