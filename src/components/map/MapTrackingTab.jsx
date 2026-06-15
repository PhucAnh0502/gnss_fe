import { useState, useCallback, useRef, useMemo } from 'react';
import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Polygon, Tooltip, Popup, useMap, useMapEvents } from 'react-leaflet';
import { AnimatePresence, motion } from 'framer-motion';
import { useAlertZones, useCreateAlertZone, useUpdateAlertZone, useDeleteAlertZone } from '../../features/useAlertZones';
import { Plus, Pencil, Trash2, X, Loader2, MapPin, Undo2, Search, Shield } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ZONE_COLORS = ['#ef4444', '#8b5cf6', '#f59e0b', '#10b981', '#3b82f6', '#ec4899'];

function getZoneColor(index) {
  return ZONE_COLORS[index % ZONE_COLORS.length];
}

function parseZonePositions(zone) {
  if (!zone?.polygon?.coordinates?.[0]) return [];
  return zone.polygon.coordinates[0].map(([lng, lat]) => [lat, lng]);
}

function latLngsToGeoJSON(latLngs) {
  const coords = latLngs.map(([lat, lng]) => [lng, lat]);
  if (coords.length > 0) {
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coords.push([...first]);
    }
  }
  return { type: 'Polygon', coordinates: [coords] };
}

// ─── MapViewportSync (existing) ───────────────────────────────────────────────

function MapViewportSync({ center, devicePoints, selectedTrack, selectedDeviceCode }) {
  const map = useMap();

  useEffect(() => {
    if (selectedDeviceCode && devicePoints.length > 0) {
      const selectedDevice = devicePoints.find((d) => d.deviceCode === selectedDeviceCode);
      if (selectedDevice?.point) {
        const { mapLat, mapLng } = selectedDevice.point;
        if (Number.isFinite(mapLat) && Number.isFinite(mapLng)) {
          map.setView([mapLat, mapLng], 15, { animate: true, duration: 0.6 });
          return;
        }
      }
    }
  }, [center, devicePoints, map, selectedTrack, selectedDeviceCode]);

  return null;
}

// ─── Location Search (Photon geocoder) ────────────────────────────────────────

