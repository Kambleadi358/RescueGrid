# RescueGrid — Disaster Relief Decision Simulation

## Overview

RescueGrid is a local educational simulation for a Third-Year B.Tech Design and Analysis of Algorithms project. It models a fictional town with rescue incidents, road closures, available teams and a capacity-limited relief vehicle. It is not a live emergency system and must never be used for operational safety decisions.

## Technology stack

- **React + TypeScript + Vite:** browser-based interface and scenario state.
- **CSS + SVG:** responsive named-location mesh map with curved roads; no paid maps, API keys, or external tiles.
- **Vitest:** unit tests for key algorithm behaviour.
- **C++17:** separate, compilable DAA demonstrations in `cpp/`.

## Application flow

1. Select a one-click demo case, or enter an incident, road closures, capacity and teams manually.
2. Click roads in the map to toggle open/blocked status. A blocked road is red and omitted from routing.
3. Run the simulation.
4. The left screen presents the map, selected path and Bellman–Ford relaxation log.
5. The right screen presents the Merge Sort priority queue, team/backtracking status and proposed 0/1 Knapsack supply load.

## Demonstration cases

| Case | Purpose | Expected learning point |
|---|---|---|
| Normal | Reachable market evacuation | Normal route and allocation |
| Critical | Medical incident near River Bank | Critical request is prioritized |
| Easy | Small garden-support incident | Simple short scenario |
| No route | Shelter isolated by road closures | Honest unreachable-route output |

## Algorithms and output

### Merge Sort — rescue priority

Incidents are ordered by urgency, medical indicator, people affected and waiting time. The configured priority rule decides the ordering; Merge Sort only performs the stable efficient ordering. Complexity: **O(R log R)** time and **O(R)** auxiliary space.

### Bellman–Ford — route planning

The route module relaxes every open directed road edge over up to `V - 1` passes. Its log states the edge, prior distance, candidate distance and whether it improved the route. Complexity: **O(VE)**. The local simulation allows only nonnegative travel costs, although Bellman–Ford also supports negative edges in general.

### 0/1 Knapsack — proposed supply load

Each package copy is either loaded once or skipped. The model maximizes estimated people supported while respecting integer vehicle capacity. It produces a **proposed** one-vehicle load rather than asserting supplies have already reached every location. Complexity: **O(NW)** time and space; pseudo-polynomial in capacity `W`.

### Backtracking — team compatibility

The team demonstration checks availability, one-team-per-incident and capability constraints. It tries a tentative choice, rejects incompatible choices and undoes a choice when a later incident cannot be assigned. Worst-case runtime is exponential, so instances stay deliberately small.

## Map model

The map is an editable fictional mesh, not satellite imagery. Named locations include Rescue Operations Office, River Bank, Central Market, Government Medical College, Municipal School, Riverside Hotel, City Mall, Railway Station, Greenview Society, Central Garden, Public Relief Shelter, Flood Relief Warehouse and Police Station. Curved SVG roads are linked directly to graph edges and appear as red dashed lines with a `BLOCKED` label when closed.

## Novelty and educational value

- One source of truth connects visible roads, graph weights and all route calculations.
- The application combines four distinct DAA strategies in one scenario rather than showing isolated console examples.
- Demo cases make edge cases immediately repeatable for a viva: normal, critical, easy and impossible.
- Outputs distinguish calculation from real-world action: a supply plan is a proposed load, and a simulated route is not emergency advice.

## Possible applications

The concepts apply to logistics training, campus evacuation exercises, humanitarian planning education, hospital supply exercises and classroom demonstrations of algorithm trade-offs. Real deployments require validated mapping, trained operators, safety policy, real-time telemetry, privacy controls and domain approval.

## Run and verify

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd test
npm.cmd run build
g++ -std=c++17 cpp/rescuegrid.cpp -o rescuegrid.exe
.\rescuegrid.exe
```

## Limitations

The town, people counts, road costs and resources are fictional. This project has no live GPS, routing service, backend, communication link, authentication, fairness optimizer or operational certification.
