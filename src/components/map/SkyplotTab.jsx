import { useMemo, useState } from 'react';

const CONSTELLATION_COLORS = {
  1: '#3b82f6',   // GPS - blue
  3: '#ef4444',   // GLONASS - red
  5: '#10b981',   // Galileo - green
  6: '#eab308',   // BeiDou - yellow
};
const DEFAULT_COLOR = '#6b7280';

const CONSTELLATION_NAMES = {
  1: 'GPS',
  3: 'GLONASS',
  5: 'Galileo',
  6: 'BeiDou',
};

function getColor(constellationType) {
  return CONSTELLATION_COLORS[constellationType] || DEFAULT_COLOR;
}

function getDotRadius(cn0) {
  if (cn0 >= 30) return 10;
  if (cn0 >= 20) return 8;
  if (cn0 >= 10) return 6;
  return 4;
}

function toXY(azimuth, elevation) {
  const r = 170 * (90 - elevation) / 90;
  const azRad = azimuth * Math.PI / 180;
  const x = 200 + r * Math.sin(azRad);
  const y = 200 - r * Math.cos(azRad);
  return { x, y, r };
}

export function SkyplotTab({ satelliteStatuses = [], selectedDeviceCode = null }) {
  const [hoveredSat, setHoveredSat] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const satellites = useMemo(() => {
    if (!satelliteStatuses || satelliteStatuses.length === 0) return [];
    return satelliteStatuses
      .filter((s) => Number.isFinite(s.elevation) && Number.isFinite(s.azimuth))
      .map((sat) => {
        const { x, y } = toXY(sat.azimuth, sat.elevation);
        const color = getColor(sat.constellationType);
        const radius = getDotRadius(sat.cn0 || 0);
        return { ...sat, x, y, color, radius };
      });
  }, [satelliteStatuses]);

  const stats = useMemo(() => {
    const used = satellites.filter((s) => s.usedInFix).length;
    const total = satellites.length;
    return { used, total };
  }, [satellites]);

  // Group satellites by constellation for the CN0 bar chart
  const groupedSats = useMemo(() => {
    const groups = {};
    for (const sat of satellites) {
      const key = sat.constellationType || 0;
      if (!groups[key]) groups[key] = [];
      groups[key].push(sat);
    }
    // Sort within each group by svid
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => a.svid - b.svid);
    }
    return groups;
  }, [satellites]);

  const allBars = useMemo(() => {
    const bars = [];
    const order = [1, 3, 5, 6];
    for (const ct of order) {
      if (groupedSats[ct]) {
        bars.push(...groupedSats[ct]);
      }
    }
    // Add any remaining constellations not in the standard order
    for (const key of Object.keys(groupedSats)) {
      if (!order.includes(Number(key))) {
        bars.push(...groupedSats[key]);
      }
    }
    return bars;
  }, [groupedSats]);

  const handleMouseEnter = (sat, event) => {
    const rect = event.currentTarget.closest('.skyplot-container')?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({ x: event.clientX - rect.left + 12, y: event.clientY - rect.top - 10 });
    }
    setHoveredSat(sat);
  };

  const handleMouseLeave = () => {
    setHoveredSat(null);
  };

  const isEmpty = !selectedDeviceCode || satellites.length === 0;

  return (
    <div className="skyplot-container relative h-full w-full bg-slate-950 flex flex-col overflow-hidden">
      {/* Main content area */}
      <div className="flex flex-1 min-h-0 p-3 gap-3">
        {/* Left: Polar Skyplot */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full max-w-[500px] max-h-[500px]"
            style={{ aspectRatio: '1' }}
          >
            {/* Background */}
            <circle cx="200" cy="200" r="195" fill="#0f172a" />

            {/* Grid circles: elevation 0° (outermost), 30°, 60° */}
            <circle cx="200" cy="200" r="170" fill="none" stroke="#334155" strokeWidth="1" />
            <circle cx="200" cy="200" r="113.3" fill="none" stroke="#334155" strokeWidth="0.7" strokeDasharray="4 3" />
            <circle cx="200" cy="200" r="56.7" fill="none" stroke="#334155" strokeWidth="0.7" strokeDasharray="4 3" />

            {/* Cutoff elevation line at 10° (dashed) */}
            <circle cx="200" cy="200" r="151.1" fill="none" stroke="#475569" strokeWidth="0.8" strokeDasharray="6 4" opacity="0.6" />

            {/* Radial lines (every 45°) */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
              const rad = angle * Math.PI / 180;
              const x2 = 200 + 170 * Math.sin(rad);
              const y2 = 200 - 170 * Math.cos(rad);
              return (
                <line key={angle} x1="200" y1="200" x2={x2} y2={y2} stroke="#334155" strokeWidth="0.5" />
              );
            })}

            {/* Cardinal labels */}
            <text x="200" y="18" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="600">N</text>
            <text x="200" y="392" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="600">S</text>
            <text x="382" y="205" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="600">E</text>
            <text x="18" y="205" textAnchor="middle" fill="#94a3b8" fontSize="13" fontWeight="600">W</text>

            {/* Elevation labels */}
            <text x="208" y="92" fill="#64748b" fontSize="9">30°</text>
            <text x="208" y="148" fill="#64748b" fontSize="9">60°</text>

            {/* Glow filter for satellites used in fix */}
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Satellite dots */}
            {satellites.map((sat) => (
              <g
                key={`${sat.constellationType}-${sat.svid}`}
                onMouseEnter={(e) => handleMouseEnter(sat, e)}
                onMouseLeave={handleMouseLeave}
                style={{ cursor: 'pointer', transition: 'transform 0.3s ease' }}
              >
                {/* Glow ring for usedInFix satellites */}
                {sat.usedInFix && (
                  <circle
                    cx={sat.x}
                    cy={sat.y}
                    r={sat.radius + 4}
                    fill="none"
                    stroke={sat.color}
                    strokeWidth="1.5"
                    opacity="0.4"
                    filter="url(#glow)"
                    style={{ transition: 'cx 0.5s ease, cy 0.5s ease' }}
                  />
                )}
                <circle
                  cx={sat.x}
                  cy={sat.y}
                  r={sat.radius}
                  fill={sat.usedInFix ? sat.color : 'none'}
                  stroke={sat.color}
                  strokeWidth={sat.usedInFix ? 0 : 2}
                  opacity={sat.usedInFix ? 1 : 0.5}
                  filter={sat.usedInFix ? 'url(#glow)' : undefined}
                  style={{ transition: 'cx 0.5s ease, cy 0.5s ease' }}
                />
                <text
                  x={sat.x + 12}
                  y={sat.y + 4}
                  fill="#cbd5e1"
                  fontSize="8"
                  opacity="0.8"
                >
                  {sat.svid}
                </text>
              </g>
            ))}

            {/* Empty state text */}
            {isEmpty && (
              <>
                <text x="200" y="190" textAnchor="middle" fill="#64748b" fontSize="13">
                  {!selectedDeviceCode
                    ? 'Select a device to view satellite positions'
                    : 'No satellite data available'}
                </text>
                {selectedDeviceCode && (
                  <text x="200" y="215" textAnchor="middle" fill="#475569" fontSize="11">
                    Device may be indoors or tracking is inactive
                  </text>
                )}
              </>
            )}
          </svg>
        </div>

        {/* Right: CN0 Bar Chart */}
        {!isEmpty && (
          <div className="w-48 flex flex-col min-h-0 border-l border-slate-800 pl-3">
            <p className="text-xs font-semibold text-slate-300 mb-2 shrink-0">CN0 (dB-Hz)</p>
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
              <div className="flex items-end gap-[3px] h-full min-h-[160px] pb-5 relative">
                {/* Y-axis ticks */}
                <div className="absolute left-0 top-0 h-[calc(100%-20px)] w-6 flex flex-col justify-between text-[8px] text-slate-500 pointer-events-none">
                  <span>50</span>
                  <span>40</span>
                  <span>30</span>
                  <span>20</span>
                  <span>10</span>
                  <span>0</span>
                </div>

                {/* Bars */}
                <div className="flex items-end gap-[2px] ml-7 flex-1 h-[calc(100%-20px)]">
                  {allBars.map((sat) => {
                    const cn0 = sat.cn0 || 0;
                    const heightPct = Math.min((cn0 / 50) * 100, 100);
                    const color = getColor(sat.constellationType);
                    return (
                      <div
                        key={`bar-${sat.constellationType}-${sat.svid}`}
                        className="flex flex-col items-center justify-end h-full min-w-[10px] flex-1 max-w-[18px]"
                      >
                        <div
                          className="w-full rounded-t-sm transition-all duration-300"
                          style={{
                            height: `${heightPct}%`,
                            backgroundColor: color,
                            opacity: sat.usedInFix ? 1 : 0.4,
                            minHeight: cn0 > 0 ? '2px' : '0px',
                          }}
                        />
                        <span className="text-[7px] text-slate-400 mt-1 leading-none whitespace-nowrap">
                          {sat.svid}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend bar at bottom */}
      <div className="shrink-0 flex items-center gap-4 px-4 py-2 border-t border-slate-800 bg-slate-950/80 flex-wrap">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#3b82f6' }} />
            <span className="text-slate-300">GPS</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#ef4444' }} />
            <span className="text-slate-300">GLO</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#10b981' }} />
            <span className="text-slate-300">GAL</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#eab308' }} />
            <span className="text-slate-300">BDS</span>
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] border-l border-slate-700 pl-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
            <span className="text-slate-400">Used in Fix</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-slate-400 bg-transparent" />
            <span className="text-slate-400">Visible only</span>
          </span>
        </div>

        <div className="ml-auto text-[11px] text-slate-400">
          {stats.used}/{stats.total} satellites ({stats.used} used, {stats.total} visible)
        </div>
      </div>

      {/* Tooltip */}
      {hoveredSat && (
        <div
          className="absolute z-50 pointer-events-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs shadow-xl"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <div className="space-y-1">
            <p className="font-semibold text-slate-100">
              SVID {hoveredSat.svid}
              <span className="ml-2 font-normal text-slate-400">
                {CONSTELLATION_NAMES[hoveredSat.constellationType] || 'Unknown'}
              </span>
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-slate-300">
              <span>Elevation:</span><span>{hoveredSat.elevation?.toFixed(1)}°</span>
              <span>Azimuth:</span><span>{hoveredSat.azimuth?.toFixed(1)}°</span>
              <span>CN0:</span><span>{hoveredSat.cn0?.toFixed(1)} dB-Hz</span>
              <span>Used in Fix:</span><span>{hoveredSat.usedInFix ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
