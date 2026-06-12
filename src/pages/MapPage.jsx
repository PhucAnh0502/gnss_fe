import { useMemo, useState } from 'react';
import { Globe, Map as MapIcon, Satellite, ChevronLeft, ChevronRight, Loader2, Search } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../components/DashboardLayout';
import { MapTrackingTab } from '../components/map/MapTrackingTab';
import { GlobeTrackingTab } from '../components/map/GlobeTrackingTab';
import { useMap } from '../features/useMap';
import { HANOI_CENTER } from '../services/mapService.jsx';

const tabClass = (isActive) => (
  `px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
    isActive
      ? 'bg-blue-500/25 border-blue-400/50 text-blue-200'
      : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800/70'
  }`
);

export default function MapPage() {
  const [activeTab, setActiveTab] = useState('map');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [deviceSearch, setDeviceSearch] = useState('');

  const {
    selectedDeviceId,
    setSelectedDeviceId,
    selectedDevice,
    displayDevices,
    deviceTracks,
    devicePoints,
    selectedDeviceTrack,
    latestPoint,
    fixSvidSet,
    allSatelliteIds,
    isLoading,
    isError,
  } = useMap();

  const filteredDevices = useMemo(() => {
    const keyword = deviceSearch.trim().toLowerCase();
    if (!keyword) return displayDevices;
    return displayDevices.filter((device) => device.deviceName.toLowerCase().includes(keyword));
  }, [deviceSearch, displayDevices]);

  // Get only satellites from selected device for globe 3D view
  const selectedDeviceSatelliteIds = useMemo(() => {
    if (!latestPoint?.raw?.status) return [];
    const ids = latestPoint.raw.status.map((s) => s.svid);
    return [...new Set(ids)].sort((a, b) => a - b);
  }, [latestPoint]);

  return (
    <DashboardLayout>
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Map & Globe Tracking</h1>
            <p className="text-slate-400 mt-1">Switch between Hanoi map tracking and satellite globe visualization.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <button type="button" className={tabClass(activeTab === 'map')} onClick={() => setActiveTab('map')}>
              <span className="inline-flex items-center gap-2"><MapIcon className="w-4 h-4" /> Map</span>
            </button>
            <button type="button" className={tabClass(activeTab === 'globe')} onClick={() => setActiveTab('globe')}>
              <span className="inline-flex items-center gap-2"><Globe className="w-4 h-4" /> Globe 3D</span>
            </button>
          </div>
        </div>

        <div className="mt-6 relative h-[clamp(630px,67vh,800px)] rounded-2xl border border-slate-800 bg-slate-950/65 overflow-hidden">
          {activeTab === 'map' ? (
            <MapTrackingTab
              center={HANOI_CENTER}
              devicePoints={devicePoints}
              selectedTrack={selectedDeviceTrack?.points || []}
              selectedDeviceCode={selectedDevice?.deviceCode}
            />
          ) : (
            <GlobeTrackingTab
              satelliteIds={selectedDevice ? selectedDeviceSatelliteIds : allSatelliteIds}
              highlightedIds={fixSvidSet}
              devicePoints={devicePoints}
              selectedDeviceCode={selectedDevice?.deviceCode || null}
              focusPosition={latestPoint ? { lat: latestPoint.mapLat, lng: latestPoint.mapLng } : null}
              satelliteStatuses={latestPoint?.raw?.status || []}
            />
          )}

          <AnimatePresence mode="wait">
            {selectedDevice && (
              <div
                key={selectedDevice.id}
                className="absolute left-4 top-4 z-900 max-w-md rounded-xl border border-slate-700 bg-slate-950/88 p-4 text-xs md:text-sm text-slate-200 backdrop-blur"
              >
                <h3 className="font-semibold text-blue-200 mb-2">{activeTab === 'map' ? 'GNSS RawData (Mock / Live)' : 'Satellite Fix Info'}</h3>
                {latestPoint ? (
                  <div className="space-y-1">
                    <p><span className="text-slate-400">Source:</span> {selectedDeviceTrack?.isLive ? 'Live Socket' : 'History API'}</p>
                    <p><span className="text-slate-400">Device:</span> {selectedDevice?.deviceCode}</p>
                    <p><span className="text-slate-400">Timestamp:</span> {new Date(latestPoint.ts * 1000).toLocaleString()}</p>
                    <p><span className="text-slate-400">satUsed:</span> {latestPoint.satUsed} / sat: {latestPoint.sat}</p>
                    <p><span className="text-slate-400">avgCn0:</span> {latestPoint.avgCn0} dB-Hz</p>
                    <p><span className="text-slate-400">Fix satellites:</span> {fixSvidSet.size ? [...fixSvidSet].join(', ') : 'none'}</p>
                    {activeTab === 'map' && latestPoint.raw?.clock && (
                      <pre className="mt-2 max-h-40 overflow-auto rounded bg-slate-900/80 p-2 text-[11px] leading-snug text-slate-300">
{JSON.stringify(latestPoint.raw.clock, null, 2)}
                      </pre>
                    )}
                  </div>
                ) : (
                  <p className="text-slate-400">Click a device in the sidebar to highlight it and show its track.</p>
                )}
              </div>
            )}
          </AnimatePresence>

          <div className={`absolute top-0 right-0 h-full z-950 transition-all duration-300 ${sidebarOpen ? 'w-80' : 'w-12'}`}>
            <div className="h-full border-l border-slate-800 bg-slate-950/92 backdrop-blur flex flex-col">
              <button
                type="button"
                onClick={() => setSidebarOpen((value) => !value)}
                className="self-start m-2 rounded-lg border border-slate-700 bg-slate-900/90 p-2 text-slate-300 hover:text-white"
              >
                {sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>

              {sidebarOpen && (
                <>
                  <div className="px-4 pb-3 border-b border-slate-800">
                    <label htmlFor="device-sidebar-search" className="sr-only">Search device by name</label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                      <input
                        id="device-sidebar-search"
                        type="text"
                        value={deviceSearch}
                        onChange={(event) => setDeviceSearch(event.target.value)}
                        placeholder="Search device by name..."
                        className="w-full rounded-lg border border-slate-700 bg-slate-900/80 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder:text-slate-500 outline-none transition-colors focus:border-blue-400/60"
                      />
                    </div>
                  </div>

                  <div className="overflow-y-auto p-3 space-y-2">
                    {isLoading && (
                      <div className="flex items-center gap-2 text-slate-300 text-sm px-2 py-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading devices...
                      </div>
                    )}

                    {isError && (
                      <div className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-200">
                        Failed to load devices API.
                      </div>
                    )}

                    {filteredDevices.map((device) => {
                      const isSelected = selectedDevice?.id === device.id;
                      const track = deviceTracks.find((item) => item.id === device.id);
                      const latest = track?.points?.[track.points.length - 1] || null;
                      const fixCount = (latest?.raw?.status || []).filter((s) => s.usedInFix).length || latest?.satUsed || 0;

                      return (
                        <button
                          key={device.id}
                          type="button"
                          onClick={() => setSelectedDeviceId((currentId) => (currentId === device.id ? null : device.id))}
                          className={`w-full text-left rounded-xl border p-3 transition-colors ${
                            isSelected
                              ? 'border-blue-400/50 bg-blue-500/15'
                              : 'border-slate-700 bg-slate-900/65 hover:bg-slate-800/70'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-white">{device.deviceName}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{device.deviceCode}</p>
                            </div>
                            <span className={`text-[10px] px-2 py-1 rounded-full border ${
                              device.status === 'active'
                                ? 'text-emerald-300 border-emerald-400/40 bg-emerald-500/15'
                                : 'text-rose-300 border-rose-400/40 bg-rose-500/15'
                            }`}>
                              {device.status === 'active' ? 'active' : 'inactive'}
                            </span>
                          </div>
                          <div className="mt-2 text-[11px] text-slate-300 flex items-center justify-between gap-2">
                            <span>Fix Sats: {fixCount}</span>
                            <span className="inline-flex items-center gap-1 text-slate-400">
                              <Satellite className="w-3.5 h-3.5" />
                              {latest ? `${latest.mapLat.toFixed(4)}, ${latest.mapLng.toFixed(4)}` : 'no position'}
                            </span>
                          </div>
                        </button>
                      );
                    })}

                    {!isLoading && !isError && filteredDevices.length === 0 && (
                      <div className="rounded-lg border border-slate-700 bg-slate-900/65 p-3 text-xs text-slate-400">
                        No devices match "{deviceSearch.trim()}".
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
