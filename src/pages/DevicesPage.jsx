import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Smartphone, Loader, ChevronUp, ChevronDown } from 'lucide-react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import DeviceModal from '../components/DeviceModal';
import { DashboardLayout } from '../components/DashboardLayout';
import { useDevices, useAddDevice, useUpdateDevice, useDeleteDevice } from '../features/useDevices';
import { Button } from '../components/ui/Button';

export default function DevicesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sorting, setSorting] = useState([]);

  const { data: devices = [], isLoading, isError } = useDevices();
  const addDevice = useAddDevice();
  const updateDevice = useUpdateDevice(editingDevice?.id);
  const deleteDevice = useDeleteDevice();

  // Create column helper for type safety
  const columnHelper = createColumnHelper();

  const columns = [
    columnHelper.accessor('deviceName', {
      header: 'Device Name',
      cell: (info) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-blue-300" />
          </div>
          <span className="text-sm font-medium text-white">{info.getValue()}</span>
        </div>
      ),
      enableSorting: true,
    }),
    columnHelper.accessor('deviceCode', {
      header: 'Device Code',
      cell: (info) => (
        <span className="text-sm text-slate-400 font-mono">{info.getValue()}</span>
      ),
      enableSorting: true,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <span className={`text-xs px-3 py-1.5 rounded-full border font-medium ${
          info.getValue() === 'active'
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
            : 'bg-slate-500/20 text-slate-300 border-slate-400/30'
        }`}>
          {info.getValue() === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
      enableSorting: true,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Actions',
      cell: (info) => (
        <div className="flex items-center justify-end gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => {
              setEditingDevice(info.row.original);
              setIsModalOpen(true);
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-blue-300 hover:bg-blue-500/20 transition-colors"
            title="Edit device"
          >
            <Edit2 className="w-4 h-4" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this device?')) {
                deleteDevice.mutate(info.row.original.id);
              }
            }}
            disabled={deleteDevice.isPending}
            className="p-2 rounded-lg text-slate-400 hover:text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete device"
          >
            {deleteDevice.isPending ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      ),
      enableSorting: false,
      meta: {
        align: 'right',
      },
    }),
  ];

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch = device.deviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        device.deviceCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || device.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [devices, searchTerm, filterStatus]);

  const table = useReactTable({
    data: filteredDevices,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const handleOpenModal = () => {
    setEditingDevice(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDevice(null);
  };

  const handleSubmit = async (formData) => {
    if (editingDevice) {
      return updateDevice.mutate(formData, {
        onSuccess: () => {
          handleCloseModal();
        },
      });
    } else {
      return addDevice.mutate(formData, {
        onSuccess: () => {
          handleCloseModal();
        },
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Devices</h1>
            <p className="text-slate-400 mt-1">Manage your fleet of connected devices.</p>
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="button"
              variant="primary"
              fullWidth={false}
              className="gap-2 px-6"
              onClick={handleOpenModal}
            >
              <Plus className="w-5 h-5" />
              Add Device
            </Button>
          </motion.div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Search devices by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all"
          />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-2.5 text-slate-100 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400/50 transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : isError ? (
        <div className="p-6 border border-red-700/50 rounded-xl bg-red-500/10">
          <p className="text-red-300">Failed to load devices. Please try again.</p>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="p-12 border border-dashed border-slate-700 rounded-xl text-center">
          <Smartphone className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <p className="text-slate-400">
            {searchTerm || filterStatus !== 'all' ? 'No devices match your filters.' : 'No devices yet. Add your first device to get started!'}
          </p>
        </div>
      ) : (
        <div className="border border-slate-700 rounded-xl overflow-hidden bg-slate-900/45 backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-slate-700 bg-slate-900/60">
                    {headerGroup.headers.map((header) => {
                      const align = header.column.columnDef.meta?.align || 'left';
                      return (
                        <th
                          key={header.id}
                          className={`px-6 py-4 text-sm font-semibold text-slate-300 ${
                            align === 'right' ? 'text-right' : 'text-left'
                          }`}
                        >
                          <div
                            className={`flex items-center gap-2 ${
                              align === 'right' ? 'justify-end' : 'justify-start'
                            } ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {header.column.getIsSorted() === 'asc' && (
                              <ChevronUp className="w-4 h-4 text-slate-500" />
                            )}
                            {header.column.getIsSorted() === 'desc' && (
                              <ChevronDown className="w-4 h-4 text-slate-500" />
                            )}
                            {!header.column.getIsSorted() && header.column.getCanSort() && (
                              <div className="w-4 h-4" />
                            )}
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-slate-800 hover:bg-slate-900/60 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => {
                      const align = cell.column.columnDef.meta?.align || 'left';
                      return (
                        <td
                          key={cell.id}
                          className={`px-6 py-4 ${
                            align === 'right' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      );
                    })}
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <DeviceModal
        isOpen={isModalOpen}
        device={editingDevice}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isLoading={addDevice.isPending || updateDevice.isPending}
      />
    </DashboardLayout>
  );
}
