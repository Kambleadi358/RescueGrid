import React from 'react';
import type { Road, Location as TownLocation } from '../data';
import { locations } from '../data';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

export const typeIcon: Record<string, string> = {
  hq:          '🚨',
  medical:     '🏥',
  shelter:     '🏠',
  warehouse:   '📦',
  police:      '👮',
  school:      '🏫',
  residential: '🏘',
  commercial:  '🏬',
  transit:     '🚉',
  landmark:    '🌳',
};

interface TownMapProps {
  roads: Road[];
  activePath: string[];    // vertex IDs in the selected route
  selectedId?: string;     // selected incident ID
  incidentLocations: { id: string; locationId: string; urgency: string; rank: number }[];
  onNodeClick?: (locationId: string) => void;
  onRoadToggle?: (road: Road) => void;
  highlightEdge?: { from: string; to: string } | null; // For Bellman-Ford animation!
  zoom: number;
  offsetX: number;
  offsetY: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setOffsetX: React.Dispatch<React.SetStateAction<number>>;
  setOffsetY: React.Dispatch<React.SetStateAction<number>>;
  showLegend?: boolean;
  instructionText?: string;
}

export function TownMap({
  roads: scRoads,
  activePath,
  selectedId,
  incidentLocations,
  onNodeClick,
  onRoadToggle,
  highlightEdge,
  zoom,
  offsetX,
  offsetY,
  setZoom,
  setOffsetX,
  setOffsetY,
  showLegend = true,
  instructionText = 'Click a road to block or reopen it.',
}: TownMapProps) {
  // Build set of active edge pairs for fast lookup
  const activeEdges = new Set<string>();
  for (let i = 0; i < activePath.length - 1; i++) {
    activeEdges.add(`${activePath[i]}-${activePath[i + 1]}`);
    activeEdges.add(`${activePath[i + 1]}-${activePath[i]}`);
  }

  const W = 800, H = 540;
  const vb = `${-offsetX / zoom} ${-offsetY / zoom} ${W / zoom} ${H / zoom}`;

  // Curved road path between two points
  const roadPath = (a: TownLocation, b: TownLocation, i: number): string => {
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2;
    const dx = b.y - a.y;
    const dy = a.x - b.x;
    const len = Math.sqrt(dx * dx + dy * dy);
    const bend = (i % 3 - 1) * 8;
    if (len < 1) return `M${a.x} ${a.y} L${b.x} ${b.y}`;
    const cx = mx + (dx / len) * bend;
    const cy = my + (dy / len) * bend;
    return `M${a.x} ${a.y} Q${cx} ${cy} ${b.x} ${b.y}`;
  };

  const handleZoomIn  = () => setZoom(z => Math.min(z * 1.3, 4));
  const handleZoomOut = () => setZoom(z => Math.max(z / 1.3, 0.5));
  const handleFitMap  = () => { setZoom(1); setOffsetX(0); setOffsetY(0); };

  return (
    <div className="map-container">
      <svg
        className="town-map"
        viewBox={vb}
        preserveAspectRatio="xMidYMid meet"
        aria-label="RescueGrid interactive town map"
      >
        <defs>
          <pattern id="town-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" className="map-grid-line" />
          </pattern>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background grid */}
        <rect width={W} height={H} fill="url(#town-grid)" opacity="0.45" />

        {/* Town block backgrounds */}
        <rect x="160" y="80" width="180" height="120" rx="8" className="town-block" />
        <rect x="355" y="130" width="260" height="120" rx="8" className="town-block" />
        <rect x="380" y="280" width="260" height="140" rx="8" className="town-block" />
        <rect x="70" y="380" width="220" height="100" rx="8" className="town-block" />
        <rect x="540" y="390" width="200" height="120" rx="8" className="town-block" />

        {/* River visual */}
        <path
          d="M 120 0 Q 180 140 220 220 T 310 320 T 360 600"
          fill="none"
          stroke="rgba(14, 165, 233, 0.18)"
          strokeWidth="32"
          strokeLinecap="round"
        />

        {/* Roads */}
        {scRoads.map((r, i) => {
          const a = locations.find(x => x.id === r.a);
          const b = locations.find(x => x.id === r.b);
          if (!a || !b) return null;

          const isActive = activeEdges.has(`${r.a}-${r.b}`);
          const isHighlighted = highlightEdge && (
            (highlightEdge.from === r.a && highlightEdge.to === r.b) ||
            (highlightEdge.from === r.b && highlightEdge.to === r.a)
          );

          let cls = 'road-edge';
          if (r.blocked) {
            cls = 'road-edge blocked';
          } else if (isHighlighted) {
            cls = 'road-edge highlighted';
          } else if (isActive) {
            cls = 'road-edge active';
          }

          const d = roadPath(a, b, i);
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;

          return (
            <g key={`road-${r.id || i}`} className="road-group">
              {/* Wide transparent hit area for easy clicking */}
              <path
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth="18"
                style={{ cursor: onRoadToggle ? 'pointer' : 'default' }}
                onClick={(e) => {
                  e.stopPropagation();
                  onRoadToggle?.(r);
                }}
              >
                <title>{`${r.name} (${r.a} ↔ ${r.b}) | Cost: ${r.cost} | ${r.blocked ? 'BLOCKED - click to open' : 'OPEN - click to block'}`}</title>
              </path>

              {/* Visible road line */}
              <path
                d={d}
                className={cls}
                filter={isActive || isHighlighted ? 'url(#glow)' : undefined}
              />

              {/* Blocked marker */}
              {r.blocked && (
                <g transform={`translate(${mx}, ${my})`}>
                  <circle r="10" fill="var(--danger)" opacity="0.9" />
                  <text className="block-marker" textAnchor="middle" dy="4" fill="#ffffff" fontWeight="bold">✕</text>
                </g>
              )}

              {/* Road cost / label */}
              {!r.blocked && !isActive && (
                <text className="road-label" x={mx} y={my - 4} textAnchor="middle">
                  {r.name} ({r.cost})
                </text>
              )}
            </g>
          );
        })}

        {/* Location nodes */}
        {locations.map(loc => {
          const inc = incidentLocations.find(x => x.locationId === loc.id);
          const isSelected = inc && inc.id === selectedId;

          return (
            <g
              key={loc.id}
              className={`map-node${isSelected ? ' selected' : ''}`}
              transform={`translate(${loc.x}, ${loc.y})`}
              onClick={() => onNodeClick?.(loc.id)}
              role="button"
              aria-label={loc.name}
            >
              {/* Urgency pulse ring */}
              {loc.urgency !== 'Low' && (
                <circle
                  r="16"
                  className={`urgency-ring ${loc.urgency}`}
                  style={{
                    stroke: loc.urgency === 'Critical' ? 'var(--critical-color)' :
                      loc.urgency === 'High' ? 'var(--high-color)' : 'var(--medium-color)'
                  }}
                />
              )}

              {/* Main circle */}
              <circle r="12" className={`node-bg ${loc.type}`} />

              {/* Icon */}
              <text className="node-icon" textAnchor="middle" dy="4">{typeIcon[loc.type]}</text>

              {/* Name label */}
              <text className="node-label" textAnchor="middle" y="24">{loc.shortName}</text>
            </g>
          );
        })}

        {/* Incident pins */}
        {incidentLocations.map(({ id, locationId, urgency, rank }) => {
          const loc = locations.find(x => x.id === locationId);
          if (!loc) return null;
          const isSelected = id === selectedId;

          return (
            <g
              key={`pin-${id}`}
              className={`incident-pin${isSelected ? ' selected' : ''}`}
              transform={`translate(${loc.x + 15}, ${loc.y - 22})`}
              onClick={() => onNodeClick?.(locationId)}
              role="button"
              aria-label={`Incident ${rank} at ${loc.name}`}
            >
              {/* Pin body */}
              <path
                d="M0 -14 C-9 -14 -9 0 0 7 C9 0 9 -14 0 -14 Z"
                className={`pin-body ${urgency}`}
              />
              {/* Rank number */}
              <text className="pin-number" textAnchor="middle" y="-4">{rank}</text>

              {/* Pulse ring for selected */}
              {isSelected && (
                <circle r="12" fill="none" stroke="var(--accent)" strokeWidth="2.5" opacity="0.8"
                  style={{ animation: 'urgencyPulse 1.2s infinite' }} />
              )}
            </g>
          );
        })}
      </svg>

      {/* Map controls */}
      <div className="map-controls">
        <button className="map-control-btn" onClick={handleZoomIn} title="Zoom In"><ZoomIn size={14} /></button>
        <button className="map-control-btn" onClick={handleZoomOut} title="Zoom Out"><ZoomOut size={14} /></button>
        <button className="map-control-btn" onClick={handleFitMap} title="Fit Map"><Maximize2 size={14} /></button>
      </div>

      {/* Instruction Badge */}
      <div className="map-instruction-badge">
        <span>📍 {instructionText}</span>
      </div>

      {/* Map legend */}
      {showLegend && (
        <div className="map-legend">
          <div className="legend-title">Legend</div>
          <div className="legend-item">
            <div className="legend-line" style={{ background: 'var(--road-color)' }} />
            <span>Open Road (click to block)</span>
          </div>
          <div className="legend-item">
            <div className="legend-line" style={{ background: 'var(--danger)', borderTop: '2px dashed var(--danger)' }} />
            <span>Blocked Road (click to open)</span>
          </div>
          <div className="legend-item">
            <div className="legend-line" style={{ background: 'var(--accent)', boxShadow: '0 0 6px var(--accent)' }} />
            <span>Active Shortest Route</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--critical-color)' }} />
            <span>Critical Incident</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--high-color)' }} />
            <span>High Priority</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: 'var(--medium-color)' }} />
            <span>Medium Priority</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: '#0ea5e9' }} />
            <span>Operations HQ</span>
          </div>
        </div>
      )}
    </div>
  );
}
