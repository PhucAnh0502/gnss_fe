import { useEffect, useMemo, useState } from 'react';
import {
  Camera,
  Loader2,
  MapPin,
  Radio,
  RotateCcw,
  Save,
  Satellite,
  Settings2,
  Timer,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardLayout } from '../components/DashboardLayout';
import { useDevices } from '../features/useDevices';
import { useDeviceConfig } from '../features/useDeviceConfig';

const MotionSection = motion.section;

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

const MOVING_INTERVALS = [
  { value: 5, label: '5s' },
  { value: 10, label: '10s' },
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
];

const STATIONARY_INTERVALS = [
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
  { value: 120, label: '2m' },
];

const CAPTURE_INTERVALS = [
  { value: 10, label: '10s' },
  { value: 30, label: '30s' },
  { value: 60, label: '1m' },
  { value: 120, label: '2m' },
  { value: 300, label: '5m' },
  { value: 600, label: '10m' },
];

const CAPTURE_DISTANCES = [
  { value: 50, label: '50m' },
  { value: 100, label: '100m' },
  { value: 200, label: '200m' },
  { value: 500, label: '500m' },
  { value: 1000, label: '1km' },
];

function ChipSelector({ options, value, onChange, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isSelected
                ? 'bg-blue-500/20 border-blue-400/50 text-blue-200'
                : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function ToggleSwitch({ enabled, onChange, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? 'bg-blue-500' : 'bg-slate-700'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function ModeSelector({ mode, onChange, disabled }) {
  return (
    <div className="flex gap-3">
      {[
        { id: 'timer', label: 'Timer', icon: Timer },
        { id: 'distance', label: 'Distance', icon: MapPin },
      ].map(({ id, label, icon: Icon }) => {
        const isSelected = mode === id;
        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
              isSelected
                ? 'bg-blue-500/15 border-blue-400/50 text-blue-200'
                : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:border-slate-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-xs font-semibold">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function DeviceConfigPage() {
  const { data: devices = [], isLoading: devicesLoading } = useDevices();
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  // Auto-select first device
  useEffect(() => {
    if (devices.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devices[0].id);
    }
  }, [devices, selectedDeviceId]);

  const selectedDevice = useMemo(
    () => devices.find((d) => d.id === selectedDeviceId) || null,
    [devices, selectedDeviceId]
  );

  const { config, isLoading: configLoading, isSaving, updateConfig } = useDeviceConfig(
    selectedDeviceId,
    selectedDevice?.deviceCode
  );

  // Local form state (dirty tracking)
  const [form, setForm] = useState(null);
  const [isDirty, setIsDirty] = useState(false);

  // Sync form when config loads or device changes
  useEffect(() => {
    if (config) {
      setForm({
        trackingEnabled: config.trackingEnabled ?? false,
        publishIntervalMoving: config.publishIntervalMoving ?? 5,
        publishIntervalStationary: config.publishIntervalStationary ?? 15,
        autoCaptureEnabled: config.autoCaptureEnabled ?? false,
        autoCaptureMode: config.autoCaptureMode ?? 'timer',
        autoCaptureInterval: config.autoCaptureInterval ?? 60,
        autoCaptureDistance: config.autoCaptureDistance ?? 100,
      });
      setIsDirty(false);
    }
  }, [config]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!form || !selectedDeviceId) return;
    await updateConfig(form);
    setIsDirty(false);
  };

  const handleReset = () => {
    if (config) {
      setForm({
        trackingEnabled: config.trackingEnabled ?? false,
        publishIntervalMoving: config.publishIntervalMoving ?? 5,
        publishIntervalStationary: config.publishIntervalStationary ?? 15,
        autoCaptureEnabled: config.autoCaptureEnabled ?? false,
        autoCaptureMode: config.autoCaptureMode ?? 'timer',
        autoCaptureInterval: config.autoCaptureInterval ?? 60,
        autoCaptureDistance: config.autoCaptureDistance ?? 100,
      });
      setIsDirty(false);
    }
  };

  const isLoading = devicesLoading || configLoading;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Device Configuration</h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Remotely configure tracking and auto-capture for your devices.
            </p>
          </div>
          {isDirty && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/60 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Discard
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-400/40 bg-blue-500/15 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500/25 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save & Push
              </button>
            </div>
          )}
        </div>

        {/* Device Selector */}
        <MotionSection variants={cardVariants} initial="hidden" animate="visible">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-950/40 backdrop-blur-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-2.5">
                <Settings2 className="h-5 w-5 text-slate-300" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Select Device</h2>
                <p className="text-xs text-slate-500">Choose a device to configure remotely</p>
              </div>
            </div>

            <div className="relative">
              <Satellite className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <select
                value={selectedDeviceId || ''}
                onChange={(e) => setSelectedDeviceId(e.target.value || null)}
                className="w-full appearance-none rounded-xl border border-slate-700/60 bg-slate-900/60 py-3 pl-11 pr-10 text-sm text-slate-200 outline-none transition-colors focus:border-blue-400/50"
              >
                <option value="">— Select a device —</option>
                {devices.map((device) => (
                  <option key={device.id} value={device.id}>
                    {device.deviceName} ({device.deviceCode}) · {device.status}
                  </option>
                ))}
              </select>
            </div>

            {selectedDevice && (
              <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
                <span className={`w-2 h-2 rounded-full ${selectedDevice.status === 'active' ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                <span>{selectedDevice.status === 'active' ? 'Device is online' : 'Device is offline — config will apply when it reconnects'}</span>
              </div>
            )}
          </div>
        </MotionSection>

        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 text-slate-500 animate-spin" />
          </div>
        )}

        {!isLoading && form && selectedDeviceId && (
          <>
            {/* Tracking Config */}
            <MotionSection variants={cardVariants} initial="hidden" animate="visible">
              <div className="rounded-2xl border border-slate-700/50 bg-slate-950/40 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5">
                      <Radio className="h-5 w-5 text-emerald-300" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white">GNSS Tracking</h2>
                      <p className="text-xs text-slate-500">Enable live location broadcasting via MQTT</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    enabled={form.trackingEnabled}
                    onChange={(v) => updateField('trackingEnabled', v)}
                    disabled={isSaving}
                  />
                </div>

                {form.trackingEnabled && (
                  <div className="space-y-5 pt-4 border-t border-slate-800">
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-2.5">Publish Interval (Moving)</p>
                      <ChipSelector
                        options={MOVING_INTERVALS}
                        value={form.publishIntervalMoving}
                        onChange={(v) => updateField('publishIntervalMoving', v)}
                        disabled={isSaving}
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-2.5">Publish Interval (Stationary)</p>
                      <ChipSelector
                        options={STATIONARY_INTERVALS}
                        value={form.publishIntervalStationary}
                        onChange={(v) => updateField('publishIntervalStationary', v)}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                )}
              </div>
            </MotionSection>

            {/* Auto-Capture Config */}
            <MotionSection variants={cardVariants} initial="hidden" animate="visible">
              <div className="rounded-2xl border border-slate-700/50 bg-slate-950/40 backdrop-blur-sm p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl border border-violet-500/30 bg-violet-500/10 p-2.5">
                      <Camera className="h-5 w-5 text-violet-300" />
                    </div>
                    <div>
                      <h2 className="text-base font-semibold text-white">Auto Capture</h2>
                      <p className="text-xs text-slate-500">Automatically capture photos with GNSS metadata</p>
                    </div>
                  </div>
                  <ToggleSwitch
                    enabled={form.autoCaptureEnabled}
                    onChange={(v) => updateField('autoCaptureEnabled', v)}
                    disabled={isSaving}
                  />
                </div>

                {form.autoCaptureEnabled && (
                  <div className="space-y-5 pt-4 border-t border-slate-800">
                    <div>
                      <p className="text-xs font-medium text-slate-400 mb-2.5">Capture Mode</p>
                      <ModeSelector
                        mode={form.autoCaptureMode}
                        onChange={(v) => updateField('autoCaptureMode', v)}
                        disabled={isSaving}
                      />
                    </div>

                    {form.autoCaptureMode === 'timer' ? (
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-2.5">Capture Interval</p>
                        <ChipSelector
                          options={CAPTURE_INTERVALS}
                          value={form.autoCaptureInterval}
                          onChange={(v) => updateField('autoCaptureInterval', v)}
                          disabled={isSaving}
                        />
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-2.5">Trigger Distance</p>
                        <ChipSelector
                          options={CAPTURE_DISTANCES}
                          value={form.autoCaptureDistance}
                          onChange={(v) => updateField('autoCaptureDistance', v)}
                          disabled={isSaving}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </MotionSection>

            {/* Config metadata */}
            {config?.updatedAt && (
              <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 px-4 py-3 text-xs text-slate-500">
                Last updated: {new Date(config.updatedAt).toLocaleString()}
              </div>
            )}
          </>
        )}

        {!isLoading && !selectedDeviceId && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/30 p-6">
              <Settings2 className="h-10 w-10 text-slate-600 mx-auto" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-300">No device selected</p>
            <p className="mt-1 text-xs text-slate-500">Choose a device above to configure it remotely.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
