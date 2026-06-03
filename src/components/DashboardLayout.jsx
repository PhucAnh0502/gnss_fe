import { useState } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import {
  LayoutDashboard,
  Smartphone,
  History as HistoryIcon,
  Map,
  Camera,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { logout } from '../lib/auth';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Devices', icon: Smartphone, path: '/devices' },
  { label: 'History', icon: HistoryIcon, path: '/history' },
  { label: 'Live Map', icon: Map, path: '/map' },
  { label: 'Snapshots', icon: Camera, path: '/snapshots' },
];

export function DashboardLayout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const currentPage = navItems.find((item) => item.path === location.pathname);

  return (
    <div className="min-h-screen bg-primary-dark text-slate-100 flex">
      {/* MOBILE OVERLAY */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-bg-sidebar/95 backdrop-blur-xl border-r border-slate-800/60 px-4 py-6 flex flex-col transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* CLOSE BUTTON (MOBILE) */}
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 lg:hidden transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* LOGO */}
        <div className="flex items-center gap-3 px-4 py-4 mb-8">
          <img src="/icon-192.png" alt="GNSS Vision" className="w-11 h-11 rounded-xl shadow-lg shadow-brand-blue/25" />
          <div>
            <p className="font-bold text-white text-lg leading-5 tracking-tight">GNSS</p>
            <p className="text-[11px] tracking-[0.2em] text-brand-blue-light uppercase font-semibold mt-0.5">Vision</p>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.label}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 no-underline group ${
                  isActive
                    ? 'bg-brand-blue/15 text-brand-blue-light border border-brand-blue/25 shadow-sm'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? 'text-brand-blue' : 'group-hover:text-slate-200'}`} />
                <span className="text-sm">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto text-brand-blue/60" />}
              </Link>
            );
          })}
        </nav>

        {/* FOOTER */}
        <div className="pt-5 border-t border-slate-800/50 space-y-1.5">
          <Link
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium text-sm no-underline ${
              location.pathname === '/settings'
                ? 'bg-brand-blue/15 text-brand-blue-light border border-brand-blue/25'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <Settings className="w-[18px] h-[18px]" />
            <span>Settings</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors font-medium text-sm"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 relative overflow-hidden min-h-screen">
        {/* TOP BAR (MOBILE) */}
        <header className="sticky top-0 z-30 lg:hidden flex items-center gap-3 px-4 py-3 bg-primary-dark/90 backdrop-blur-lg border-b border-slate-800/50">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <img src="/icon-192.png" alt="GNSS Vision" className="w-7 h-7 rounded-lg" />
            <span className="font-semibold text-white text-sm">
              {currentPage?.label || 'GNSS Vision'}
            </span>
          </div>
        </header>

        {/* DECORATIVE BACKGROUND */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] bg-brand-blue/5 rounded-full blur-[100px]" />
          <div className="absolute top-1/3 -right-32 w-[400px] h-[400px] bg-cyan/5 rounded-full blur-[100px]" />
          <div className="absolute -bottom-32 left-1/3 w-[400px] h-[400px] bg-purple/3 rounded-full blur-[100px]" />
        </div>

        {/* SUBTLE GRID */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(90deg,rgba(148,163,184,0.15)_1px,transparent_1px),linear-gradient(rgba(148,163,184,0.15)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

        {/* CONTENT */}
        <section className="relative z-10 p-5 md:p-8 h-full flex flex-col overflow-y-auto">
          {children}
        </section>
      </main>
    </div>
  );
}
