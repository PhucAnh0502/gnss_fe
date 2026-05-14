import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { EarthModel } from '../components/ui/EarthModel';
import { useLogin } from '../features/useAuth.js';
import { buildSparkleDots } from '../services/authPageService.jsx';
import { Radar, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const login = useLogin();
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
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-blue/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-5xl glass-panel rounded-2xl md:rounded-3xl flex flex-col md:flex-row overflow-hidden relative z-10 shadow-2xl">
        {/* Left Side: Branding */}
        <div className="hidden md:flex w-1/2 p-10 lg:p-14 flex-col items-center justify-center bg-gradient-to-br from-slate-900/80 to-slate-950/90 border-r border-slate-700/30 relative overflow-hidden">
          {/* Decorative ring */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-80 h-80 rounded-full border border-brand-blue/10 animate-pulse" />
            <div className="absolute w-60 h-60 rounded-full border border-cyan/8" />
          </div>

          <div className="relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-blue/10 border border-brand-blue/20 mb-6">
              <Radar className="w-4 h-4 text-brand-blue" />
              <span className="text-xs font-semibold text-brand-blue-light tracking-wide uppercase">Tracking System</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-black text-white tracking-tight leading-none">
              GNSS<br />
              <span className="bg-gradient-to-r from-brand-blue to-cyan-400 bg-clip-text text-transparent">Vision</span>
            </h1>
            <EarthModel modelUrl="/models/earth_orbit.glb" />
            <p className="mt-6 text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
              Real-time satellite tracking and fleet management platform
            </p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-14 flex flex-col justify-center">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 md:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-blue to-cyan-400 flex items-center justify-center">
              <Radar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-lg leading-5">GNSS Vision</p>
              <p className="text-xs text-slate-500">Tracking System</p>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Welcome back</h2>
            <p className="text-slate-400 mt-2 text-sm">Sign in to access your tracking dashboard</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); login.mutate(form); }} className="space-y-5">
            <Input
              label="Email"
              icon="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <div>
              <Input
                label="Password"
                icon="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-sm text-slate-400 hover:text-brand-blue-light transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button isLoading={login.isPending} className="mt-2">
              Sign in
              <ArrowRight className="w-4 h-4" />
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-bg-card text-slate-500">or</span>
              </div>
            </div>

            <p className="text-sm text-slate-400 text-center">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-blue-light hover:text-brand-blue transition-colors font-semibold">
                Create account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
