import React, { useState, useEffect } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, RotateCcw, AlertTriangle,
  ArrowRight, Shield, Activity, Package as PackageIcon, Check, GitCommit
} from 'lucide-react';
import type { Request, Road, Package, Team } from '../data';
import { locations } from '../data';
import {
  mergeSortWithTrace,
  bellmanFord,
  knapsack,
  assignTeams,
  type BFStep,
  type MergeSortTraceStep,
  type KnapsackCellStep,
  type StateTreeNode
} from '../algorithms';

interface AlgorithmVisualizerProps {
  incidents: Request[];
  roads: Road[];
  packages: Package[];
  teams: Team[];
  capacity: number;
  selectedIncident?: Request;
  onHighlightEdge?: (edge: { from: string; to: string } | null) => void;
}

export function AlgorithmVisualizer({
  incidents,
  roads,
  packages,
  teams,
  capacity,
  selectedIncident,
  onHighlightEdge,
}: AlgorithmVisualizerProps) {
  const [activeTab, setActiveTab] = useState<'merge' | 'bellman' | 'knapsack' | 'backtrack'>('merge');

  // Animation playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(800); // ms per step

  // Step indices for each algorithm
  const [mergeStepIdx, setMergeStepIdx] = useState(0);
  const [bfStepIdx, setBfStepIdx] = useState(0);
  const [knapStepIdx, setKnapStepIdx] = useState(0);
  const [btStepIdx, setBtStepIdx] = useState(0);

  // 1. Merge Sort computation
  const mergeTrace = React.useMemo(() => mergeSortWithTrace(incidents), [incidents]);

  // 2. Bellman-Ford computation for selected incident
  const targetLocation = selectedIncident?.location ?? (incidents[0]?.location || 'SHL');
  const bfTrace = React.useMemo(() => {
    return bellmanFord(roads, locations.map(l => l.id), 'HQ', targetLocation);
  }, [roads, targetLocation]);

  // 3. Knapsack computation
  const knapTrace = React.useMemo(() => knapsack(packages, capacity), [packages, capacity]);

  // 4. Backtracking computation
  const btTrace = React.useMemo(() => {
    const bTeams = teams.map(t => ({
      name: t.name,
      skills: [t.capability],
      available: t.available,
    }));
    const bTasks = incidents.map(i => ({
      id: i.id,
      need: i.needCapability ?? (i.medical ? 'medical' : 'general'),
      name: i.name,
    }));
    return assignTeams(bTeams, bTasks);
  }, [teams, incidents]);

  // Highlight road on map when Bellman-Ford steps change
  useEffect(() => {
    if (activeTab === 'bellman' && bfTrace.steps[bfStepIdx]) {
      const step = bfTrace.steps[bfStepIdx];
      onHighlightEdge?.({ from: step.from, to: step.to });
    } else {
      onHighlightEdge?.(null);
    }
  }, [activeTab, bfStepIdx, bfTrace, onHighlightEdge]);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      if (activeTab === 'merge') {
        setMergeStepIdx(prev => {
          if (prev >= mergeTrace.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      } else if (activeTab === 'bellman') {
        setBfStepIdx(prev => {
          if (prev >= bfTrace.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      } else if (activeTab === 'knapsack') {
        setKnapStepIdx(prev => {
          if (prev >= knapTrace.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      } else if (activeTab === 'backtrack') {
        setBtStepIdx(prev => {
          if (prev >= btTrace.steps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }
    }, speed);

    return () => clearInterval(timer);
  }, [isPlaying, speed, activeTab, mergeTrace, bfTrace, knapTrace, btTrace]);

  // Playback control handlers
  const handlePlayPause = () => setIsPlaying(p => !p);

  const handleNext = () => {
    setIsPlaying(false);
    if (activeTab === 'merge') setMergeStepIdx(p => Math.min(p + 1, mergeTrace.steps.length - 1));
    else if (activeTab === 'bellman') setBfStepIdx(p => Math.min(p + 1, bfTrace.steps.length - 1));
    else if (activeTab === 'knapsack') setKnapStepIdx(p => Math.min(p + 1, knapTrace.steps.length - 1));
    else if (activeTab === 'backtrack') setBtStepIdx(p => Math.min(p + 1, btTrace.steps.length - 1));
  };

  const handlePrev = () => {
    setIsPlaying(false);
    if (activeTab === 'merge') setMergeStepIdx(p => Math.max(p - 1, 0));
    else if (activeTab === 'bellman') setBfStepIdx(p => Math.max(p - 1, 0));
    else if (activeTab === 'knapsack') setKnapStepIdx(p => Math.max(p - 1, 0));
    else if (activeTab === 'backtrack') setBtStepIdx(p => Math.max(p - 1, 0));
  };

  const handleReset = () => {
    setIsPlaying(false);
    if (activeTab === 'merge') setMergeStepIdx(0);
    else if (activeTab === 'bellman') setBfStepIdx(0);
    else if (activeTab === 'knapsack') setKnapStepIdx(0);
    else if (activeTab === 'backtrack') setBtStepIdx(0);
  };

  // Current step calculation
  const curMergeStep: MergeSortTraceStep | undefined = mergeTrace.steps[mergeStepIdx];
  const curBfStep: BFStep | undefined = bfTrace.steps[bfStepIdx];
  const curKnapStep: KnapsackCellStep | undefined = knapTrace.steps[knapStepIdx];
  const curBtStep = btTrace.steps[btStepIdx];

  const totalSteps =
    activeTab === 'merge' ? mergeTrace.steps.length :
    activeTab === 'bellman' ? bfTrace.steps.length :
    activeTab === 'knapsack' ? knapTrace.steps.length :
    btTrace.steps.length;

  const currentStepNum =
    activeTab === 'merge' ? mergeStepIdx + 1 :
    activeTab === 'bellman' ? bfStepIdx + 1 :
    activeTab === 'knapsack' ? knapStepIdx + 1 :
    btStepIdx + 1;

  return (
    <div className="algo-visualizer-container">
      {/* Header with Navigation and Playback Toolbar */}
      <div className="algo-vis-header">
        <div className="algo-tabs">
          <button
            className={`algo-tab${activeTab === 'merge' ? ' active' : ''}`}
            onClick={() => { setActiveTab('merge'); setIsPlaying(false); }}
          >
            <AlertTriangle size={15} /> 1. Merge Sort <span className="complexity-badge">O(R log R)</span>
          </button>
          <button
            className={`algo-tab${activeTab === 'bellman' ? ' active' : ''}`}
            onClick={() => { setActiveTab('bellman'); setIsPlaying(false); }}
          >
            <Activity size={15} /> 2. Bellman-Ford <span className="complexity-badge">O(VE)</span>
          </button>
          <button
            className={`algo-tab${activeTab === 'knapsack' ? ' active' : ''}`}
            onClick={() => { setActiveTab('knapsack'); setIsPlaying(false); }}
          >
            <PackageIcon size={15} /> 3. 0/1 Knapsack <span className="complexity-badge">O(NW)</span>
          </button>
          <button
            className={`algo-tab${activeTab === 'backtrack' ? ' active' : ''}`}
            onClick={() => { setActiveTab('backtrack'); setIsPlaying(false); }}
          >
            <GitCommit size={15} /> 4. Backtracking <span className="complexity-badge">State Tree</span>
          </button>
        </div>

        {/* Playback Controls */}
        <div className="playback-controls">
          <span className="step-counter">
            Step <strong>{currentStepNum}</strong> / {totalSteps || 1}
          </span>
          <button className="playback-btn" onClick={handleReset} title="Reset to start">
            <RotateCcw size={14} />
          </button>
          <button className="playback-btn" onClick={handlePrev} title="Previous step" disabled={currentStepNum <= 1}>
            <SkipBack size={14} />
          </button>
          <button className="playback-btn play-btn" onClick={handlePlayPause} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button className="playback-btn" onClick={handleNext} title="Next step" disabled={currentStepNum >= totalSteps}>
            <SkipForward size={14} />
          </button>

          <div className="speed-selector">
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Speed:</span>
            <select value={speed} onChange={e => setSpeed(Number(e.target.value))}>
              <option value={1500}>0.5x</option>
              <option value={800}>1x</option>
              <option value={350}>2x</option>
              <option value={150}>4x</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="algo-vis-body">
        {/* ─── TAB 1: MERGE SORT ────────────────────────────────────────── */}
        {activeTab === 'merge' && (
          <div className="vis-panel merge-sort-vis">
            <div className="vis-meta-banner">
              <div>
                <strong>Merge Sort Priority Sorting:</strong> Divides the incidents array into halves recursively down to singletons,
                then merges comparing tie-breaking hierarchy:
                <span className="policy-pill">1. Urgency</span> →
                <span className="policy-pill">2. Medical Flag</span> →
                <span className="policy-pill">3. Affected Population</span> →
                <span className="policy-pill">4. Waiting Time</span> →
                <span className="policy-pill">5. Stable ID</span>
              </div>
            </div>

            {/* Current Step Explanation Box */}
            <div className="explanation-callout">
              <span className="callout-badge">{curMergeStep?.type.toUpperCase()}</span>
              <p className="callout-text">{curMergeStep?.description}</p>
            </div>

            {/* Split Tree Visualizer */}
            <div className="split-tree-canvas">
              <div className="tree-depth-label">Recursive Sub-arrays Representation</div>
              <div className="tree-nodes-display">
                {mergeTrace.treeNodes.map(node => (
                  <div
                    key={node.id}
                    className={`tree-card${curMergeStep?.nodeId === node.id ? ' active-node' : ''}`}
                    style={{ marginLeft: `${node.depth * 28}px` }}
                  >
                    <div className="tree-card-header">
                      <span>Depth {node.depth} ({node.type})</span>
                      <span className="tree-count">{node.items.length} items</span>
                    </div>
                    <div className="tree-card-items">
                      {node.items.map(it => (
                        <span key={it.id} className={`priority-tag ${it.urgency}`}>
                          {it.name ?? it.id} ({it.urgency}, {it.people}p)
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comparison Details Box */}
            {curMergeStep?.comparing && (
              <div className="comparison-box">
                <div className="comp-title">Active Comparison</div>
                <div className="comp-cards">
                  <div className={`comp-card${curMergeStep.comparing.winner.id === curMergeStep.comparing.a.id ? ' winner' : ''}`}>
                    <strong>{curMergeStep.comparing.a.name ?? curMergeStep.comparing.a.id}</strong>
                    <div>Urgency: {curMergeStep.comparing.a.urgency}</div>
                    <div>Medical: {curMergeStep.comparing.a.medical ? 'Yes' : 'No'}</div>
                    <div>Population: {curMergeStep.comparing.a.people}</div>
                    <div>Waiting: {curMergeStep.comparing.a.waiting}m</div>
                  </div>
                  <div className="comp-vs">VS</div>
                  <div className={`comp-card${curMergeStep.comparing.winner.id === curMergeStep.comparing.b.id ? ' winner' : ''}`}>
                    <strong>{curMergeStep.comparing.b.name ?? curMergeStep.comparing.b.id}</strong>
                    <div>Urgency: {curMergeStep.comparing.b.urgency}</div>
                    <div>Medical: {curMergeStep.comparing.b.medical ? 'Yes' : 'No'}</div>
                    <div>Population: {curMergeStep.comparing.b.people}</div>
                    <div>Waiting: {curMergeStep.comparing.b.waiting}m</div>
                  </div>
                </div>
                <div className="comp-verdict">
                  ✓ Priority Decision: <strong>{curMergeStep.comparing.winner.name ?? curMergeStep.comparing.winner.id}</strong> is prioritized because: <em>{curMergeStep.comparing.reason}</em>
                </div>
              </div>
            )}

            {/* Final Sorted List */}
            <div className="sorted-output-card">
              <div className="sorted-title">Current Priority Order:</div>
              <div className="sorted-chips">
                {(curMergeStep?.currentArray || mergeTrace.sorted).map((inc, i) => (
                  <div key={inc.id} className="priority-chip">
                    <span className="rank-num">#{i + 1}</span>
                    <span className="rank-name">{inc.name ?? inc.id}</span>
                    <span className={`priority-badge ${inc.urgency}`}>{inc.urgency}</span>
                    <span className="meta-info">{inc.people} people</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: BELLMAN-FORD ─────────────────────────────────────── */}
        {activeTab === 'bellman' && (
          <div className="vis-panel bellman-ford-vis">
            <div className="vis-meta-banner">
              <div>
                <strong>Bellman-Ford Shortest Path Algorithm:</strong> Relaxing all edges up to |V|-1 passes to find lowest cost route
                from <strong>Rescue HQ</strong> to <strong>{targetLocation}</strong> ({locations.find(l => l.id === targetLocation)?.name}).
                Complexity: <span className="complexity-badge">O(V · E)</span>
              </div>
            </div>

            {/* Explanation */}
            <div className="explanation-callout">
              <span className={`callout-badge ${curBfStep?.changed ? 'success' : 'neutral'}`}>
                {curBfStep?.changed ? 'IMPROVED' : 'CHECKED'}
              </span>
              <p className="callout-text">{curBfStep?.description}</p>
            </div>

            {/* Active Relaxation Details Card */}
            {curBfStep && (
              <div className="relaxation-metric-grid">
                <div className="bf-metric-card">
                  <div className="bf-label">Edge Examined</div>
                  <div className="bf-value highlight">{curBfStep.from} → {curBfStep.to}</div>
                  <div className="bf-sub">Edge Cost: {curBfStep.cost}</div>
                </div>
                <div className="bf-metric-card">
                  <div className="bf-label">Previous dist[{curBfStep.to}]</div>
                  <div className="bf-value">{curBfStep.old === Infinity ? '∞' : curBfStep.old}</div>
                  <div className="bf-sub">Current best distance</div>
                </div>
                <div className="bf-metric-card">
                  <div className="bf-label">Candidate (dist[{curBfStep.from}] + {curBfStep.cost})</div>
                  <div className="bf-value highlight">{curBfStep.candidate === Infinity ? '∞' : curBfStep.candidate}</div>
                  <div className="bf-sub">
                    {curBfStep.candidate < curBfStep.old ? '✓ Strictly shorter!' : '✕ Not shorter'}
                  </div>
                </div>
                <div className="bf-metric-card">
                  <div className="bf-label">Outcome in Pass {curBfStep.pass}</div>
                  <div className={`bf-value ${curBfStep.changed ? 'text-success' : 'text-muted'}`}>
                    {curBfStep.changed ? 'Updated dist & parent' : 'No update'}
                  </div>
                  <div className="bf-sub">{curBfStep.changed ? `parent[${curBfStep.to}] = ${curBfStep.from}` : 'Retained existing path'}</div>
                </div>
              </div>
            )}

            {/* Distance Table Snapshot */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Distance Array Table Snapshot (Pass {curBfStep?.pass ?? 1})</span>
              </div>
              <div className="dist-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Node</th>
                      <th>Location Name</th>
                      <th>Distance from HQ</th>
                      <th>Predecessor (Parent)</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map(loc => {
                      const distVal = curBfStep?.distSnapshot[loc.id];
                      const parentVal = curBfStep?.parentSnapshot[loc.id];
                      const isTarget = loc.id === targetLocation;
                      const isCurrentTo = curBfStep?.to === loc.id;
                      return (
                        <tr key={loc.id} className={isCurrentTo ? 'row-highlight' : isTarget ? 'row-target' : ''}>
                          <td><strong>{loc.id}</strong></td>
                          <td>{loc.name}</td>
                          <td>
                            <span className="dist-badge">
                              {distVal === undefined || distVal === Infinity ? '∞' : distVal}
                            </span>
                          </td>
                          <td>{parentVal ? `← ${parentVal}` : (loc.id === 'HQ' ? '— (Source)' : 'None')}</td>
                          <td>
                            {distVal !== undefined && distVal < Infinity
                              ? <span className="status-chip eligible">Reachable</span>
                              : <span className="status-chip unreachable">Unreachable</span>
                            }
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Shortest Path Result */}
            <div className="route-result-banner">
              <div className="route-result-title">Shortest Path to {targetLocation}:</div>
              {bfTrace.found ? (
                <div className="route-path-flow">
                  {bfTrace.path.map((id, i) => (
                    <span key={id} className="flow-node">
                      {i > 0 && <span className="flow-arrow">→</span>}
                      <strong>{id}</strong> ({locations.find(l => l.id === id)?.shortName})
                    </span>
                  ))}
                  <span className="flow-cost">Total Cost: {bfTrace.cost}</span>
                </div>
              ) : (
                <div className="unreachable-banner">
                  ⛔ UNREACHABLE — No open path exists from HQ to {targetLocation} under current road conditions.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 3: 0/1 KNAPSACK ─────────────────────────────────────── */}
        {activeTab === 'knapsack' && (
          <div className="vis-panel knapsack-vis">
            <div className="vis-meta-banner">
              <div>
                <strong>0/1 Knapsack Dynamic Programming:</strong> Maximizing total people supported within fleet carrying capacity <strong>{capacity}</strong>.
                Formula: <code>DP[i][w] = max(DP[i-1][w], value[i] + DP[i-1][w - weight[i]])</code>
              </div>
            </div>

            {/* Explanation */}
            <div className="explanation-callout">
              <span className={`callout-badge ${curKnapStep?.decision === 'include' ? 'success' : 'neutral'}`}>
                {curKnapStep?.decision?.toUpperCase()}
              </span>
              <p className="callout-text">{curKnapStep?.explanation}</p>
            </div>

            {/* Active Cell Inspection Grid */}
            {curKnapStep && (
              <div className="knap-step-cards">
                <div className="knap-card">
                  <div className="knap-label">Item Under Consideration</div>
                  <div className="knap-value">{curKnapStep.item.name}</div>
                  <div className="knap-sub">Weight: {curKnapStep.item.weight} | Benefit: {curKnapStep.item.value}</div>
                </div>
                <div className="knap-card">
                  <div className="knap-label">Exclude Option</div>
                  <div className="knap-value">{curKnapStep.excludeVal}</div>
                  <div className="knap-sub">DP[{curKnapStep.i - 1}][{curKnapStep.w}]</div>
                </div>
                <div className="knap-card">
                  <div className="knap-label">Include Option</div>
                  <div className="knap-value">
                    {curKnapStep.includeVal !== undefined ? curKnapStep.includeVal : 'N/A (Exceeds capacity)'}
                  </div>
                  <div className="knap-sub">
                    {curKnapStep.includeVal !== undefined ? `${curKnapStep.item.value} + DP[${curKnapStep.i - 1}][${curKnapStep.w - curKnapStep.item.weight}]` : 'Weight exceeds current w'}
                  </div>
                </div>
                <div className="knap-card">
                  <div className="knap-label">Result at DP[{curKnapStep.i}][{curKnapStep.w}]</div>
                  <div className="knap-value highlight">{curKnapStep.cellVal}</div>
                  <div className="knap-sub">Decision: {curKnapStep.decision}</div>
                </div>
              </div>
            )}

            {/* 2D DP Table Grid */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Dynamic Programming Table (DP Matrix)</span>
                <span className="panel-badge">Capacity 0..{capacity}</span>
              </div>
              <div className="dp-matrix-wrapper">
                <table className="dp-matrix">
                  <thead>
                    <tr>
                      <th className="sticky-col">Item (i)</th>
                      <th className="sticky-col-2">Weight</th>
                      <th className="sticky-col-3">Value</th>
                      {Array.from({ length: capacity + 1 }, (_, w) => (
                        <th key={w}>w={w}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {/* Row 0: Initial base row */}
                    <tr>
                      <td className="sticky-col">Base (0 items)</td>
                      <td className="sticky-col-2">0</td>
                      <td className="sticky-col-3">0</td>
                      {Array.from({ length: capacity + 1 }, (_, w) => (
                        <td key={w} className="dp-cell">0</td>
                      ))}
                    </tr>

                    {/* Rows for each package item */}
                    {packages.map((pkg, i) => {
                      const itemIdx = i + 1;
                      return (
                        <tr key={pkg.id}>
                          <td className="sticky-col"><strong>{pkg.name}</strong></td>
                          <td className="sticky-col-2">{pkg.weight}</td>
                          <td className="sticky-col-3">{pkg.value}</td>
                          {Array.from({ length: capacity + 1 }, (_, w) => {
                            const isCurrentCell = curKnapStep && curKnapStep.i === itemIdx && curKnapStep.w === w;
                            const isChosenInBacktrack = knapTrace.backtrackPath.some(b => b.i === itemIdx && b.w === w && b.chosen);
                            let cellClass = 'dp-cell';
                            if (isCurrentCell) cellClass += ' active-cell';
                            else if (isChosenInBacktrack) cellClass += ' backtrack-chosen';

                            return (
                              <td key={w} className={cellClass}>
                                {knapTrace.dp[itemIdx]?.[w] ?? 0}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Chosen Packages Output */}
            <div className="knap-summary-banner">
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>Optimally Allocated Packages (Backtracking Result):</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {knapTrace.chosen.map(p => (
                    <span key={p.id} className="status-chip eligible">
                      ✓ {p.name} (w: {p.weight}, benefit: {p.value})
                    </span>
                  ))}
                  {knapTrace.chosen.length === 0 && <span className="text-muted">No packages allocated</span>}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Capacity Utilized</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>
                  {knapTrace.used} / {capacity} units
                </div>
                <div style={{ fontSize: 11, color: 'var(--success)' }}>
                  Total Benefit: {knapTrace.value} people supported
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: BACKTRACKING (STATE SPACE TREE) ───────────────────── */}
        {activeTab === 'backtrack' && (
          <div className="vis-panel backtrack-vis">
            <div className="vis-meta-banner">
              <div>
                <strong>Backtracking Team Assignment with State Space Tree:</strong> Explores feasible assignments
                matching team specialties to incident requirements. Prunes branches where teams are unavailable
                or capabilities are incompatible.
              </div>
            </div>

            {/* Explanation */}
            <div className="explanation-callout">
              <span className={`callout-badge ${curBtStep?.status === 'accept' || curBtStep?.status === 'solution' ? 'success' : curBtStep?.status === 'backtrack' ? 'warning' : 'danger'}`}>
                {curBtStep?.status?.toUpperCase()}
              </span>
              <p className="callout-text">{curBtStep?.description}</p>
            </div>

            {/* State Space Tree Visualization */}
            <div className="state-space-canvas">
              <div className="tree-depth-label">State Space Search Tree Execution</div>
              <div className="tree-nodes-display">
                {btTrace.treeNodes.map(node => {
                  const isCurrent = curBtStep && curBtStep.nodeId === node.id;
                  let nodeStatusClass = 'tree-node-valid';
                  if (node.status === 'rejected') nodeStatusClass = 'tree-node-rejected';
                  else if (node.status === 'solution') nodeStatusClass = 'tree-node-solution';
                  else if (node.status === 'backtrack') nodeStatusClass = 'tree-node-backtrack';

                  return (
                    <div
                      key={node.id}
                      className={`state-tree-card ${nodeStatusClass}${isCurrent ? ' active-node' : ''}`}
                      style={{ marginLeft: `${node.depth * 30}px` }}
                    >
                      <div className="state-card-header">
                        <span className="state-node-title">
                          {node.taskId === 'START' ? '🌱 ROOT' : node.taskId === 'COMPLETE' ? '🏆 GOAL SOLUTION' : `Incident: ${node.taskId}`}
                        </span>
                        <span className={`status-chip ${node.status === 'valid' || node.status === 'solution' ? 'eligible' : 'unreachable'}`}>
                          {node.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="state-card-body">
                        {node.teamName !== 'NONE' && (
                          <div style={{ fontWeight: 600 }}>Candidate Team: {node.teamName}</div>
                        )}
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{node.reason}</div>
                        {node.currentAssignments.length > 0 && (
                          <div className="state-assign-chain">
                            Path: {node.currentAssignments.join(' | ')}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Final Schedule Output */}
            <div className="sorted-output-card">
              <div className="sorted-title">Assignment Schedule Found:</div>
              <div className="sorted-chips">
                {btTrace.assignment ? (
                  btTrace.assignment.map((a, idx) => (
                    <div key={idx} className="priority-chip" style={{ background: 'rgba(34, 197, 94, 0.15)', borderColor: 'var(--success)' }}>
                      <Check size={14} style={{ color: 'var(--success)' }} />
                      <span>{a}</span>
                    </div>
                  ))
                ) : (
                  <div className="unreachable-banner">
                    No complete feasible assignment could satisfy all constraints.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
