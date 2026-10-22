import React, { useState } from 'react';
import {
  Plus, Trash2, ArrowLeft, ArrowRight, RotateCcw, AlertTriangle,
  Users, Package as PackageIcon, Shield, MapPin, Eye, Check
} from 'lucide-react';
import type { Scenario } from '../simulation';
import type { Request, Team, Package, Road, Urgency, TeamCapability } from '../data';
import { locations } from '../data';
import { TownMap } from './TownMap';

interface ScenarioBuilderProps {
  scenario: Scenario;
  setScenario: React.Dispatch<React.SetStateAction<Scenario>>;
  onReview: () => void;
  onBackToMode: () => void;
  onResetToDefaults: () => void;
  zoom: number;
  offsetX: number;
  offsetY: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  setOffsetX: React.Dispatch<React.SetStateAction<number>>;
  setOffsetY: React.Dispatch<React.SetStateAction<number>>;
}

export function ScenarioBuilder({
  scenario,
  setScenario,
  onReview,
  onBackToMode,
  onResetToDefaults,
  zoom,
  offsetX,
  offsetY,
  setZoom,
  setOffsetX,
  setOffsetY,
}: ScenarioBuilderProps) {
  const [selectedRoadStatus, setSelectedRoadStatus] = useState<string | null>(null);

  // Form states for adding entities
  const [newInc, setNewInc] = useState<{
    name: string;
    location: string;
    urgency: Urgency;
    people: number;
    medical: boolean;
    waiting: number;
    capability: TeamCapability;
  }>({
    name: '',
    location: 'RIV',
    urgency: 'High',
    people: 20,
    medical: false,
    waiting: 15,
    capability: 'general',
  });

  const [newTeam, setNewTeam] = useState<{
    name: string;
    capability: TeamCapability;
    available: boolean;
    location: string;
  }>({
    name: '',
    capability: 'medical',
    available: true,
    location: 'HQ',
  });

  const [newPackage, setNewPackage] = useState<{
    name: string;
    weight: number;
    value: number;
    category: string;
    quantity: number;
  }>({
    name: '',
    weight: 4,
    value: 15,
    category: 'Medical',
    quantity: 1,
  });

  const [activeTab, setActiveTab] = useState<'incidents' | 'teams' | 'resources'>('incidents');

  // Toggle road handler
  const handleToggleRoad = (road: Road) => {
    setScenario(prev => {
      const nextRoads = prev.roads.map(r =>
        r.id === road.id || (r.a === road.a && r.b === road.b) ? { ...r, blocked: !r.blocked } : r
      );
      const isNowBlocked = !road.blocked;
      setSelectedRoadStatus(
        `Road "${road.name}" (${road.a} ↔ ${road.b}): ${isNowBlocked ? '🚫 BLOCKED' : '✓ OPEN'}`
      );
      return { ...prev, roads: nextRoads };
    });
  };

  // Add Incident
  const handleAddIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInc.name.trim() || newInc.people <= 0) return;
    const id = `INC-${Date.now().toString().slice(-4)}`;
    const created: Request = {
      id,
      name: newInc.name.trim(),
      location: newInc.location,
      urgency: newInc.urgency,
      people: Number(newInc.people),
      medical: newInc.medical,
      waiting: Number(newInc.waiting),
      travel: 0,
      needCapability: newInc.capability,
    };
    setScenario(prev => ({
      ...prev,
      incidents: [...prev.incidents, created],
    }));
    setNewInc({
      name: '',
      location: 'RIV',
      urgency: 'High',
      people: 20,
      medical: false,
      waiting: 15,
      capability: 'general',
    });
  };

  // Remove Incident
  const handleRemoveIncident = (id: string) => {
    if (scenario.incidents.length <= 1) {
      alert('Scenario must contain at least 1 incident.');
      return;
    }
    setScenario(prev => ({
      ...prev,
      incidents: prev.incidents.filter(x => x.id !== id),
    }));
  };

  // Add Team
  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeam.name.trim()) return;
    const id = `TM-${Date.now().toString().slice(-4)}`;
    const created: Team = {
      id,
      name: newTeam.name.trim(),
      capability: newTeam.capability,
      available: newTeam.available,
      location: newTeam.location,
    };
    setScenario(prev => ({
      ...prev,
      teams: [...prev.teams, created],
    }));
    setNewTeam({
      name: '',
      capability: 'medical',
      available: true,
      location: 'HQ',
    });
  };

  // Remove Team
  const handleRemoveTeam = (teamName: string) => {
    if (scenario.teams.length <= 1) {
      alert('Scenario must contain at least 1 team.');
      return;
    }
    setScenario(prev => ({
      ...prev,
      teams: prev.teams.filter(t => t.name !== teamName),
    }));
  };

  // Add Package
  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPackage.name.trim() || newPackage.weight <= 0 || newPackage.value <= 0) return;
    const id = `PK-${Date.now().toString().slice(-4)}`;
    const created: Package = {
      id,
      name: newPackage.name.trim(),
      weight: Number(newPackage.weight),
      value: Number(newPackage.value),
      category: newPackage.category,
      quantity: Math.max(1, Number(newPackage.quantity) || 1),
    };
    setScenario(prev => ({
      ...prev,
      packages: [...prev.packages, created],
    }));
    setNewPackage({
      name: '',
      weight: 4,
      value: 15,
      category: 'Medical',
      quantity: 1,
    });
  };

  // Remove Package
  const handleRemovePackage = (id: string) => {
    if (scenario.packages.length <= 1) {
      alert('Scenario must contain at least 1 resource package.');
      return;
    }
    setScenario(prev => ({
      ...prev,
      packages: prev.packages.filter(p => p.id !== id),
    }));
  };

  // Incident pins for map preview
  const incidentPins = scenario.incidents.map((inc, i) => ({
    id: inc.id,
    locationId: inc.location,
    urgency: inc.urgency,
    rank: i + 1,
  }));

  const blockedCount = scenario.roads.filter(r => r.blocked).length;

  return (
    <div className="builder-layout">
      {/* Header bar */}
      <div className="builder-header-bar">
        <div className="builder-title-group">
          <button className="btn-sm btn-ghost" onClick={onBackToMode}>
            <ArrowLeft size={14} /> Mode Selection
          </button>
          <h1 className="builder-main-title">Custom Scenario Builder</h1>
          <span className="builder-sub-badge">Interactive Map &amp; Resource Config</span>
        </div>
        <div className="builder-header-actions">
          <button className="btn-sm" onClick={onResetToDefaults} title="Reset to standard default scenario">
            <RotateCcw size={14} /> Reset Inputs
          </button>
          <button className="btn-primary btn-lg" onClick={onReview}>
            <Check size={16} /> Review Mission Scenario <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* Grid: Left is Form Controls, Right is Graphical Town Map */}
      <div className="builder-split-grid">
        {/* Left Side: Repeatable Tables & Inputs */}
        <div className="builder-form-panel">
          {/* Navigation Tabs */}
          <div className="builder-tabs">
            <button
              className={`builder-tab${activeTab === 'incidents' ? ' active' : ''}`}
              onClick={() => setActiveTab('incidents')}
            >
              <AlertTriangle size={15} /> Incidents ({scenario.incidents.length})
            </button>
            <button
              className={`builder-tab${activeTab === 'teams' ? ' active' : ''}`}
              onClick={() => setActiveTab('teams')}
            >
              <Users size={15} /> Teams ({scenario.teams.length})
            </button>
            <button
              className={`builder-tab${activeTab === 'resources' ? ' active' : ''}`}
              onClick={() => setActiveTab('resources')}
            >
              <PackageIcon size={15} /> Resources ({scenario.packages.length})
            </button>
          </div>

          {/* TAB 1: INCIDENTS */}
          {activeTab === 'incidents' && (
            <div className="builder-tab-content">
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Incidents Management</span>
                  <span className="panel-badge">{scenario.incidents.length} active</span>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Incident</th>
                      <th>Location</th>
                      <th>Urgency</th>
                      <th>People</th>
                      <th>Med</th>
                      <th>Capability</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenario.incidents.map((x, i) => (
                      <tr key={x.id}>
                        <td><strong>#{i + 1}</strong></td>
                        <td>{x.name ?? x.id}</td>
                        <td>{locations.find(l => l.id === x.location)?.shortName ?? x.location}</td>
                        <td><span className={`priority-badge ${x.urgency}`}>{x.urgency}</span></td>
                        <td>{x.people}</td>
                        <td>{x.medical ? '✓' : '—'}</td>
                        <td><span style={{ textTransform: 'capitalize' }}>{x.needCapability ?? 'general'}</span></td>
                        <td>
                          <button
                            className="btn-icon btn-danger-ghost"
                            onClick={() => handleRemoveIncident(x.id)}
                            title="Remove incident"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Incident Form */}
              <div className="card form-card">
                <div className="card-header">
                  <Plus size={14} /> <span className="card-title">Add New Incident</span>
                </div>
                <form onSubmit={handleAddIncident} className="builder-inline-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Incident Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Hospital Flood Rescue"
                        value={newInc.name}
                        onChange={e => setNewInc({ ...newInc, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Location Landmark</label>
                      <select
                        value={newInc.location}
                        onChange={e => setNewInc({ ...newInc, location: e.target.value })}
                      >
                        {locations.filter(l => l.id !== 'HQ').map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.shortName})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row three-col">
                    <div className="form-group">
                      <label>Urgency Level</label>
                      <select
                        value={newInc.urgency}
                        onChange={e => setNewInc({ ...newInc, urgency: e.target.value as Urgency })}
                      >
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Affected Population</label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={newInc.people}
                        onChange={e => setNewInc({ ...newInc, people: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Waiting Time (min)</label>
                      <input
                        type="number"
                        min="0"
                        max="180"
                        value={newInc.waiting}
                        onChange={e => setNewInc({ ...newInc, waiting: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Required Team Capability</label>
                      <select
                        value={newInc.capability}
                        onChange={e => setNewInc({ ...newInc, capability: e.target.value as TeamCapability })}
                      >
                        <option value="medical">Medical Rescue</option>
                        <option value="general">General Evacuation</option>
                        <option value="flood">Flood &amp; Water Response</option>
                      </select>
                    </div>
                    <div className="form-group checkbox-group" style={{ justifyContent: 'center' }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={newInc.medical}
                          onChange={e => setNewInc({ ...newInc, medical: e.target.checked })}
                        />
                        <span>Medical Emergency Flag</span>
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                    <Plus size={14} /> Add Incident
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: TEAMS */}
          {activeTab === 'teams' && (
            <div className="builder-tab-content">
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Rescue Teams</span>
                  <span className="panel-badge">{scenario.teams.filter(t => t.available).length} available</span>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Team Name</th>
                      <th>Capability</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Toggle</th>
                      <th>Action</th>
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
                        <td>
                          <button
                            className="btn-sm"
                            onClick={() => {
                              setScenario(prev => ({
                                ...prev,
                                teams: prev.teams.map(x => x.name === t.name ? { ...x, available: !x.available } : x),
                              }));
                            }}
                          >
                            Set {t.available ? 'Unavailable' : 'Available'}
                          </button>
                        </td>
                        <td>
                          <button
                            className="btn-icon btn-danger-ghost"
                            onClick={() => handleRemoveTeam(t.name)}
                            title="Remove team"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Team Form */}
              <div className="card form-card">
                <div className="card-header">
                  <Plus size={14} /> <span className="card-title">Add Rescue Team</span>
                </div>
                <form onSubmit={handleAddTeam} className="builder-inline-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Team Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Gamma Rapid Response"
                        value={newTeam.name}
                        onChange={e => setNewTeam({ ...newTeam, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Capability Specialty</label>
                      <select
                        value={newTeam.capability}
                        onChange={e => setNewTeam({ ...newTeam, capability: e.target.value as TeamCapability })}
                      >
                        <option value="medical">Medical</option>
                        <option value="general">General</option>
                        <option value="flood">Flood / Water</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Base Station</label>
                      <select
                        value={newTeam.location}
                        onChange={e => setNewTeam({ ...newTeam, location: e.target.value })}
                      >
                        <option value="HQ">Rescue HQ</option>
                        <option value="POL">Police Station</option>
                        <option value="WH">Warehouse</option>
                        <option value="COL">Medical College</option>
                      </select>
                    </div>
                    <div className="form-group checkbox-group" style={{ justifyContent: 'center' }}>
                      <label>
                        <input
                          type="checkbox"
                          checked={newTeam.available}
                          onChange={e => setNewTeam({ ...newTeam, available: e.target.checked })}
                        />
                        <span>Immediately Available for Dispatch</span>
                      </label>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                    <Plus size={14} /> Add Team
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 3: RESOURCES */}
          {activeTab === 'resources' && (
            <div className="builder-tab-content">
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Truck Carrying Capacity</span>
                </div>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Total Fleet Weight Capacity:</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={scenario.capacity}
                    onChange={e => setScenario({ ...scenario, capacity: Math.max(1, Number(e.target.value)) })}
                    style={{ width: 100, padding: '6px 10px' }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    (0/1 Knapsack algorithm strictly limits package selection to this total weight)
                  </span>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <span className="card-title">Resource Packages</span>
                  <span className="panel-badge">{scenario.packages.length} packages</span>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Package Name</th>
                      <th>Qty</th>
                      <th>Unit Weight</th>
                      <th>Benefit (Value)</th>
                      <th>Category</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenario.packages.map(p => (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td><span className="panel-badge">{p.quantity ?? 1}x</span></td>
                        <td>{p.weight} units</td>
                        <td>{p.value} supported</td>
                        <td><span className="status-chip eligible">{p.category}</span></td>
                        <td>
                          <button
                            className="btn-icon btn-danger-ghost"
                            onClick={() => handleRemovePackage(p.id)}
                            title="Remove package"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Package Form */}
              <div className="card form-card">
                <div className="card-header">
                  <Plus size={14} /> <span className="card-title">Add Resource Package</span>
                </div>
                <form onSubmit={handleAddPackage} className="builder-inline-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Package Name</label>
                      <input
                        type="text"
                        placeholder="e.g. High-Power Water Pumps"
                        value={newPackage.name}
                        onChange={e => setNewPackage({ ...newPackage, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <select
                        value={newPackage.category}
                        onChange={e => setNewPackage({ ...newPackage, category: e.target.value })}
                      >
                        <option value="Medical">Medical</option>
                        <option value="Water">Water / Rations</option>
                        <option value="Food">Food Supplies</option>
                        <option value="Shelter">Shelter &amp; Blankets</option>
                        <option value="Rescue">Rescue Equipment</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row three-col">
                    <div className="form-group">
                      <label>Available Quantity</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={newPackage.quantity}
                        onChange={e => setNewPackage({ ...newPackage, quantity: Math.max(1, Number(e.target.value)) })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Unit Weight</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={newPackage.weight}
                        onChange={e => setNewPackage({ ...newPackage, weight: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Benefit (per unit)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newPackage.value}
                        onChange={e => setNewPackage({ ...newPackage, value: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                    <Plus size={14} /> Add Package
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Map Preview with direct road clicks */}
        <div className="builder-map-panel">
          <div className="builder-map-header">
            <div>
              <div className="builder-map-title">Interactive Town Map Preview</div>
              <div className="builder-map-hint">
                Click any road on the map to block or reopen it. Blocked roads are marked in red with ✕.
              </div>
            </div>
            <span className="panel-badge danger">{blockedCount} Blocked</span>
          </div>

          {selectedRoadStatus && (
            <div className="builder-road-alert">
              <span>{selectedRoadStatus}</span>
            </div>
          )}

          <TownMap
            roads={scenario.roads}
            activePath={[]}
            incidentLocations={incidentPins}
            onRoadToggle={handleToggleRoad}
            zoom={zoom}
            offsetX={offsetX}
            offsetY={offsetY}
            setZoom={setZoom}
            setOffsetX={setOffsetX}
            setOffsetY={setOffsetY}
            instructionText="Click any road edge to block or reopen it."
          />
        </div>
      </div>
    </div>
  );
}
