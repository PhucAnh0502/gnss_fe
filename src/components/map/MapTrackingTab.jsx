import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MapViewportSync({ center, devicePoints, selectedTrack, selectedDeviceCode }) {
  const map = useMap();

  useEffect(() => {
    // Pan/zoom to selected device if it has a valid position
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

export function MapTrackingTab({ center, devicePoints, selectedTrack, selectedDeviceCode }) {
  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
      <MapViewportSync center={center} devicePoints={devicePoints} selectedTrack={selectedTrack} selectedDeviceCode={selectedDeviceCode} />
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {!!selectedTrack.length && (
        <Polyline
          positions={selectedTrack.map((point) => [point.mapLat, point.mapLng])}
          pathOptions={{ color: '#f97316', weight: 5, opacity: 0.95 }}
        />
      )}

      {devicePoints.map((device) => {
        const point = device.point;

        if (!point) {
          return null;
        }

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
    </MapContainer>
  );
}
