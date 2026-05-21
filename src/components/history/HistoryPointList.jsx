import { useState, useRef } from 'react';
import {
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { PointDetailModal } from './PointDetailModal';

const PAGE_SIZE = 15;

export function HistoryPointList({ historyData, isLoading, selectedDeviceId, onPointSelect }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [modalPoint, setModalPoint] = useState(null);
  const [modalIndex, setModalIndex] = useState(null);
  const prevDataRef = useRef(historyData);

  const totalPages = Math.ceil(historyData.length / PAGE_SIZE);
  const paginatedData = historyData.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  // Reset page when data changes
  if (prevDataRef.current !== historyData) {
    prevDataRef.current = historyData;
    if (currentPage !== 0) setCurrentPage(0);
    if (modalPoint !== null) setModalPoint(null);
    if (modalIndex !== null) setModalIndex(null);
  }

  const handleOpenDetail = (index, point) => {
    const globalIndex = currentPage * PAGE_SIZE + index;
    setModalPoint(point);
    setModalIndex(globalIndex);
    onPointSelect?.(globalIndex);
  };

  const handleCloseModal = () => {
    setModalPoint(null);
    setModalIndex(null);
    onPointSelect?.(null);
  };

  if (historyData.length === 0 && !isLoading) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
        <div className="p-12 text-center">
          <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">
            {selectedDeviceId ? 'No tracking data found for the selected period' : 'Select a device to view history'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-slate-700 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Tracking Points</h3>
            <p className="text-xs text-slate-400 mt-0.5">{historyData.length} points · Click a row to view full GNSS details</p>
          </div>
        </div>

        {/* Point List */}
        <div className="divide-y divide-slate-700/40">
          {paginatedData.map((point, index) => {
            const globalIndex = currentPage * PAGE_SIZE + index;
            const isSelected = modalIndex === globalIndex;
            const coordinates = point.location?.coordinates || [];
            const lat = coordinates[1];
            const lng = coordinates[0];
            const time = new Date(point.timestamp);

            return (
              <button
                key={point.id || index}
                type="button"
                onClick={() => handleOpenDetail(index, point)}
                className={`w-full px-5 py-3.5 flex items-center gap-4 text-left transition-colors ${
                  isSelected ? 'bg-blue-500/10 border-l-2 border-l-blue-400' : 'hover:bg-slate-800/30 border-l-2 border-l-transparent'
                }`}
              >
                {/* Index */}
                <span className="text-xs text-slate-500 font-mono w-8 shrink-0">
                  #{globalIndex + 1}
                </span>

                {/* Time */}
                <div className="flex items-center gap-2 w-40 shrink-0">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <div>
                    <p className="text-sm text-white font-medium">{time.toLocaleTimeString('vi-VN')}</p>
                    <p className="text-[10px] text-slate-500">{time.toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>

                {/* Coordinates */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-sm text-slate-300 font-mono truncate">
                    {lat != null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : 'N/A'}
                  </span>
                </div>

                {/* Quick stats */}
                <div className="hidden md:flex items-center gap-4 shrink-0">
                  <span className="text-xs text-cyan-300 font-medium w-20 text-right">
                    {(point.speed || 0).toFixed(1)} km/h
                  </span>
                  <span className="text-xs text-slate-400 w-16 text-right">
                    {(point.altitude || 0).toFixed(0)} m
                  </span>
                  <span className="text-xs text-slate-400 w-12 text-right">
                    {point.satellites_used || 0} sat
                  </span>
                </div>

                {/* View icon */}
                <div className="shrink-0 text-slate-500">
                  <Eye className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-700/50 bg-slate-800/20">
            <span className="text-xs text-slate-400">
              Page {currentPage + 1} of {totalPages} · Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, historyData.length)} of {historyData.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => p - 1)}
                disabled={currentPage === 0}
                className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={currentPage >= totalPages - 1}
                className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {modalPoint && (
          <PointDetailModal
            key="point-detail-modal"
            point={modalPoint}
            pointIndex={modalIndex}
            onClose={handleCloseModal}
          />
        )}
      </AnimatePresence>
    </>
  );
}
