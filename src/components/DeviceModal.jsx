import { useState, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 30 },
  },
  exit: { opacity: 0, scale: 0.95, y: 20, transition: { duration: 0.2 } },
};

const DeviceModal = memo(function DeviceModal({
  isOpen,
  device,
  onClose,
  onSubmit,
  isLoading,
}) {
  const [form, setForm] = useState({
    deviceName: '',
    deviceCode: '',
    status: 'active',
  });
  const [errors, setErrors] = useState({});

  // Sync form state when device prop or isOpen changes
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    
    if (device) {
      setForm({
        deviceName: device.deviceName || '',
        deviceCode: device.deviceCode || '',
        status: device.status || 'active',
      });
    } else {
      setForm({
        deviceName: '',
        deviceCode: '',
        status: 'active',
      });
    }
    setErrors({});
  }, [device, isOpen]);

  const validateForm = () => {
    const newErrors = {};
    if (!form.deviceName?.trim()) newErrors.deviceName = 'Device name is required';
    if (!form.deviceCode?.trim()) newErrors.deviceCode = 'Device code is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(form);
    }
  };

  const handleClose = () => {
    setForm(device || { deviceName: '', deviceCode: '', status: 'active' });
    setErrors({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={handleClose}
        >
          <motion.div
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">
                {device ? 'Update Device' : 'Add New Device'}
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-slate-400 hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <Input
                  label="Device Name"
                  placeholder="e.g., Courier Bike 07"
                  icon="user"
                  value={form.deviceName}
                  onChange={(e) => setForm({ ...form, deviceName: e.target.value })}
                />
                {errors.deviceName && <p className="text-red-400 text-xs mt-1 ml-1">{errors.deviceName}</p>}
              </div>

              <div>
                <Input
                  label="Device Code"
                  placeholder="e.g., G00001"
                  value={form.deviceCode}
                  onChange={(e) => setForm({ ...form, deviceCode: e.target.value })}
                  disabled={!!device}
                />
                {errors.deviceCode && <p className="text-red-400 text-xs mt-1 ml-1">{errors.deviceCode}</p>}
                {device && <p className="text-slate-400 text-xs mt-1 ml-1">Device code cannot be changed</p>}
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-400 ml-1 block mb-1.5">
                  Status
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-3 text-slate-100 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="primary"
                  fullWidth
                  className="py-3"
                  onClick={handleClose}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  className="py-3"
                  isLoading={isLoading}
                >
                  {device ? 'Update' : 'Add'} Device
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export default DeviceModal;
