import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { EarthModel } from '../components/ui/EarthModel'
import { useLogin } from '../features/useAuth.js';
import { buildSparkleDots } from '../services/authPageService.jsx';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const login = useLogin();
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
          <h1 className="text-6xl font-black text-white italic tracking-tighter">GNSS Vision</h1>
          <EarthModel modelUrl="/models/earth_orbit.glb" />
          <p className="mt-8 text-slate-500 font-mono text-xs uppercase tracking-[0.4em]">Proprietary Tracking System</p>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-10 md:p-16 flex flex-col justify-center">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white tracking-tight">System Login</h2>
            <p className="text-slate-400 mt-1">Enter credentials to initialize tracking.</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); login.mutate(form); }} className="space-y-6">
            <Input label="Email" icon="email" placeholder="abc@gmail.com" 
                   onChange={e => setForm({...form, email: e.target.value})} />
            <div>
              <Input label="Password" icon="password" type="password" placeholder="••••••••" 
                     onChange={e => setForm({...form, password: e.target.value})} />
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-sm text-slate-400 hover:text-brand-blue transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>
            <Button isLoading={login.isPending}>Login</Button>

            <p className="text-sm text-slate-400 text-center">
              You don't have an account?{' '}
              <Link to="/register" className="text-slate-200 hover:text-brand-blue transition-colors font-semibold">
                Register
              </Link>
            </p>

            <p className="text-xs text-slate-500 text-center">
              Already signed in and want to update credentials?{' '}
              <Link to="/change-password" className="text-slate-300 hover:text-brand-blue transition-colors font-semibold">
                Change password
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}