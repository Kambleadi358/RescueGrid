import React from 'react';
import {
  Printer, ArrowLeft, Shield, AlertTriangle, Users, Package as PackageIcon,
  Activity, Check, GitCommit, Clock, FileText, ExternalLink
} from 'lucide-react';
import type { Scenario, PlanResult, SimulationState } from '../simulation';
import { locations } from '../data';
import { mergeSortWithTrace, knapsack, bellmanFord, assignTeams } from '../algorithms';

interface DaaReportProps {
  scenario: Scenario;
  plan: PlanResult;
  simState: SimulationState;
  onBack: () => void;
}

export function DaaReport({ scenario, plan, simState, onBack }: DaaReportProps) {
  const handlePrint = () => {
    window.print();
  };

  const mergeData = React.useMemo(() => mergeSortWithTrace(scenario.incidents), [scenario.incidents]);
  const knapData = React.useMemo(() => knapsack(scenario.packages, scenario.capacity), [scenario.packages, scenario.capacity]);

  const blockedRoads = scenario.roads.filter(r => r.blocked);
  const openRoads = scenario.roads.filter(r => !r.blocked);
  const availableTeams = scenario.teams.filter(t => t.available);
  const totalDemand = scenario.incidents.reduce((s, i) => s + i.people, 0);

  return (
    <div className="report-container printable-report">
      {/* Report Header Bar */}
      <div className="report-actions-bar no-print">
        <button className="btn-sm btn-ghost" onClick={onBack}>
          <ArrowLeft size={14} /> Back to Simulation
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <button className="btn-primary" onClick={handlePrint}>
            <Printer size={15} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="report-doc-header">
        <div className="report-badge">DESIGN &amp; ANALYSIS OF ALGORITHMS — COMPREHENSIVE EXECUTION REPORT</div>
        <h1 className="report-main-title">RescueGrid: Disaster Response &amp; Optimization Audit</h1>
        <div className="report-meta-sub">
          <span>Scenario: <strong>{scenario.name}</strong></span>
          <span>·</span>
          <span>Target City Graph: <strong>13 Nodes, 19 Edges</strong></span>
          <span>·</span>
          <span>Simulation Engine: <strong>Discrete-Event Dynamic Team Reuse</strong></span>
        </div>
      </div>

      {/* ─── SECTION A: SCENARIO SUMMARY ─────────────────────────────────── */}
      <section className="report-section">
        <div className="report-sec-header">
          <span className="sec-num">SECTION A</span>
          <h2 className="sec-title">Mission Scenario Executive Summary</h2>
        </div>
        <p className="sec-intro">
          High-level operational overview comparing theoretical estimates against empirical simulation execution.
        </p>

        <div className="report-kpi-grid">
          <div className="report-kpi-card">
            <div className="kpi-label">Total Incidents</div>
            <div className="kpi-value">{scenario.incidents.length}</div>
            <div className="kpi-sub">{totalDemand} Total Casualties</div>
          </div>
          <div className="report-kpi-card">
            <div className="kpi-label">Rescue Teams</div>
            <div className="kpi-value">{availableTeams.length} / {scenario.teams.length}</div>
            <div className="kpi-sub">{availableTeams.length} Active, {scenario.teams.length - availableTeams.length} Unavailable</div>
          </div>
          <div className="report-kpi-card">
            <div className="kpi-label">Road Network</div>
            <div className="kpi-value">{openRoads.length} Open / {blockedRoads.length} Blocked</div>
            <div className="kpi-sub">{blockedRoads.map(r => r.name).join(', ') || 'No blocked roads'}</div>
          </div>
          <div className="report-kpi-card highlight">
            <div className="kpi-label">People Supported vs Rescued</div>
            <div className="kpi-value">{simState.totalRescued} Rescued</div>
            <div className="kpi-sub">Estimated Support Cap: {plan.supported}</div>
          </div>
        </div>

        <table className="report-table">
          <thead>
            <tr>
              <th>Incident</th>
              <th>Location</th>
              <th>Urgency</th>
              <th>Casualties</th>
              <th>Route Reachability</th>
              <th>Team Assigned</th>
              <th>Dispatched Supplies</th>
              <th>Outcome Status</th>
            </tr>
          </thead>
          <tbody>
            {plan.ordered.map(inc => {
              const route = plan.routeMap[inc.id];
              const team = plan.teamMap[inc.id];
              const incState = simState.incidentStates[inc.id];
              const isEligible = plan.eligible.some(e => e.id === inc.id);

              return (
                <tr key={inc.id}>
                  <td><strong>{inc.name ?? inc.id}</strong></td>
                  <td>{locations.find(l => l.id === inc.location)?.name}</td>
                  <td><span className={`priority-badge ${inc.urgency}`}>{inc.urgency}</span></td>
                  <td>{inc.people}</td>
                  <td>
                    {route?.found
                      ? <span className="status-chip eligible">Found (Cost {route.cost})</span>
                      : <span className="status-chip unreachable">UNREACHABLE</span>
                    }
                  </td>
                  <td>
                    {team ? (
                      <span>{team.name} ({team.capability})</span>
                    ) : (
                      <span className="text-muted">None available</span>
                    )}
                  </td>
                  <td>
                    {isEligible ? `${plan.allocation.length} packages (${plan.used} units)` : 'None (Ineligible)'}
                  </td>
                  <td>
                    <span className={`status-chip ${incState?.status === 'completed' ? 'eligible' : incState?.status === 'unreachable' ? 'unreachable' : 'no-team'}`}>
                      {incState?.status?.toUpperCase() ?? 'PENDING'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* ─── SECTION B: MERGE SORT REPORT ────────────────────────────────── */}
      <section className="report-section">
        <div className="report-sec-header">
          <span className="sec-num">SECTION B</span>
          <h2 className="sec-title">Incident Prioritization via Merge Sort</h2>
        </div>
        <p className="sec-intro">
          Merge Sort is a stable, divide-and-conquer algorithm with guaranteed asymptotic time complexity of
          <strong> O(R log R)</strong> and auxiliary space <strong>O(R)</strong>, where R is the number of emergency requests.
        </p>

        <div className="report-box">
          <h4 style={{ margin: '0 0 8px 0', fontSize: 13 }}>Prioritization Hierarchy &amp; Tie-Breaking Policy:</h4>
          <ol style={{ margin: 0, paddingLeft: 20, fontSize: 12, lineHeight: 1.6 }}>
            <li><strong>Urgency Tier:</strong> Critical (0) &gt; High (1) &gt; Medium (2) &gt; Low (3).</li>
            <li><strong>Medical Emergency Flag:</strong> Life-threatening medical crises strictly prioritized.</li>
            <li><strong>Affected Population:</strong> Incidents threatening larger groups prioritized higher.</li>
            <li><strong>Elapsed Waiting Time:</strong> Longer waiting periods prioritized to avoid starvation.</li>
            <li><strong>Deterministic ID Order:</strong> Deterministic tie-breaker to preserve strict algorithm stability.</li>
          </ol>
        </div>

        <div className="report-trace-table">
          <div className="report-table-title">Final Sorted Priority Sequence:</div>
          <table className="report-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Incident ID</th>
                <th>Name</th>
                <th>Urgency</th>
                <th>Medical</th>
                <th>Casualties</th>
                <th>Waiting Time</th>
                <th>Prioritization Rationale</th>
              </tr>
            </thead>
            <tbody>
              {mergeData.sorted.map((inc, idx) => (
                <tr key={inc.id}>
                  <td><strong>#{idx + 1}</strong></td>
                  <td><code>{inc.id}</code></td>
                  <td>{inc.name ?? inc.id}</td>
                  <td><span className={`priority-badge ${inc.urgency}`}>{inc.urgency}</span></td>
                  <td>{inc.medical ? '✓ Yes' : 'No'}</td>
                  <td>{inc.people}</td>
                  <td>{inc.waiting} min</td>
                  <td style={{ fontSize: 11 }}>
                    {idx === 0
                      ? 'Highest urgency tier in active incident pool.'
                      : `Preceded by #${idx} due to higher urgency or casualty demand.`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── SECTION C: BELLMAN-FORD REPORT ──────────────────────────────── */}
      <section className="report-section">
        <div className="report-sec-header">
          <span className="sec-num">SECTION C</span>
          <h2 className="sec-title">Optimal Route Finding via Bellman-Ford</h2>
        </div>
        <p className="sec-intro">
          Bellman-Ford iteratively relaxes all edges in the graph for up to <strong>|V| - 1</strong> passes.
          Its time complexity is <strong>O(V · E)</strong> and space complexity is <strong>O(V)</strong>.
          It guarantees discovery of shortest paths or detection of negative-weight cycles.
        </p>

        <div className="report-box">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 12 }}>
            <div><strong>Total Graph Vertices (|V|):</strong> {locations.length}</div>
            <div><strong>Active Open Edges (|E|):</strong> {openRoads.length * 2} directed</div>
            <div><strong>Excluded Blocked Roads:</strong> {blockedRoads.length}</div>
          </div>
        </div>

        <table className="report-table">
          <thead>
            <tr>
              <th>Target Location</th>
              <th>Location Name</th>
              <th>Shortest Path from HQ</th>
              <th>Total Travel Cost</th>
              <th>Reachability Verdict</th>
            </tr>
          </thead>
          <tbody>
            {locations.filter(l => l.id !== 'HQ').map(loc => {
              const bf = bellmanFord(scenario.roads, locations.map(l => l.id), 'HQ', loc.id);
              return (
                <tr key={loc.id}>
                  <td><code>{loc.id}</code></td>
                  <td>{loc.name}</td>
                  <td>
                    {bf.found ? (
                      <span className="route-flow-text">{bf.path.join(' → ')}</span>
                    ) : (
                      <span className="text-danger">No path exists</span>
                    )}
                  </td>
                  <td>{bf.cost === Infinity ? '∞' : bf.cost}</td>
                  <td>
                    {bf.found
                      ? <span className="status-chip eligible">Reachable</span>
                      : <span className="status-chip unreachable">UNREACHABLE</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* ─── SECTION D: 0/1 KNAPSACK REPORT ──────────────────────────────── */}
      <section className="report-section">
        <div className="report-sec-header">
          <span className="sec-num">SECTION D</span>
          <h2 className="sec-title">Relief Package Allocation via 0/1 Knapsack</h2>
        </div>
        <p className="sec-intro">
          The 0/1 Knapsack algorithm maximizes relief support value while strictly adhering to truck fleet capacity
          <strong> W = {scenario.capacity}</strong>. Time and space complexity are <strong>O(N · W)</strong>.
        </p>

        <div className="report-box">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, fontSize: 12 }}>
            <div><strong>Fleet Capacity:</strong> {scenario.capacity} units</div>
            <div><strong>Allocated Weight:</strong> {knapData.used} units</div>
            <div><strong>Unused Capacity:</strong> {scenario.capacity - knapData.used} units</div>
            <div><strong>Optimal Support Value:</strong> {knapData.value} people</div>
          </div>
        </div>

        <table className="report-table">
          <thead>
            <tr>
              <th>Package ID</th>
              <th>Package Name</th>
              <th>Unit Weight</th>
              <th>Benefit (Value)</th>
              <th>Category</th>
              <th>Allocation Decision</th>
            </tr>
          </thead>
          <tbody>
            {scenario.packages.map(p => {
              const isChosen = knapData.chosen.some(c => c.id === p.id);
              return (
                <tr key={p.id}>
                  <td><code>{p.id}</code></td>
                  <td><strong>{p.name}</strong></td>
                  <td>{p.weight}</td>
                  <td>{p.value}</td>
                  <td>{p.category}</td>
                  <td>
                    {isChosen ? (
                      <span className="status-chip eligible">✓ ALLOCATED &amp; DISPATCHED</span>
                    ) : (
                      <span className="status-chip unreachable">RETAINED IN WAREHOUSE</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* ─── SECTION E: BACKTRACKING REPORT ──────────────────────────────── */}
      <section className="report-section">
        <div className="report-sec-header">
          <span className="sec-num">SECTION E</span>
          <h2 className="sec-title">Team Assignment via Backtracking</h2>
        </div>
        <p className="sec-intro">
          Backtracking searches the combinatorial state space of team assignments, verifying capability
          compatibility and team availability while pruning incompatible branches.
        </p>

        <div className="report-box">
          <h4 style={{ margin: '0 0 6px 0', fontSize: 13 }}>Constraints Enforced:</h4>
          <ul style={{ margin: 0, paddingLeft: 20, fontSize: 12, lineHeight: 1.6 }}>
            <li><strong>Availability:</strong> Unavailable teams are strictly rejected from initial tasks.</li>
            <li><strong>Capability Compatibility:</strong> Medical tasks require Medical capability; General tasks allow General teams.</li>
            <li><strong>Reachability:</strong> Dispatches are forbidden to incidents with severed road connections.</li>
            <li><strong>Dynamic Reuse:</strong> Once a task is completed, that team is freed and dynamically reassigned.</li>
          </ul>
        </div>

        <div className="report-trace-table">
          <div className="report-table-title">Execution State Decisions Log:</div>
          <div className="report-log-box">
            {plan.backtrackLogs.map((log, i) => (
              <div key={i} className="report-log-line">{log}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION F: EVENT TIMELINE ───────────────────────────────────── */}
      <section className="report-section">
        <div className="report-sec-header">
          <span className="sec-num">SECTION F</span>
          <h2 className="sec-title">Chronological Event Timeline &amp; Dynamic Team Reuse</h2>
        </div>
        <p className="sec-intro">
          Chronological simulation audit trail demonstrating discrete-event scheduling, task durations,
          and immediate team reuse upon rescue completion.
        </p>

        <div className="timeline-trail">
          {simState.events.map((ev, i) => (
            <div key={ev.id || i} className="timeline-node">
              <div className="timeline-time">T={ev.timestamp}m</div>
              <div className="timeline-dot" />
              <div className="timeline-content">
                <div className="timeline-type">{ev.type.toUpperCase()}</div>
                <div className="timeline-desc">{ev.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SECTION G: REAL-WORLD APPLICATION & LIMITATIONS ─────────────── */}
      <section className="report-section">
        <div className="report-sec-header">
          <span className="sec-num">SECTION G</span>
          <h2 className="sec-title">Real-World Disaster Response Applications &amp; System Limitations</h2>
        </div>

        <div className="report-box" style={{ background: 'var(--surface-sunken)', borderLeft: '4px solid var(--accent)' }}>
          <h4 style={{ margin: '0 0 6px 0', color: 'var(--accent)' }}>Educational Disclaimer</h4>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>
            This project is an academic simulation created for College Data Structures &amp; Algorithms (DAA) coursework.
            It illustrates how foundational computer science algorithms optimize triage, routing, resource loading,
            and personnel assignment. It is not a certified real-world emergency dispatch system.
          </p>
        </div>

        <div className="real-world-grid" style={{ marginTop: 14 }}>
          <div className="rw-card">
            <h4>Algorithm Operational Mapping</h4>
            <ul style={{ fontSize: 12, paddingLeft: 16, lineHeight: 1.6 }}>
              <li><strong>Merge Sort:</strong> Models hospital triage sorting under mass casualty conditions.</li>
              <li><strong>Bellman-Ford:</strong> Models dynamic road routing when disaster debris or washouts alter path costs.</li>
              <li><strong>0/1 Knapsack:</strong> Models cargo payload maximization under strict aviation or vehicular payload limits.</li>
              <li><strong>Backtracking:</strong> Models crew rostering and task matching under specialist certifications.</li>
            </ul>
          </div>
          <div className="rw-card">
            <h4>Real-World Deployment Requirements</h4>
            <ul style={{ fontSize: 12, paddingLeft: 16, lineHeight: 1.6 }}>
              <li>Integration with live GPS telematics and GIS road network databases.</li>
              <li>Continuous multi-commodity flow for perishable medical consumables.</li>
              <li>Stochastic travel time modeling under adverse weather and secondary hazards.</li>
              <li>Hierarchical multi-echelon supply depots with replenishment cycles.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Report Footer */}
      <div className="report-footer">
        <div>Generated by RescueGrid Disaster Simulation Engine · College DAA Project</div>
        <div style={{ color: 'var(--text-muted)' }}>All metrics and outputs derived from authoritative simulation execution state.</div>
      </div>
    </div>
  );
}
