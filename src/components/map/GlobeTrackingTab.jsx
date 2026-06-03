import { useEffect, useMemo, useRef } from 'react';
import createGlobe from 'cobe';

// Convert lat/lng to pseudo-random coordinates for satellites (since we don't have real orbital data)
function hashToCoordinates(svid, index) {
  const base = svid * 12.9898 + index * 78.233;
  const fracA = Math.abs(Math.sin(base)) % 1;
  const fracB = Math.abs(Math.sin(base * 1.732 + 9.43)) % 1;

  return {
    lat: fracA * 180 - 90,
    lng: fracB * 360 - 180,
  };
}

// Constellation type → color mapping
const CONSTELLATION_COLORS = {
  1: [0.3, 0.7, 1.0],    // GPS - blue
  3: [1.0, 0.4, 0.4],    // GLONASS - red
  5: [0.4, 1.0, 0.6],    // Galileo - green
  6: [1.0, 0.85, 0.2],   // BeiDou - yellow
};
const DEFAULT_SAT_COLOR = [0.6, 0.6, 0.6]; // unknown constellation - gray

// Dim a color by multiplying each channel
function dimColor(color, factor) {
  return color.map((c) => c * factor);
}

// Convert lat/lng degrees to COBE phi/theta
function latLngToPhi(lat, lng) {
  return {
    phi: -lng * (Math.PI / 180),
    theta: lat * (Math.PI / 180),
  };
}

// Linear interpolation
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Shortest angular lerp (handles wrapping)
function lerpAngle(a, b, t) {
  let diff = b - a;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return a + diff * t;
}

