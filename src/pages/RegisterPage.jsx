import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { EarthModel } from '../components/ui/EarthModel';
import { useRegister } from '../features/useAuth.js';
import { buildSparkleDots, validateRegisterForm } from '../services/authPageService.jsx';
import { Radar, UserPlus } from 'lucide-react';

export default function RegisterPage() {
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: '',
  });
  const [errors, setErrors] = useState({});
  const register = useRegister();

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateRegisterForm(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      register.mutate(
        {
          username: form.username,
          email: form.email,
          password: form.password,
          confirmPassword: form.confirmPassword,
        },
        {
          onError: (err) => {
            const backendErrors = err.response?.data?.errors;
            if (backendErrors && Array.isArray(backendErrors)) {
              const errorMap = {};
              backendErrors.forEach((error) => {
                errorMap[error.field] = error.message;
              });
              setErrors(errorMap);
            }
          },
        }
      );
    }
  };

  const sparkleDots = buildSparkleDots();

  return (
    <div className="min-h-screen bg-primary-dark flex items-center justify-center p-4 md:p-6 relative overflow-hidden">
      {/* Background stars */}
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

      {/* Ambient glow */}
      <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-purple/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-brand-blue/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-5xl glass-panel rounded-2xl md:rounded-3xl flex flex-col md:flex-row overflow-hidden relative z-10 shadow-2xl">
        {/* Left Side: Branding */}
        <div className="hidden md:flex w-1/2 p-10 lg:p-14 flex-col items-center justify-center bg-gradient-to-br from-slate-900/80 to-slate-950/90 border-r border-slate-700/30 relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-80 h-80 rounded-full border border-purple/10 animate-pulse" />
            <div className="absolute w-60 h-60 rounded-full border border-brand-blue/8" />
          </div>

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple/10 border border-purple/20 mb-6">
              <UserPlus className="w-4 h-4 text-purple-light" />
              <span className="text-xs font-semibold text-purple-light tracking-wide uppercase">Join Us</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
              GNSS<br />
              <span className="bg-gradient-to-r from-purple to-brand-blue bg-clip-text text-transparent">Vision</span>
            </h1>
            <EarthModel modelUrl="/models/earth_orbit.glb" />
            <p className="mt-6 text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
              Create your account to start tracking your fleet in real-time
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-10 lg:p-12 flex flex-col justify-center">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-cyan-400 flex items-center justify-center">
              <Radar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-lg leading-5">GNSS Vision</p>
              <p className="text-xs text-slate-500">Create Account</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Create account</h2>
            <p className="text-slate-400 mt-2 text-sm">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              icon="user"
              placeholder="your_username"
              value={form.username}
              error={errors.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />

            <Input
              label="Email"
              icon="email"
              placeholder="you@example.com"
              value={form.email}
              error={errors.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <Input
              label="Password"
              icon="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              error={errors.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <Input
              label="Confirm Password"
              icon="password"
              type="password"
              placeholder="••••••••"
              value={form.confirmPassword}
              error={errors.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />

            <Button isLoading={register.isPending} className="mt-2">
              Create account
              <UserPlus className="w-4 h-4" />
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-bg-card text-slate-500">or</span>
              </div>
            </div>

            <p className="text-sm text-slate-400 text-center">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-blue-light hover:text-brand-blue transition-colors font-semibold">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
