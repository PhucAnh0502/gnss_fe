import { MapContainer, TileLayer, Polyline, Polygon, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { useEffect } from 'react';
import { useAlertZones } from '../../features/useAlertZones';

function MapBoundsSync({ mapData }) {
  const map = useMap();

  useEffect(() => {
    if (!mapData || mapData.polyline.length === 0) return;

    const bounds = mapData.polyline.map(([lat, lng]) => [lat, lng]);
    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    }
  }, [map, mapData]);

  return null;
}

export function HistoryRouteMap({ mapData, mapRef, selectedPointIndex }) {
  const { data: zones = [] } = useAlertZones();

  if (!mapData) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Movement Route</h3>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Start
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              End
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded border border-amber-400 bg-amber-400/20" />
              Alert Zone
            </span>
            {selectedPointIndex !== null && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                Selected
              </span>
            )}
          </div>
        </div>
        <div ref={mapRef} className="rounded-lg overflow-hidden h-[420px] bg-slate-800">
          <MapContainer center={mapData.center} zoom={15} style={{ height: '100%', width: '100%' }}>
            <MapBoundsSync mapData={mapData} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
              crossOrigin="anonymous"
            />

            {/* Alert Zone polygons */}
            {zones.map((zone) => {
              const coords = zone.polygon?.coordinates?.[0];
              if (!coords || coords.length < 3) return null;
              const positions = coords.map(([lng, lat]) => [lat, lng]);
              return (
                <Polygon
                  key={zone.id}
                  positions={positions}
                  pathOptions={{
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.12,
                    weight: 2,
                    dashArray: '6 4',
                  }}
                >
                  <Tooltip direction="center" permanent className="!bg-slate-900/80 !border-slate-600 !rounded-lg !px-2 !py-1 !text-[11px] !font-semibold !text-red-300 !shadow-lg">
                    {zone.name}
                  </Tooltip>
                </Polygon>
              );
            })}

            {/* Route segments - each tracking session is a separate polyline */}
            {(mapData.segments || [mapData.polyline]).map((segment, idx) => (
              segment.length > 1 && (
                <Polyline
                  key={`segment-${idx}`}
                  positions={segment}
                  pathOptions={{
                    color: '#3b82f6',
                    weight: 4,
                    opacity: 0.9,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              )
            ))}

            {/* Start and End markers for each segment */}
            {(mapData.segmentsWithMeta || []).map((seg, idx) => {
              if (!seg.points || seg.points.length < 2) return null;
              const segStart = seg.points[0];
              const segEnd = seg.points[seg.points.length - 1];
              const startTime = seg.startTime ? new Date(seg.startTime).toLocaleString('vi-VN') : '';
              const endTime = seg.endTime ? new Date(seg.endTime).toLocaleString('vi-VN') : '';
              return (
                <span key={`markers-${idx}`}>
                  <CircleMarker
                    center={segStart}
                    radius={8}
                    pathOptions={{
                      fillColor: '#22c55e',
                      color: '#ffffff',
                      weight: 2.5,
                      fillOpacity: 1,
                    }}
                  >
                    <Popup>
                      <div className="text-xs font-medium">
                        <p className="text-emerald-700 font-semibold">Start (Segment {idx + 1})</p>
                        <p className="text-gray-600">{segStart[0].toFixed(6)}, {segStart[1].toFixed(6)}</p>
                        {startTime && <p className="text-gray-500 mt-1">{startTime}</p>}
                      </div>
                    </Popup>
                  </CircleMarker>
                  <CircleMarker
                    center={segEnd}
                    radius={8}
                    pathOptions={{
                      fillColor: '#ef4444',
                      color: '#ffffff',
                      weight: 2.5,
                      fillOpacity: 1,
                    }}
                  >
                    <Popup>
                      <div className="text-xs font-medium">
                        <p className="text-red-700 font-semibold">End (Segment {idx + 1})</p>
                        <p className="text-gray-600">{segEnd[0].toFixed(6)}, {segEnd[1].toFixed(6)}</p>
                        {endTime && <p className="text-gray-500 mt-1">🕐 {endTime}</p>}
                      </div>
                    </Popup>
                  </CircleMarker>
                </span>
              );
            })}

            {/* Selected point marker */}
            {selectedPointIndex !== null && mapData.polyline[selectedPointIndex] && (
              <CircleMarker
                center={mapData.polyline[selectedPointIndex]}
                radius={9}
                pathOptions={{
                  fillColor: '#f59e0b',
                  color: '#ffffff',
                  weight: 3,
                  fillOpacity: 1,
                }}
              >
                <Popup>
                  <div className="text-xs font-medium">
                    <p className="text-amber-700 font-semibold">Point #{selectedPointIndex + 1}</p>
                    <p className="text-gray-600">
                      {mapData.polyline[selectedPointIndex][0].toFixed(6)}, {mapData.polyline[selectedPointIndex][1].toFixed(6)}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
