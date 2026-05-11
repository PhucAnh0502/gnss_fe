import { useEffect, useMemo, useRef } from 'react';
import createGlobe from 'cobe';

function hashToCoordinates(svid, index) {
  const base = svid * 12.9898 + index * 78.233;
  const fracA = Math.abs(Math.sin(base)) % 1;
  const fracB = Math.abs(Math.sin(base * 1.732 + 9.43)) % 1;

  return {
    lat: fracA * 180 - 90,
    lng: fracB * 360 - 180,
  };
}

export function GlobeTrackingTab({ satelliteIds, highlightedIds }) {
  const canvasRef = useRef(null);
  const globeRef = useRef(null);
  const animationFrameRef = useRef(0);
  const markersRef = useRef([]);
  const interactionRef = useRef({
    width: 0,
    phi: 0,
    theta: 0.25,
    scale: 0.8,
    isPointerDown: false,
    lastPointerX: 0,
    lastPointerY: 0,
  });

  const markers = useMemo(() => {
    return satelliteIds.map((svid, index) => {
      const { lat, lng } = hashToCoordinates(svid, index);
      const highlighted = highlightedIds.has(svid);
      const id = `sat-${svid}`;

      return {
        id,
        location: [lat, lng],
        size: highlighted ? 0.052 : 0.048,
        color: highlighted ? [1, 0.89, 0.3] : [0.31, 0.72, 1],
        highlighted,
      };
    });
  }, [highlightedIds, satelliteIds]);

  useEffect(() => {
    markersRef.current = markers;
  }, [markers]);

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
      interaction.lastPointerX = event.clientX;
      interaction.lastPointerY = event.clientY;
      canvas.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event) => {
      if (!interaction.isPointerDown) {
        return;
      }

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
      if (!interaction.isPointerDown) {
        interaction.phi += 0.0026;
      }

      globeRef.current?.update({
        width: interaction.width * 2,
        height: interaction.width * 2,
        phi: interaction.phi,
        theta: interaction.theta,
        scale: interaction.scale,
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
    </div>
  );
}
