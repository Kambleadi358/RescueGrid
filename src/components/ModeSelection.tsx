import React from 'react';
import { Sliders, Sparkles, Shield, ArrowRight, AlertTriangle, Users, Package } from 'lucide-react';
import type { Scenario } from '../simulation';

interface ModeSelectionProps {
  demos: Scenario[];
  onSelectDemo: (scenario: Scenario) => void;
  onSelectCustom: () => void;
}

export function ModeSelection({ demos, onSelectDemo, onSelectCustom }: ModeSelectionProps) {
  return (
    <div className="mode-selection-container">
      <div className="mode-hero">
        <div className="mode-badge">
          <Shield size={14} /> DAA Project Demonstration Platform
        </div>
        <h1 className="mode-title">
          RESCUE<span>GRID</span>
        </h1>
        <p className="mode-subtitle">
          Intelligent Disaster Response &amp; Relief Optimization Simulation System.
          Powered by Merge Sort, Bellman-Ford, 0/1 Knapsack, and Backtracking algorithms.
        </p>
      </div>

      <div className="mode-cards-grid">
        {/* Option A: User Input / Scenario Builder */}
        <div className="mode-card primary-mode" onClick={onSelectCustom}>
          <div className="mode-card-header">
            <div className="mode-icon-box custom">
              <Sliders size={28} />
            </div>
            <div>
              <span className="mode-pill custom">Option A · Full Control</span>
              <h2 className="mode-card-title">User Input Scenario Builder</h2>
            </div>
          </div>
          <p className="mode-card-desc">
            Build your custom disaster scenario from scratch. Add and remove incidents,
            deploy custom rescue teams, define relief resource packages, set truck capacities,
            and click roads on the interactive town map to simulate blockages.
          </p>

          <div className="mode-features-list">
            <div className="mode-feature-item">
              <AlertTriangle size={14} className="feature-icon" />
              <span>Add, edit, remove incidents with custom urgency &amp; population</span>
            </div>
            <div className="mode-feature-item">
              <Users size={14} className="feature-icon" />
              <span>Configure team availability &amp; capabilities (Medical, General, Flood)</span>
            </div>
            <div className="mode-feature-item">
              <Package size={14} className="feature-icon" />
              <span>Customize relief packages &amp; carrying capacity</span>
            </div>
          </div>

          <button className="btn-primary btn-lg mode-action-btn">
            Build Custom Scenario <ArrowRight size={16} />
          </button>
        </div>

        {/* Option B: Predefined Demos */}
        <div className="mode-card demo-mode">
          <div className="mode-card-header">
            <div className="mode-icon-box demo">
              <Sparkles size={28} />
            </div>
            <div>
              <span className="mode-pill demo">Option B · Instant Scenarios</span>
              <h2 className="mode-card-title">Predefined Demo Scenarios</h2>
            </div>
          </div>
          <p className="mode-card-desc">
            Select one of 4 curated disaster scenarios engineered to demonstrate
            specific algorithm behaviors, boundary conditions, and team reuse:
          </p>

          <div className="demo-cards-stack">
            {demos.map((d, idx) => (
              <div
                key={d.name}
                className="demo-choice-card"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectDemo(d);
                }}
              >
                <div className="demo-choice-num">0{idx + 1}</div>
                <div className="demo-choice-info">
                  <div className="demo-choice-title">{d.name}</div>
                  <div className="demo-choice-desc">{d.description}</div>
                  <div className="demo-choice-meta">
                    <span>{d.incidents.length} Incidents</span>
                    <span>·</span>
                    <span>{d.teams.filter(t => t.available).length} Teams Free</span>
                    <span>·</span>
                    <span>Cap {d.capacity}</span>
                  </div>
                </div>
                <button className="btn-sm btn-ghost demo-launch-btn">
                  Launch <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
