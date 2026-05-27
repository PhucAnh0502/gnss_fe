import { useState } from 'react';
import {
  User,
  Shield,
  Lock,
  Mail,
  BadgeCheck,
  Save,
  Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { DashboardLayout } from '../components/DashboardLayout';
import { useChangePassword } from '../features/useAuth';
import { getProfile } from '../services/authService.jsx';
import { validateChangePasswordForm } from '../services/authPageService.jsx';
import { toast } from 'sonner';

const MotionSection = motion.section;

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'security', label: 'Security', icon: Shield },
];

function SettingsInput({ label, icon: Icon, type = 'text', disabled, error, ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <Icon className={`absolute left-3.5 w-4 h-4 pointer-events-none ${disabled ? 'text-slate-600' : 'text-slate-500'}`} />
        )}
        <input
          type={type}
          disabled={disabled}
          className={`w-full rounded-xl border bg-slate-900/60 px-4 py-2.5 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-600 ${
            Icon ? 'pl-11' : ''
          } ${
            disabled
              ? 'border-slate-800/40 cursor-not-allowed opacity-60'
              : 'border-slate-700/60 focus:border-brand-blue/50'
          } ${error ? 'border-red-500/50' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

function ProfileTab() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: getProfile,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 text-slate-500 animate-spin" />
      </div>
    );
  }

  const displayName = profile?.username || '—';
  const email = profile?.email || '—';
  const role = profile?.role || 'user';
  const createdAt = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—';
  const initials = displayName !== '—'
    ? displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="space-y-6">
      {/* Avatar & basic info */}
      <MotionSection
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border border-slate-700/50 bg-slate-950/40 backdrop-blur-sm p-6"
      >
        <h3 className="text-base font-semibold text-white mb-5">Account Information</h3>

        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-blue/30 to-cyan-500/20 border border-brand-blue/30 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{initials}</span>
            </div>
          </div>

          {/* Info fields */}
          <div className="flex-1 w-full space-y-4">
            <SettingsInput
              label="Display Name"
              icon={User}
              value={displayName}
              disabled
              readOnly
            />
            <SettingsInput
              label="Email"
              icon={Mail}
              type="email"
              value={email}
              disabled
              readOnly
            />
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
              <div className="inline-flex items-center gap-2 rounded-xl border border-slate-700/60 bg-slate-900/60 px-3.5 py-2.5">
                <BadgeCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-slate-200 capitalize">{role}</span>
              </div>
            </div>
          </div>
        </div>
      </MotionSection>

      {/* Session info */}
      <MotionSection
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border border-slate-700/50 bg-slate-950/40 backdrop-blur-sm p-6"
      >
        <h3 className="text-base font-semibold text-white mb-4">Account Details</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-3.5 py-2.5">
            <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-medium">Status</p>
            <div className="mt-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-sm text-slate-200">Active</span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/40 px-3.5 py-2.5">
            <p className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-medium">Member Since</p>
            <p className="mt-1 text-sm text-slate-200">{createdAt}</p>
          </div>
        </div>
      </MotionSection>
    </div>
  );
}

function SecurityTab() {
  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const changePassword = useChangePassword();

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateChangePasswordForm(form);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    changePassword.mutate(
      {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
        confirmPassword: form.confirmPassword,
      },
      {
        onSuccess: () => {
          setForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
          setErrors({});
          toast.success('Password updated', { description: 'Your password has been changed successfully.' });
        },
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
      },
    );
  };

  return (
    <div className="space-y-6">
      <MotionSection
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="rounded-2xl border border-slate-700/50 bg-slate-950/40 backdrop-blur-sm p-6"
      >
        <h3 className="text-base font-semibold text-white mb-1">Change Password</h3>
        <p className="text-xs text-slate-500 mb-5">
          Update your password to keep your account secure. Password must be at least 6 characters with 1 digit and 1 special character.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <SettingsInput
            label="Current Password"
            icon={Lock}
            type="password"
            placeholder="••••••••"
            value={form.oldPassword}
            onChange={(e) => setForm({ ...form, oldPassword: e.target.value })}
            error={errors.oldPassword}
          />
          <SettingsInput
            label="New Password"
            icon={Lock}
            type="password"
            placeholder="••••••••"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            error={errors.newPassword}
          />
          <SettingsInput
            label="Confirm New Password"
            icon={Lock}
            type="password"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            error={errors.confirmPassword}
          />

          <div className="pt-2">
            <button
              type="submit"
              disabled={changePassword.isPending}
              className="inline-flex items-center gap-2 rounded-xl border border-brand-blue/40 bg-brand-blue/15 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-blue/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changePassword.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Change Password
            </button>
          </div>
        </form>
      </MotionSection>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Settings</h1>
          <p className="mt-1.5 text-sm text-slate-400 max-w-lg">
            Manage your account information and security preferences.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-700/50 bg-slate-950/40 backdrop-blur-sm p-1.5 w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-blue/15 text-white border border-brand-blue/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'profile' && <ProfileTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </DashboardLayout>
  );
}
