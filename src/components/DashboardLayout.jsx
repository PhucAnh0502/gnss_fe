import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Smartphone,
  History as HistoryIcon,
  Map,
  Settings,
  Radar,
} from 'lucide-react';
import { Button } from './ui/Button';
import { logout } from '../lib/auth';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Devices', icon: Smartphone, path: '/devices' },
  { label: 'History', icon: HistoryIcon, path: '/history' },
  { label: 'Map', icon: Map, path: '/map' },
];

export function DashboardLayout({ children }) {
  const location = useLocation();

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-primary-dark text-slate-100 flex">
      <aside className="w-65 shrink-0 border-r border-slate-800 bg-[#020b20] px-4 py-5 flex flex-col">
        <div className="flex items-center gap-3 px-3 py-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
            <Radar className="w-5 h-5 text-blue-300" />
          </div>
          <div>
            <p className="font-semibold text-white leading-5">GNSS</p>
            <p className="text-xs tracking-[0.18em] text-blue-300 uppercase">Tracker</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors no-underline ${
                  isActive
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800/80 space-y-3">
          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
          <Button
            type="button"
            variant="danger"
            fullWidth
            className="py-3"
            onClick={handleLogout}
          >
            Log out
          </Button>
        </div>
      </aside>

      <main className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.18),transparent_42%),radial-gradient(circle_at_85%_18%,rgba(14,165,233,0.16),transparent_40%),linear-gradient(180deg,#020617_0%,#020b1d_100%)]">
        <div className="absolute inset-0 opacity-[0.12] bg-size-[26px_26px] bg-[linear-gradient(to_right,rgba(148,163,184,0.24)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.24)_1px,transparent_1px)]" />

        <section className="relative z-10 p-8 md:p-10 h-full flex flex-col overflow-y-auto">
          {children}
        </section>
      </main>
    </div>
  );
}
