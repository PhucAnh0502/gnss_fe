import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from 'react-leaflet';

export function HistoryRouteMap({ mapData, mapRef }) {
  if (!mapData) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/40 backdrop-blur-sm overflow-hidden">
      <div className="p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Movement Route</h3>
        <div ref={mapRef} className="rounded-lg overflow-hidden h-96 bg-white">
          <MapContainer center={mapData.center} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
              crossOrigin="anonymous"
            />
            {mapData.polyline.length > 1 && (
              <Polyline positions={mapData.polyline} color="rgb(59, 130, 246)" weight={3} opacity={0.8} />
            )}
            {mapData.polyline.map((coord, index) => (
              <CircleMarker
                key={`${coord[0]}-${coord[1]}-${index}`}
                center={coord}
                radius={index === 0 || index === mapData.polyline.length - 1 ? 6 : 3}
                fillColor={index === 0 ? '#22c55e' : index === mapData.polyline.length - 1 ? '#ef4444' : '#3b82f6'}
                color={index === 0 ? '#16a34a' : index === mapData.polyline.length - 1 ? '#dc2626' : '#1e40af'}
                weight={2}
                opacity={0.8}
                fillOpacity={0.7}
              >
                <Popup>
                  <div className="text-xs">
                    <p>{index === 0 ? 'Start' : index === mapData.polyline.length - 1 ? 'End' : `Point ${index}`}</p>
                    <p>{coord[0].toFixed(4)}, {coord[1].toFixed(4)}</p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}