export function GlobeTrackingTab({
  satelliteIds,
  highlightedIds,
  devicePoints = [],
  selectedDeviceCode = null,
  focusPosition = null,
  satelliteStatuses = [],
}) {
  const canvasRef = useRef(null);
  const globeRef = useRef(null);
  const animationFrameRef = useRef(0);
  const markersRef = useRef([]);
  const interactionRef = useRef({
    width: 0,
    phi: 0,
    theta: 0.25,
    scale: 0.85,
    isPointerDown: false,
    lastPointerX: 0,
    lastPointerY: 0,
    targetPhi: null,
    targetTheta: null,
    focusActive: false,
  });

  // Build combined markers: devices + satellites
  const markers = useMemo(() => {
    const result = [];

    // --- Device markers (always visible) ---
    devicePoints.forEach((device) => {
      if (!device.point) return;
      const { mapLat, mapLng } = device.point;
      if (!Number.isFinite(mapLat) || !Number.isFinite(mapLng)) return;

      const isSelected = device.deviceCode === selectedDeviceCode;
      const isActive = device.status === 'active';

      let color;
      let size;

      if (isSelected) {
        color = [1, 0.55, 0.1]; // bright orange
        size = 0.1;
      } else if (isActive) {
        color = [0.2, 0.9, 0.4]; // green
        size = 0.065;
      } else {
        color = [0.4, 0.4, 0.5]; // gray
        size = 0.05;
      }

      result.push({
        location: [mapLat, mapLng],
        size,
        color,
      });
    });

    // --- Satellite markers (only when a device is selected) ---
    if (selectedDeviceCode && satelliteStatuses.length > 0) {
      satelliteStatuses.forEach((sat, index) => {
        const { lat, lng } = hashToCoordinates(sat.svid, index);
        const constellationType = sat.constellationType || sat.constellation_type || 0;
        const isUsed = sat.usedInFix || sat.used_in_fix || false;

        const baseColor = CONSTELLATION_COLORS[constellationType] || DEFAULT_SAT_COLOR;
        const color = isUsed ? baseColor : dimColor(baseColor, 0.4);
        const size = isUsed ? 0.055 : 0.028;

        result.push({
          location: [lat, lng],
          size,
          color,
        });
      });
    } else if (!selectedDeviceCode) {
      // No device selected → show all satellite dots like before
      satelliteIds.forEach((svid, index) => {
        const { lat, lng } = hashToCoordinates(svid, index);
        const highlighted = highlightedIds.has(svid);

        result.push({
          location: [lat, lng],
          size: highlighted ? 0.048 : 0.035,
          color: highlighted ? [1, 0.89, 0.3] : [0.25, 0.6, 0.9],
        });
      });
    }

    return result;
  }, [devicePoints, selectedDeviceCode, satelliteStatuses, satelliteIds, highlightedIds]);

  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

  // Handle focus position changes
  useEffect(() => {
    const interaction = interactionRef.current;
    if (focusPosition && Number.isFinite(focusPosition.lat) && Number.isFinite(focusPosition.lng)) {
      const { phi, theta } = latLngToPhi(focusPosition.lat, focusPosition.lng);
      interaction.targetPhi = phi;
      interaction.targetTheta = theta;
      interaction.focusActive = true;
    } else {
      interaction.focusActive = false;
      interaction.targetPhi = null;
      interaction.targetTheta = null;
    }
  }, [focusPosition]);

  useEffect(() => {
    if (!canvasRef.current) {
      return undefined;
    }

    const canvas = canvasRef.current;
    const interaction = interactionRef.current;

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const onResize = () => {
      interaction.width = canvas.parentElement?.offsetWidth || 0;
    };

    onResize();

    globeRef.current = createGlobe(canvas, {
      devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
      width: interaction.width * 2,
      height: interaction.width * 2,
      phi: 0,
      theta: 0.25,
      dark: 1,
      diffuse: 1.15,
      mapSamples: 12000,
      mapBrightness: 2.2,
      baseColor: [0.06, 0.2, 0.32],
      markerColor: [0.31, 0.72, 1],
      glowColor: [0.08, 0.24, 0.48],
      markers: markersRef.current,
    });

    const onPointerDown = (event) => {
      interaction.isPointerDown = true;
      interaction.focusActive = false; // cancel focus when user drags
      interaction.lastPointerX = event.clientX;
      interaction.lastPointerY = event.clientY;
      canvas.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event) => {
      if (!interaction.isPointerDown) return;

      const dx = event.clientX - interaction.lastPointerX;
      const dy = event.clientY - interaction.lastPointerY;

      interaction.phi += dx * 0.0085;
      interaction.theta = clamp(interaction.theta + dy * 0.0045, -0.7, 0.7);
      interaction.lastPointerX = event.clientX;
      interaction.lastPointerY = event.clientY;
    };

    const onPointerUp = (event) => {
      interaction.isPointerDown = false;
      canvas.releasePointerCapture?.(event.pointerId);
    };

    const onWheel = (event) => {
      event.preventDefault();
      interaction.scale = clamp(interaction.scale + event.deltaY * -0.0006, 0.78, 1.35);
    };

    const animate = () => {
      if (interaction.focusActive && interaction.targetPhi !== null && interaction.targetTheta !== null) {
        // Smooth lerp towards target
        interaction.phi = lerpAngle(interaction.phi, interaction.targetPhi, 0.04);
        interaction.theta = lerp(interaction.theta, interaction.targetTheta, 0.04);

        // Stop focusing when close enough
        const phiDiff = Math.abs(interaction.phi - interaction.targetPhi);
        const thetaDiff = Math.abs(interaction.theta - interaction.targetTheta);
        if (phiDiff < 0.005 && thetaDiff < 0.005) {
          interaction.focusActive = false;
        }
      } else if (!interaction.isPointerDown) {
        // Slow auto-rotate
        interaction.phi += 0.0018;
      }

      globeRef.current?.update({
        width: interaction.width * 2,
        height: interaction.width * 2,
        phi: interaction.phi,
        theta: interaction.theta,
        scale: interaction.scale,
        markers: markersRef.current,
      });

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    animationFrameRef.current = window.requestAnimationFrame(animate);

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('resize', onResize);

    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerUp);
      canvas.removeEventListener('wheel', onWheel);
      globeRef.current?.destroy();
      globeRef.current = null;
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Update markers when they change (real-time updates)
  useEffect(() => {
    globeRef.current?.update({ markers });
  }, [markers]);

  return (
    <div className="h-full w-full bg-[radial-gradient(circle_at_30%_15%,rgba(14,165,233,0.25),transparent_45%),radial-gradient(circle_at_75%_82%,rgba(2,132,199,0.28),transparent_40%),#020617] flex items-center justify-center p-5">
      <div className="w-full max-w-200 aspect-square">
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          style={{ contain: 'layout paint size', opacity: 1, cursor: 'grab' }}
        />
      </div>

      {/* Legend */}
      {selectedDeviceCode && satelliteStatuses.length > 0 && (
        <div className="absolute bottom-4 left-4 rounded-xl border border-slate-700/60 bg-slate-950/85 backdrop-blur-sm px-4 py-3 text-[11px] space-y-1.5">
          <p className="text-xs font-semibold text-slate-200 mb-2">Constellation</p>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[rgb(77,179,255)]" />
            <span className="text-slate-300">GPS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[rgb(255,102,102)]" />
            <span className="text-slate-300">GLONASS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[rgb(102,255,153)]" />
            <span className="text-slate-300">Galileo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[rgb(255,217,51)]" />
            <span className="text-slate-300">BeiDou</span>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border-2 border-white/60 bg-transparent" />
              <span className="text-slate-400">In Use (bright, large)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-500/60" />
              <span className="text-slate-400">Visible (dim, small)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
