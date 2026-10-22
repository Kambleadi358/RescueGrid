import React from 'react';
import { ArrowLeft, Truck, AlertTriangle, Users, Package as PackageIcon, Activity, Check } from 'lucide-react';
import type { Scenario } from '../simulation';
import { locations } from '../data';

interface ReviewMissionProps {
  scenario: Scenario;
  onBackToEdit: () => void;
  onConfirmLaunch: () => void;
}

export function ReviewMission({ scenario, onBackToEdit, onConfirmLaunch }: ReviewMissionProps) {
  const totalPopulation = scenario.incidents.reduce((s, i) => s + i.people, 0);
  const availableTeams = scenario.teams.filter(t => t.available);
  const unavailableTeams = scenario.teams.filter(t => !t.available);
  const blockedRoads = scenario.roads.filter(r => r.blocked);
  const totalResourceWeight = scenario.packages.reduce((s, p) => s + p.weight, 0);

  return (
    <div className="review-view">
      <div className="review-header">
        <div>
          <div className="review-title">🛡 Mission Verification &amp; Review</div>
          <div className="review-sub">
            Review all dynamic parameters configured for <strong>{scenario.name}</strong> before initiating the algorithms.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-lg" onClick={onBackToEdit}>
            <ArrowLeft size={15} /> Back to Edit
          </button>
          <button className="btn-success btn-lg" onClick={onConfirmLaunch}>
            <Truck size={15} /> Confirm &amp; Launch Simulation
          </button>
        </div>
      </div>

      {/* Dynamic Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="value">{scenario.incidents.length}</div>
          <div className="label">Incidents Configured</div>
        </div>
        <div className="metric-card">
          <div className="value">{totalPopulation}</div>
          <div className="label">Total Affected People</div>
        </div>
        <div className="metric-card">
          <div className="value" style={{ color: 'var(--success)' }}>{availableTeams.length}</div>
          <div className="label">Teams Available</div>
        </div>
        <div className="metric-card">
          <div className="value" style={{ color: 'var(--danger)' }}>{unavailableTeams.length}</div>
          <div className="label">Teams Unavailable</div>
        </div>
        <div className="metric-card">
          <div className="value" style={{ color: blockedRoads.length > 0 ? 'var(--danger)' : 'var(--success)' }}>
            {blockedRoads.length}
          </div>
          <div className="label">Blocked Roads</div>
        </div>
        <div className="metric-card">
          <div className="value">{scenario.capacity}</div>
          <div className="label">Fleet Capacity ({scenario.packages.length} Packages)</div>
        </div>
      </div>

      {/* Detail Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Incidents Table */}
        <div className="card">
          <div className="card-header">
            <AlertTriangle size={15} />
            <span className="card-title">Incidents ({scenario.incidents.length})</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Location</th>
                <th>Urgency</th>
                <th>People</th>
                <th>Medical</th>
              </tr>
            </thead>
            <tbody>
              {scenario.incidents.map(inc => (
                <tr key={inc.id}>
                  <td><code>{inc.id}</code></td>
                  <td><strong>{inc.name ?? inc.id}</strong></td>
                  <td>{locations.find(l => l.id === inc.location)?.shortName ?? inc.location}</td>
                  <td><span className={`priority-badge ${inc.urgency}`}>{inc.urgency}</span></td>
                  <td>{inc.people}</td>
                  <td>{inc.medical ? '✓' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Teams Table */}
        <div className="card">
          <div className="card-header">
            <Users size={15} />
            <span className="card-title">Rescue Teams ({scenario.teams.length})</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Capability</th>
                <th>Location</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {scenario.teams.map(t => (
                <tr key={t.name}>
                  <td><strong>{t.name}</strong></td>
                  <td style={{ textTransform: 'capitalize' }}>{t.capability}</td>
                  <td>{t.location}</td>
                  <td>
                    <span className={`status-chip ${t.available ? 'eligible' : 'unreachable'}`}>
                      {t.available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Blocked Roads List */}
        <div className="card">
          <div className="card-header">
            <Activity size={15} />
            <span className="card-title">Blocked Roads ({blockedRoads.length})</span>
          </div>
          <div className="card-body">
            {blockedRoads.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                All roads are open. No blocked segments detected in this scenario.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {blockedRoads.map(r => (
                  <div key={r.id || r.a + r.b} className="resource-row">
                    <span style={{ color: 'var(--danger)' }}>🚫</span>
                    <span><strong>{r.name}</strong> ({r.a} ↔ {r.b})</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)' }}>Cost: {r.cost}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Resource Packages Table */}
        <div className="card">
          <div className="card-header">
            <PackageIcon size={15} />
            <span className="card-title">Resource Packages ({scenario.packages.length})</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Qty</th>
                <th>Unit Wt</th>
                <th>Total Wt</th>
                <th>Benefit</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {scenario.packages.map(p => {
                const qty = p.quantity ?? 1;
                return (
                  <tr key={p.id}>
                    <td><strong>{p.name}</strong></td>
                    <td><span className="panel-badge">{qty}x</span></td>
                    <td>{p.weight}</td>
                    <td>{p.weight * qty}</td>
                    <td>{p.value * qty}</td>
                    <td><span className="status-chip eligible">{p.category}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