function LocationSearch() {
  const map = useMap();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef(null);

  const handleSearch = useCallback(async (searchText) => {
    if (!searchText.trim() || searchText.trim().length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const center = map.getCenter();
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(searchText)}&limit=8&lat=${center.lat}&lon=${center.lng}&lang=default`
      );
      const data = await res.json();
      const features = (data.features || []).map((f, idx) => ({
        place_id: idx,
        lat: f.geometry.coordinates[1],
        lon: f.geometry.coordinates[0],
        display_name: [
          f.properties.name,
          f.properties.street,
          f.properties.district,
          f.properties.city || f.properties.county,
          f.properties.state,
          f.properties.country,
        ].filter(Boolean).join(', '),
      }));
      setResults(features);
      setShowResults(features.length > 0);
    } catch {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [map]);

  const handleInputChange = useCallback((e) => {
    const value = e.target.value;
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => handleSearch(value), 400);
  }, [handleSearch]);

  const handleSelect = useCallback((result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    map.flyTo([lat, lng], 16, { duration: 1.5 });
    setQuery(result.display_name.split(',')[0]);
    setShowResults(false);
    setResults([]);
  }, [map]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      handleSearch(query);
    }
    if (e.key === 'Escape') {
      setShowResults(false);
    }
  }, [handleSearch, query]);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-72">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Tìm kiếm địa điểm..."
          className="w-full rounded-lg border border-slate-700/80 bg-slate-950/90 backdrop-blur pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 outline-none focus:border-blue-400/60 transition-colors"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 animate-spin" />
        )}
      </div>

      {showResults && (
        <div className="mt-1 rounded-lg border border-slate-700/80 bg-slate-950/95 backdrop-blur overflow-hidden shadow-xl">
          {results.map((result) => (
            <button
              key={result.place_id}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full text-left px-3 py-2.5 text-xs text-slate-300 hover:bg-slate-800/80 border-b border-slate-800/50 last:border-b-0 transition-colors"
            >
              <span className="line-clamp-2">{result.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Drawing Layer ────────────────────────────────────────────────────────────

function DrawingLayer({ drawing, points, onAddPoint }) {
  useMapEvents({
    click(e) {
      if (!drawing) return;
      onAddPoint([e.latlng.lat, e.latlng.lng]);
    },
  });

  if (!drawing || points.length === 0) return null;

  return (
    <>
      {points.length >= 2 && (
        <Polyline
          positions={points}
          pathOptions={{ color: '#f97316', weight: 3, dashArray: '8 4' }}
        />
      )}
      {points.map((pos, idx) => (
        <CircleMarker
          key={`draw-point-${idx}`}
          center={pos}
          radius={6}
          pathOptions={{
            color: idx === 0 ? '#22c55e' : '#f97316',
            fillColor: idx === 0 ? '#22c55e' : '#fb923c',
            fillOpacity: 0.9,
            weight: 2,
          }}
        >
          <Tooltip direction="top" offset={[0, -8]} permanent={idx === 0 && points.length >= 3}>
            {idx === 0 && points.length >= 3 ? 'Click to close' : `Point ${idx + 1}`}
          </Tooltip>
        </CircleMarker>
      ))}
      {points.length >= 3 && (
        <Polyline
          positions={[points[points.length - 1], points[0]]}
          pathOptions={{ color: '#22c55e', weight: 2, dashArray: '4 4', opacity: 0.6 }}
        />
      )}
    </>
  );
}

// ─── Edit Zone Panel ──────────────────────────────────────────────────────────

function EditZonePanel({ zone, editName, setEditName, editRadius, setEditRadius, onCancel, onSuccess }) {
  const updateMutation = useUpdateAlertZone(zone.id);
  const [errors, setErrors] = useState({});

  const handleSave = async () => {
    const newErrors = {};
    if (!editName.trim()) newErrors.name = 'Name is required';
    if (editName.length > 100) newErrors.name = 'Name must be under 100 characters';
    if (editRadius < 50 || editRadius > 5000) newErrors.radius = 'Must be between 50 and 5000 meters';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const payload = {};
    if (editName.trim() !== zone.name) payload.name = editName.trim();
    if (Number(editRadius) !== zone.warningRadius) payload.warningRadius = Number(editRadius);

    if (Object.keys(payload).length === 0) {
      onSuccess();
      return;
    }

    await updateMutation.mutateAsync(payload);
    onSuccess();
  };

  return (
    <motion.div
      key="edit-form"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="absolute bottom-4 left-4 z-[1000] w-80 rounded-xl border border-slate-700 bg-slate-950/90 backdrop-blur p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Edit Alert Zone</h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Zone Name</label>
          <input
            type="text"
            value={editName}
            onChange={(e) => { setEditName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
            className={`w-full rounded-lg border bg-slate-900/60 px-3 py-2 text-sm text-slate-200 outline-none transition-colors ${
              errors.name ? 'border-rose-500/50' : 'border-slate-700 focus:border-blue-400/50'
            }`}
          />
          {errors.name && <p className="mt-1 text-xs text-rose-400">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Warning Radius (meters)</label>
          <input
            type="number"
            value={editRadius}
            onChange={(e) => { setEditRadius(e.target.value); setErrors((p) => ({ ...p, radius: undefined })); }}
            min={50}
            max={5000}
            className={`w-full rounded-lg border bg-slate-900/60 px-3 py-2 text-sm text-slate-200 outline-none transition-colors ${
              errors.radius ? 'border-rose-500/50' : 'border-slate-700 focus:border-blue-400/50'
            }`}
          />
          {errors.radius && <p className="mt-1 text-xs text-rose-400">{errors.radius}</p>}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-blue-400/40 bg-blue-500/15 text-sm font-medium text-white hover:bg-blue-500/25 disabled:opacity-50 transition-colors"
          >
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
            Save Changes
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800/60 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MapTrackingTab({ center, devicePoints, selectedTrack, selectedDeviceCode, isAdmin }) {
  const { data: zones = [] } = useAlertZones();
  const createMutation = useCreateAlertZone();
  const deleteMutation = useDeleteAlertZone();

  // Drawing state
  const [drawing, setDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedZone, setSelectedZone] = useState(null);
  const [editingZone, setEditingZone] = useState(null);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formRadius, setFormRadius] = useState(200);
  const [formErrors, setFormErrors] = useState({});

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editRadius, setEditRadius] = useState(200);

  // Parsed zone positions
  const zonePositions = useMemo(() => {
    return zones.map((zone) => ({
      ...zone,
      positions: parseZonePositions(zone),
    }));
  }, [zones]);

  // ─── Drawing handlers ─────────────────────────────────────────────────

  const handleStartDrawing = useCallback(() => {
    setDrawing(true);
    setDrawPoints([]);
    setSelectedZone(null);
    setShowCreateForm(false);
  }, []);

  const handleAddPoint = useCallback((point) => {
    setDrawPoints((prev) => [...prev, point]);
  }, []);

  const handleUndoPoint = useCallback(() => {
    setDrawPoints((prev) => prev.slice(0, -1));
  }, []);

  const handleCancelDrawing = useCallback(() => {
    setDrawing(false);
    setDrawPoints([]);
  }, []);

  const handleFinishDrawing = useCallback(() => {
    if (drawPoints.length < 3) return;
    setDrawing(false);
    setShowCreateForm(true);
    setFormName('');
    setFormRadius(200);
    setFormErrors({});
  }, [drawPoints]);

  // ─── Create handler ───────────────────────────────────────────────────

  const handleCreate = useCallback(async () => {
    const errors = {};
    if (!formName.trim()) errors.name = 'Name is required';
    if (formName.length > 100) errors.name = 'Name must be under 100 characters';
    if (formRadius < 50 || formRadius > 5000) errors.radius = 'Must be between 50 and 5000 meters';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const polygon = latLngsToGeoJSON(drawPoints);
    await createMutation.mutateAsync({
      name: formName.trim(),
      polygon,
      warningRadius: Number(formRadius),
    });

    setShowCreateForm(false);
    setDrawPoints([]);
    setFormName('');
    setFormRadius(200);
  }, [formName, formRadius, drawPoints, createMutation]);

  // ─── Delete handler ───────────────────────────────────────────────────

  const handleDelete = useCallback(async (zoneId) => {
    if (!window.confirm('Are you sure you want to delete this zone?')) return;
    await deleteMutation.mutateAsync(zoneId);
    setSelectedZone(null);
  }, [deleteMutation]);

  // ─── Edit handlers ────────────────────────────────────────────────────

  const handleStartEdit = useCallback((zone) => {
    setEditingZone(zone);
    setEditName(zone.name);
    setEditRadius(zone.warningRadius);
    setSelectedZone(null);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingZone(null);
  }, []);

  // ─── Zone click handler ───────────────────────────────────────────────

  const handleZoneClick = useCallback((zone) => {
    if (drawing) return;
    setSelectedZone((prev) => (prev?.id === zone.id ? null : zone));
  }, [drawing]);

  // ─── Render ───────────────────────────────────────────────────────────

  return (
    <>
      <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
        <MapViewportSync center={center} devicePoints={devicePoints} selectedTrack={selectedTrack} selectedDeviceCode={selectedDeviceCode} />
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Location search */}
        <LocationSearch />

        {/* Alert Zone polygons */}
        {zonePositions.map((zone, idx) => {
          if (zone.positions.length < 3) return null;
          const color = getZoneColor(idx);
          return (
            <Polygon
              key={zone.id}
              positions={zone.positions}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: selectedZone?.id === zone.id ? 0.35 : 0.15,
                weight: selectedZone?.id === zone.id ? 3 : 2,
                dashArray: '6 4',
              }}
              eventHandlers={{ click: () => handleZoneClick(zone) }}
            >
              <Tooltip direction="center" permanent className="zone-label-tooltip">
                {zone.name}
              </Tooltip>
            </Polygon>
          );
        })}

        {/* Track polyline */}
        {!!selectedTrack.length && (
          <Polyline
            positions={selectedTrack.map((point) => [point.mapLat, point.mapLng])}
            pathOptions={{ color: '#f97316', weight: 5, opacity: 0.95 }}
          />
        )}

        {/* Device markers */}
        {devicePoints.map((device) => {
          const point = device.point;
          if (!point) return null;

          const isSelected = device.deviceCode === selectedDeviceCode;
          const isActive = device.status === 'active';

          let markerColor;
          let fillColor;

          if (isSelected) {
            markerColor = '#f97316';
            fillColor = '#fb923c';
          } else if (isActive) {
            markerColor = '#38bdf8';
            fillColor = '#38bdf8';
          } else {
            markerColor = '#9ca3af';
            fillColor = '#9ca3af';
          }

          return (
            <CircleMarker
              key={device.deviceCode}
              center={[point.mapLat, point.mapLng]}
              radius={isSelected ? 9 : 6}
              pathOptions={{
                color: markerColor,
                fillColor: fillColor,
                fillOpacity: 0.95,
                weight: 2,
              }}
            >
              <Popup>
                <div className="text-slate-900">
                  <div><strong>Device:</strong> {device.deviceCode}</div>
                  <div><strong>Name:</strong> {device.deviceName}</div>
                  <div><strong>Source:</strong> {device.isLive ? 'Live Socket' : 'Last Signal'}</div>
                  <div><strong>Status:</strong> {device.status === 'active' ? 'Active' : 'Inactive'}</div>
                  <div><strong>Time:</strong> {new Date(point.ts * 1000).toLocaleString()}</div>
                  <div><strong>Lat/Lng:</strong> {point.mapLat.toFixed(6)}, {point.mapLng.toFixed(6)}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Drawing layer */}
        <DrawingLayer drawing={drawing} points={drawPoints} onAddPoint={handleAddPoint} />
      </MapContainer>

      {/* ─── Overlay Panels (absolute positioned within parent container) ─── */}

      {/* Draw Zone button (admin only, idle state) */}
      {isAdmin && !drawing && !showCreateForm && !editingZone && (
        <button
          type="button"
          onClick={handleStartDrawing}
          className="absolute bottom-4 left-4 z-[1000] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-blue-400/40 bg-slate-950/90 backdrop-blur text-sm font-medium text-white hover:bg-blue-500/20 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Draw Zone
        </button>
      )}

      {/* Drawing toolbar */}
      {drawing && (
        <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-2 rounded-xl border border-orange-400/40 bg-slate-950/90 backdrop-blur px-4 py-2.5">
          <MapPin className="w-4 h-4 text-orange-400" />
          <span className="text-sm text-slate-200">
            Click map to add points ({drawPoints.length} placed)
          </span>
          <div className="ml-3 flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleUndoPoint}
              disabled={drawPoints.length === 0}
              className="p-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Undo last point"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleFinishDrawing}
              disabled={drawPoints.length < 3}
              className="px-3 py-1 rounded-lg border border-emerald-400/40 bg-emerald-500/15 text-xs font-medium text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Done
            </button>
            <button
              type="button"
              onClick={handleCancelDrawing}
              className="px-3 py-1 rounded-lg border border-rose-400/40 bg-rose-500/15 text-xs font-medium text-rose-200 hover:bg-rose-500/25 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Zone Detail Panel */}
      <AnimatePresence>
        {selectedZone && !drawing && !showCreateForm && !editingZone && (
          <motion.div
            key="zone-detail"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 z-[1000] w-72 rounded-xl border border-slate-700 bg-slate-950/90 backdrop-blur p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white truncate max-w-[160px]">{selectedZone.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedZone(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Warning Radius</span>
                <span>{selectedZone.warningRadius}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Vertices</span>
                <span>{(selectedZone.polygon?.coordinates?.[0]?.length || 1) - 1}</span>
              </div>
              {selectedZone.createdAt && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Created</span>
                  <span>{new Date(selectedZone.createdAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            {isAdmin && (
              <div className="mt-4 flex items-center gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleStartEdit(selectedZone)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-blue-400/30 bg-blue-500/10 text-xs font-medium text-blue-200 hover:bg-blue-500/20 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(selectedZone.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-rose-400/30 bg-rose-500/10 text-xs font-medium text-rose-200 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Form Panel */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            key="create-form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-4 z-[1000] w-80 rounded-xl border border-slate-700 bg-slate-950/90 backdrop-blur p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Create Alert Zone</h3>
              <button
                type="button"
                onClick={() => { setShowCreateForm(false); setDrawPoints([]); }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Zone Name</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => { setFormName(e.target.value); setFormErrors((p) => ({ ...p, name: undefined })); }}
                  placeholder="e.g. Danger Area A"
                  className={`w-full rounded-lg border bg-slate-900/60 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 transition-colors ${
                    formErrors.name ? 'border-rose-500/50' : 'border-slate-700 focus:border-blue-400/50'
                  }`}
                />
                {formErrors.name && <p className="mt-1 text-xs text-rose-400">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Warning Radius (meters)</label>
                <input
                  type="number"
                  value={formRadius}
                  onChange={(e) => { setFormRadius(e.target.value); setFormErrors((p) => ({ ...p, radius: undefined })); }}
                  min={50}
                  max={5000}
                  className={`w-full rounded-lg border bg-slate-900/60 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-600 transition-colors ${
                    formErrors.radius ? 'border-rose-500/50' : 'border-slate-700 focus:border-blue-400/50'
                  }`}
                />
                {formErrors.radius && <p className="mt-1 text-xs text-rose-400">{formErrors.radius}</p>}
              </div>

              <div className="text-xs text-slate-500">
                Polygon: {drawPoints.length} vertices drawn
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-blue-400/40 bg-blue-500/15 text-sm font-medium text-white hover:bg-blue-500/25 disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Zone
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setDrawPoints([]); }}
                  className="px-4 py-2.5 rounded-lg border border-slate-700 text-sm text-slate-300 hover:bg-slate-800/60 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Form Panel */}
      <AnimatePresence>
        {editingZone && (
          <EditZonePanel
            zone={editingZone}
            editName={editName}
            setEditName={setEditName}
            editRadius={editRadius}
            setEditRadius={setEditRadius}
            onCancel={handleCancelEdit}
            onSuccess={() => setEditingZone(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
