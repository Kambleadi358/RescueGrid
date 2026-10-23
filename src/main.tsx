import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Play, Pause, RotateCcw, ArrowLeft, Check, Truck,
  ChevronDown, ChevronUp, Sun, Moon, AlertTriangle,
  Shield, Users, Package as PackageIcon, Activity,
  Clock, FileText, Sliders, Sparkles
} from 'lucide-react';
import './style.css';
import { locations, roads, packages, type Road, type Location as TownLocation } from './data';
import {
  demoScenarios,
  planScenario,
  stepSimulationClock,
  type Scenario,
  type SimulationState,
  type TaskStatus
} from './simulation';
import { TownMap } from './components/TownMap';
import { ModeSelection } from './components/ModeSelection';
import { ScenarioBuilder } from './components/ScenarioBuilder';
import { ReviewMission } from './components/ReviewMission';
import { AlgorithmVisualizer } from './components/AlgorithmVisualizer';
import { DaaReport } from './components/DaaReport';

// ─── Predefined Demos ────────────────────────────────────────────────────────
const initialDemos = demoScenarios(roads, packages);

type AppView = 'mode_select' | 'builder' | 'review' | 'simulation' | 'visualizer' | 'report';

function App() {
  const [demos] = useState<Scenario[]>(initialDemos);
  const [scenario, setScenario] = useState<Scenario>(initialDemos[0]);
  const [view, setView] = useState<AppView>('mode_select');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(initialDemos[0].incidents[0]?.id ?? '');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Map viewport
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [highlightEdge, setHighlightEdge] = useState<{ from: string; to: string } | null>(null);

  // Dynamic simulation clock state
  const [simState, setSimState] = useState<SimulationState>(() => {
    const initPlan = planScenario(initialDemos[0], locations);
    return initPlan.initialSimulationState;
  });
  const [simPlaying, setSimPlaying] = useState(false);

  // Authoritative algorithm planning (Merge Sort + Bellman-Ford + Knapsack + Backtracking)
  const plan = useMemo(() => planScenario(scenario, locations), [scenario]);

  // Sync simulation state when scenario changes or roads are toggled
  useEffect(() => {
    setSimState(plan.initialSimulationState);
    setSimPlaying(false);
  }, [plan]);

  // Selected incident
  const selectedIncident = useMemo(
    () => scenario.incidents.find(x => x.id === selectedIncidentId) ?? plan.ordered[0],
    [scenario.incidents, selectedIncidentId, plan.ordered]
  );

  // Route for selected incident
  const selectedRoute = useMemo(
    () => selectedIncident ? plan.routeMap[selectedIncident.id] : null,
    [selectedIncident, plan.routeMap]
  );

  // Map incident pins
  const incidentPins = useMemo(() =>
    plan.ordered.map((inc, i) => ({
      id: inc.id,
      locationId: inc.location,
      urgency: inc.urgency,
      rank: i + 1,
    })),
    [plan.ordered]
  );

  // Theme toggle
  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  }, [theme]);

  // Choose a demo scenario (clears stale state)
  const handleSelectDemo = useCallback((s: Scenario) => {
    setScenario(s);
    setSelectedIncidentId(s.incidents[0]?.id ?? '');
    setSimPlaying(false);
    setView('simulation');
  }, []);

  // Choose custom mode
  const handleSelectCustom = useCallback(() => {
    // Clean user-defined scenario template (clean state, zero pre-filled demo entries)
    const customTemplate: Scenario = {
      name: 'Custom Disaster Scenario',
      description: 'User-configured emergency response scenario.',
      incidents: [],
      teams: [],
      roads: roads.map(r => ({ ...r, blocked: false })),
      packages: [],
      capacity: 15,
    };
    setScenario(customTemplate);
    setSelectedIncidentId('');
    setSimPlaying(false);
    setView('builder');
  }, []);

  // Direct road toggle on map (authoritative state update)
  const handleRoadToggle = useCallback((r: Road) => {
    setScenario(prev => ({
      ...prev,
      roads: prev.roads.map(x =>
        (x.id && r.id && x.id === r.id) || (x.a === r.a && x.b === r.b)
          ? { ...x, blocked: !x.blocked }
          : x
      ),
    }));
  }, []);

  // Reset custom scenario inputs to clean state
  const handleResetCustomInputs = useCallback(() => {
    const cleanTemplate: Scenario = {
      name: 'Custom Disaster Scenario',
      description: 'User-configured emergency response scenario.',
      incidents: [],
      teams: [],
      roads: roads.map(r => ({ ...r, blocked: false })),
      packages: [],
      capacity: 15,
    };
    setScenario(cleanTemplate);
    setSelectedIncidentId('');
    setSimPlaying(false);
  }, []);

  // Simulation Clock Auto-Play
  useEffect(() => {
    if (!simPlaying) return;
    const interval = setInterval(() => {
      setSimState(prev => {
        if (prev.isFinished) {
          setSimPlaying(false);
          return prev;
        }
        return stepSimulationClock(prev, prev.currentTime + 3);
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [simPlaying]);

  // Manual simulation step
  const handleSimStepForward = () => {
    setSimPlaying(false);
    setSimState(prev => stepSimulationClock(prev, prev.currentTime + 5));
  };

  const handleSimStepBackward = () => {
    setSimPlaying(false);
    setSimState(prev => stepSimulationClock(prev, Math.max(0, prev.currentTime - 5)));
  };

  const handleSimReset = () => {
    setSimPlaying(false);
    setSimState(plan.initialSimulationState);
  };

  const activePathIds = selectedRoute?.found ? selectedRoute.path : [];
  const selectedTeam = selectedIncident ? plan.teamMap[selectedIncident.id] : null;
  const isEligible = selectedIncident ? plan.eligible.some(x => x.id === selectedIncident.id) : false;
  const incidentLiveState = selectedIncident ? simState.incidentStates[selectedIncident.id] : undefined;

  return (
    <div className="app-shell" data-theme={theme}>
      {/* Top Header Navigation */}
      <header className="app-header no-print">
        <div className="header-brand" onClick={() => setView('mode_select')} style={{ cursor: 'pointer' }}>
          <div className="header-logo">🚨</div>
          <div>
            <div className="header-brand-text">RESCUEGRID</div>
            <div className="header-brand-sub">Disaster Response Simulation</div>
          </div>
        </div>

        <div className="header-sep" />

        {/* Navigation tabs */}
        <nav className="header-nav-tabs">
          <button
            className={`nav-tab${view === 'mode_select' ? ' active' : ''}`}
            onClick={() => setView('mode_select')}
          >
            <Sparkles size={13} /> Mode Select
          </button>
          <button
            className={`nav-tab${view === 'builder' ? ' active' : ''}`}
            onClick={() => setView('builder')}
          >
            <Sliders size={13} /> Scenario Builder
          </button>
          <button
            className={`nav-tab${view === 'simulation' ? ' active' : ''}`}
            onClick={() => setView('simulation')}
          >
            <Activity size={13} /> Simulation Center
          </button>
          <button
            className={`nav-tab${view === 'visualizer' ? ' active' : ''}`}
            onClick={() => setView('visualizer')}
          >
            <Shield size={13} /> Algorithm Visualizer
          </button>
          <button
            className={`nav-tab${view === 'report' ? ' active' : ''}`}
            onClick={() => setView('report')}
          >
            <FileText size={13} /> DAA Report
          </button>
        </nav>

        {/* Right action controls */}
        <div className="header-actions">
          <span className="sim-mode-tag">
            {scenario.name}
          </span>
          <button className="btn-icon" onClick={toggleTheme} title="Toggle theme">
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Main Content Router */}
      <main className="app-main-content">
        {/* VIEW 1: MODE SELECTION */}
        {view === 'mode_select' && (
          <ModeSelection
            demos={demos}
            onSelectDemo={handleSelectDemo}
            onSelectCustom={handleSelectCustom}
          />
        )}

        {/* VIEW 2: SCENARIO BUILDER */}
        {view === 'builder' && (
          <ScenarioBuilder
            scenario={scenario}
            setScenario={setScenario}
            onReview={() => setView('review')}
            onBackToMode={() => setView('mode_select')}
            onResetToDefaults={handleResetCustomInputs}
            zoom={zoom}
            offsetX={offsetX}
            offsetY={offsetY}
            setZoom={setZoom}
            setOffsetX={setOffsetX}
            setOffsetY={setOffsetY}
          />
        )}

        {/* VIEW 3: REVIEW MISSION INPUTS */}
        {view === 'review' && (
          <ReviewMission
            scenario={scenario}
            onBackToEdit={() => setView('builder')}
            onConfirmLaunch={() => setView('simulation')}
          />
        )}

        {/* VIEW 4: SIMULATION CENTER (GRAPHICAL MAP + PRIORITY ONLY + DYNAMIC SCHEDULING) */}
        {view === 'simulation' && (
          <div className="command-center run">
            {/* ── LEFT SIDEBAR: INCIDENT PRIORITY LIST ONLY ── */}
            <div className="panel-left">
              <div className="panel-header">
                <AlertTriangle size={14} />
                <span className="panel-title">Incident Priority</span>
                <span className="panel-badge">{plan.ordered.length}</span>
              </div>
              <div className="panel-sub-hint">
                Sorted via Merge Sort · Click an incident to highlight its route
              </div>

              <div className="incident-list">
                {plan.ordered.length === 0 ? (
                  <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    No incidents configured. Return to Scenario Builder to add incidents.
                  </div>
                ) : (
                  plan.ordered.map((inc, i) => {
                  const reachable = plan.routeMap[inc.id]?.found ?? false;
                  const live = simState.incidentStates[inc.id];
                  const isSelected = selectedIncidentId === inc.id;

                  let statusCls = 'waiting';
                  let statusTxt = 'WAITING';

                  if (live?.status === 'completed') {
                    statusCls = 'completed';
                    statusTxt = 'COMPLETED';
                  } else if (live?.status === 'in_progress') {
                    statusCls = 'in-progress';
                    statusTxt = 'IN PROGRESS';
                  } else if (!reachable) {
                    statusCls = 'unreachable';
                    statusTxt = 'UNREACHABLE';
                  } else if (isEligible) {
                    statusCls = 'eligible';
                    statusTxt = 'ASSIGNED';
                  }

                  return (
                    <div
                      key={inc.id}
                      className={`incident-card animate-slide${isSelected ? ' selected' : ''}`}
                      onClick={() => setSelectedIncidentId(inc.id)}
                      role="button"
                      aria-label={`Priority ${i + 1}: ${inc.name ?? inc.id}`}
                    >
                      <div className="incident-rank">#{i + 1}</div>
                      <div className="incident-info">
                        <div className="incident-name">{inc.name ?? inc.id}</div>
                        <div className="incident-meta">
                          <span>{locations.find(l => l.id === inc.location)?.name}</span>
                          <span>·</span>
                          <span>{inc.people} casualties</span>
                        </div>
                        <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                          <span className={`priority-badge ${inc.urgency}`}>{inc.urgency}</span>
                          {inc.medical && <span className="status-chip eligible" style={{ fontSize: 9 }}>Med</span>}
                          <span className={`status-chip ${statusCls}`}>{statusTxt}</span>
                        </div>
                      </div>
                    </div>
                  );
                }))}
              </div>

              <div className="sidebar-quick-nav">
                <button className="btn-sm" onClick={() => setView('visualizer')} style={{ width: '100%', justifyContent: 'center' }}>
                  <Shield size={13} /> View Step-by-Step Algorithm Traces
                </button>
              </div>
            </div>

            {/* ── CENTER AREA: GRAPHICAL TOWN MAP WITH DIRECT ROAD CLICKS ── */}
            <div className="panel-center">
              <div className="sim-map-header-bar">
                <div className="sim-status-indicator">
                  <span className="live-pulse-dot" />
                  <span>SIMULATION ACTIVE · <strong>T={simState.currentTime} min</strong></span>
                </div>
                <div className="sim-road-prompt">
                  <span>💡 <strong>Interactive Graph:</strong> Click any road edge on the map to block or open it.</span>
                </div>
              </div>

              <TownMap
                roads={scenario.roads}
                activePath={activePathIds}
                selectedId={selectedIncidentId}
                incidentLocations={incidentPins}
                onNodeClick={(locId) => {
                  const inc = plan.ordered.find(x => x.location === locId);
                  if (inc) setSelectedIncidentId(inc.id);
                }}
                onRoadToggle={handleRoadToggle}
                highlightEdge={highlightEdge}
                zoom={zoom}
                offsetX={offsetX}
                offsetY={offsetY}
                setZoom={setZoom}
                setOffsetX={setOffsetX}
                setOffsetY={setOffsetY}
                instructionText="Click any road edge to block or reopen it."
              />
            </div>

            {/* ── RIGHT SIDEBAR: INCIDENT DETAILS & DYNAMIC TEAM REUSE SCHEDULER ── */}
            <div className="panel-right">
              <div className="panel-header">
                <Shield size={14} />
                <span className="panel-title">Mission Operations</span>
              </div>

              <div className="panel-body">
                {/* Simulation Clock & Team Reuse Controls (Section 8) */}
                <div className="card sim-controls-card">
                  <div className="card-header" style={{ border: 'none', padding: '0 0 8px 0' }}>
                    <Clock size={14} />
                    <span className="card-title">Event Clock &amp; Team Reuse</span>
                    <span className="panel-badge" style={{ marginLeft: 'auto' }}>
                      T = {simState.currentTime} min
                    </span>
                  </div>

                  <div className="sim-clock-bar">
                    <button className="btn-sm" onClick={handleSimReset} title="Reset clock">
                      <RotateCcw size={13} />
                    </button>
                    <button className="btn-sm" onClick={handleSimStepBackward} title="-5 mins">
                      -5m
                    </button>
                    <button
                      className={`btn-sm ${simPlaying ? 'btn-danger' : 'btn-primary'}`}
                      onClick={() => setSimPlaying(p => !p)}
                    >
                      {simPlaying ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Auto-Advance</>}
                    </button>
                    <button className="btn-sm" onClick={handleSimStepForward} title="+5 mins">
                      +5m
                    </button>
                  </div>

                  {/* Dynamic Team Status List showing Reuse */}
                  <div className="team-live-stack" style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                      RESCUE TEAMS DISPATCH STATUS:
                    </div>
                    {scenario.teams.map(t => {
                      const state = simState.teamStates[t.name];
                      const isRescuing = state?.status === 'rescuing';
                      const isFree = state?.status === 'available';

                      return (
                        <div key={t.name} className={`team-live-card ${state?.status ?? 'unavailable'}`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Users size={12} />
                            <strong>{t.name}</strong>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>({t.capability})</span>
                          </div>
                          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {isRescuing && (
                              <span className="status-chip eligible">
                                Rescuing at {state?.currentIncidentId}
                              </span>
                            )}
                            {isFree && (
                              <span className="status-chip eligible" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
                                Available for next task
                              </span>
                            )}
                            {state?.status === 'unavailable' && (
                              <span className="status-chip unreachable">Unavailable</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Incident Details */}
                {selectedIncident ? (
                  <>
                    <div className="detail-section">
                      <div className="detail-title">{selectedIncident.name ?? selectedIncident.id}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                        <span className={`priority-badge ${selectedIncident.urgency}`}>{selectedIncident.urgency}</span>
                        {selectedIncident.medical && <span className="status-chip eligible">Medical Emergency</span>}
                        <span className={`status-chip ${isEligible ? 'eligible' : 'unreachable'}`}>
                          {isEligible ? 'ELIGIBLE' : 'INELIGIBLE'}
                        </span>
                      </div>
                    </div>

                    {/* Incident Metrics */}
                    <div className="metric-grid">
                      <div className="metric-box">
                        <div className="metric-value">{selectedIncident.people}</div>
                        <div className="metric-label">Affected</div>
                      </div>
                      <div className="metric-box">
                        <div className="metric-value" style={{ color: 'var(--warning)' }}>{selectedIncident.waiting}m</div>
                        <div className="metric-label">Waiting</div>
                      </div>
                      <div className="metric-box">
                        <div className="metric-value" style={{ color: selectedRoute?.found ? 'var(--success)' : 'var(--danger)' }}>
                          {selectedRoute?.found ? selectedRoute.cost : '∞'}
                        </div>
                        <div className="metric-label">Travel Cost</div>
                      </div>
                      <div className="metric-box">
                        <div className="metric-value" style={{ color: 'var(--accent)' }}>
                          {incidentLiveState?.rescuedCount ?? 0}
                        </div>
                        <div className="metric-label">Rescued</div>
                      </div>
                    </div>

                    {/* Route Details */}
                    <div>
                      <div className="detail-label">Shortest Route (Bellman-Ford HQ → {selectedIncident.location})</div>
                      {selectedRoute?.found ? (
                        <div className="route-path">
                          {selectedRoute.path.map((id, i) => (
                            <span key={id}>
                              {i > 0 && <span style={{ color: 'var(--text-muted)', margin: '0 4px' }}>→</span>}
                              {locations.find(l => l.id === id)?.shortName ?? id}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="unreachable-banner">
                          ⛔ UNREACHABLE — No open path exists from HQ to this destination with current road blockages.
                        </div>
                      )}
                    </div>

                    {/* Assigned Team */}
                    <div>
                      <div className="detail-label">Assigned Rescue Team</div>
                      {selectedTeam ? (
                        <div className={`team-chip ${selectedTeam.available ? 'available' : 'unavailable'}`}>
                          <Shield size={13} style={{ color: 'var(--success)' }} />
                          <span>{selectedTeam.name}</span>
                          <span style={{ marginLeft: 4, fontSize: 11, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                            ({selectedTeam.capability})
                          </span>
                        </div>
                      ) : (
                        <div className="unreachable-banner">
                          <AlertTriangle size={13} />
                          No compatible available team assigned.
                        </div>
                      )}
                    </div>

                    {/* Dispatched Resources */}
                    <div>
                      <div className="detail-label">Dispatched Relief (0/1 Knapsack)</div>
                      {isEligible && plan.allocation.length > 0 ? (
                        <>
                          <div className="dispatch-banner">
                            Load {plan.used}/{scenario.capacity} units · Total Benefit: {plan.benefit} people
                          </div>
                          {plan.allocation.map(p => (
                            <div key={p.id} className="resource-row">
                              <span className="status-chip eligible">{p.category}</span>
                              <span><strong>{p.name}</strong></span>
                              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)' }}>
                                wt: {p.weight} · val: {p.value}
                              </span>
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="unreachable-banner">
                          <PackageIcon size={13} />
                          {isEligible ? 'No packages fit within capacity.' : 'No relief dispatched — destination not eligible.'}
                        </div>
                      )}
                    </div>

                    {/* Manual Action Button */}
                    <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                      <button
                        className={`rescue-complete-btn${incidentLiveState?.status === 'completed' ? ' done' : ''}`}
                        disabled={!isEligible || !selectedRoute?.found || incidentLiveState?.status === 'completed'}
                        onClick={() => {
                          setSimState(prev => {
                            const curTask = prev.tasks.find(t => t.incidentId === selectedIncident.id);
                            const completionTarget = curTask ? curTask.completionTime : prev.currentTime + 10;
                            return stepSimulationClock(prev, completionTarget);
                          });
                        }}
                      >
                        {incidentLiveState?.status === 'completed' ? (
                          <><Check size={15} /> Rescue Completed ({incidentLiveState.rescuedCount} saved)</>
                        ) : (
                          <><Truck size={15} /> Complete Rescue &amp; Free Team</>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>
                    {scenario.incidents.length === 0
                      ? 'No incidents configured. Return to Scenario Builder to add incidents.'
                      : 'Select an incident from the priority list or map.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 5: ALGORITHM VISUALIZER */}
        {view === 'visualizer' && (
          <AlgorithmVisualizer
            incidents={scenario.incidents}
            roads={scenario.roads}
            packages={scenario.packages}
            teams={scenario.teams}
            capacity={scenario.capacity}
            selectedIncident={selectedIncident}
            onHighlightEdge={setHighlightEdge}
          />
        )}

        {/* VIEW 6: COMPREHENSIVE DAA REPORT */}
        {view === 'report' && (
          <DaaReport
            scenario={scenario}
            plan={plan}
            simState={simState}
            onBack={() => setView('simulation')}
          />
        )}
      </main>
    </div>
  );
}

// ─── Mount ───────────────────────────────────────────────────────────────────
createRoot(document.getElementById('root')!).render(<App />);
