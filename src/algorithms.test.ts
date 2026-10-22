import { describe, it, expect } from 'vitest';
import {
  bfs, dfs, dijkstra, mergeSort, mergeSortWithTrace, knapsack, assignTeams, bellmanFord, compareIncidents
} from './algorithms';
import { roads, requests, packages, locations, type Road, type Package } from './data';
import { demoScenarios, planScenario, summary, initializeSimulation, stepSimulationClock, makeIncident } from './simulation';

// ─── 1. Graph Algorithms (BFS, DFS, Dijkstra, Bellman-Ford) ───────────────────
describe('RescueGrid Graph Algorithms', () => {
  it('BFS reaches HQ to SHL via open roads', () => {
    const result = bfs(roads, 'HQ', 'SHL');
    expect(result.found).toBe(true);
    expect(result.path[0]).toBe('HQ');
    expect(result.path[result.path.length - 1]).toBe('SHL');
  });

  it('DFS explores all 13 nodes from HQ', () => {
    const result = dfs(roads, 'HQ');
    expect(result.reachable.length).toBe(13);
  });

  it('Dijkstra finds lowest cost path HQ → SHL', () => {
    const result = dijkstra(roads, 'HQ', 'SHL');
    expect(result.found).toBe(true);
    expect(result.cost).toBeGreaterThan(0);
    expect(result.cost).not.toBe(Infinity);
  });

  it('Bellman-Ford finds route from HQ to SHL', () => {
    const result = bellmanFord(roads, locations.map(x => x.id), 'HQ', 'SHL');
    expect(result.found).toBe(true);
    expect(result.path.length).toBeGreaterThan(1);
    expect(result.cost).toBeLessThan(Infinity);
  });

  it('Bellman-Ford relaxation trace matches final distances and path (Acceptance #9)', () => {
    const result = bellmanFord(roads, locations.map(x => x.id), 'HQ', 'SHL');
    expect(result.steps.length).toBeGreaterThan(0);

    // Verify step sequence records passes and edge checks
    const firstPassSteps = result.steps.filter(s => s.pass === 1);
    expect(firstPassSteps.length).toBeGreaterThan(0);

    // Final distance to SHL matches reconstructed path cost
    expect(result.dist['SHL']).toBe(result.cost);
  });

  it('reports UNREACHABLE when all exits from HQ are blocked (Acceptance #5, #17)', () => {
    const blockedRoads = roads.map(x => ({ ...x, blocked: x.a === 'HQ' || x.b === 'HQ' }));
    const result = bellmanFord(blockedRoads, locations.map(x => x.id), 'HQ', 'SHL');
    expect(result.found).toBe(false);
    expect(result.dist['SHL']).toBe(Infinity);
    expect(result.path).toEqual([]);
  });

  it('reopening a road recalculates routes and reachability (Acceptance #6)', () => {
    const blockedRoads = roads.map(x => ({ ...x, blocked: x.a === 'HQ' || x.b === 'HQ' }));
    const unreachableResult = bellmanFord(blockedRoads, locations.map(x => x.id), 'HQ', 'RIV');
    expect(unreachableResult.found).toBe(false);

    // Reopen North River Rd (HQ <-> RIV)
    const reopenedRoads = blockedRoads.map(r => r.name === 'North River Rd' ? { ...r, blocked: false } : r);
    const reachableResult = bellmanFord(reopenedRoads, locations.map(x => x.id), 'HQ', 'RIV');
    expect(reachableResult.found).toBe(true);
    expect(reachableResult.path).toEqual(['HQ', 'RIV']);
    expect(reachableResult.cost).toBe(5);
  });
});

// ─── 2. Merge Sort & Priority Ordering ────────────────────────────────────────
describe('Merge Sort Incident Prioritization (Acceptance #8)', () => {
  it('Merge Sort sorts requests in correct priority order', () => {
    const sorted = mergeSort([...requests]);
    expect(sorted.length).toBe(5);
    // Critical comes before High
    const criticals = sorted.filter(r => r.urgency === 'Critical');
    const highs = sorted.filter(r => r.urgency === 'High');
    expect(sorted.indexOf(criticals[0])).toBeLessThan(sorted.indexOf(highs[0]));
  });

  it('Merge Sort animation trace matches the actual sorted output', () => {
    const { sorted, treeNodes, steps } = mergeSortWithTrace([...requests]);
    const fastSorted = mergeSort([...requests]);
    expect(sorted.map(x => x.id)).toEqual(fastSorted.map(x => x.id));
    expect(treeNodes.length).toBeGreaterThan(0);
    expect(steps.length).toBeGreaterThan(0);

    // Has split, compare, and merge steps
    expect(steps.some(s => s.type === 'split')).toBe(true);
    expect(steps.some(s => s.type === 'compare')).toBe(true);
    expect(steps.some(s => s.type === 'merge_done')).toBe(true);
  });

  it('tie-breaking follows Urgency -> Medical -> People -> Waiting -> ID', () => {
    const incA = makeIncident('A1', 'MKT', 'Critical', 50, true, 30);
    const incB = makeIncident('B1', 'SCH', 'Critical', 20, true, 30);
    const cmp = compareIncidents(incA, incB);
    expect(cmp.before).toBe(true); // Greater population wins
    expect(cmp.reason).toContain('population');
  });
});

// ─── 3. 0/1 Knapsack Resource Allocation ──────────────────────────────────────
describe('0/1 Knapsack Resource Allocation (Acceptance #10, #11)', () => {
  it('Knapsack returns 0 value for empty items', () => {
    expect(knapsack([], 10).value).toBe(0);
  });

  it('Knapsack strictly respects capacity constraint', () => {
    const result = knapsack(packages, 15);
    expect(result.used).toBeLessThanOrEqual(15);
  });

  it('Knapsack DP table and selected items match optimal values', () => {
    const cap = 12;
    const result = knapsack(packages, cap);
    const totalChosenWeight = result.chosen.reduce((sum, p) => sum + p.weight, 0);
    const totalChosenValue = result.chosen.reduce((sum, p) => sum + p.value, 0);

    expect(result.used).toBe(totalChosenWeight);
    expect(result.value).toBe(totalChosenValue);
    expect(result.dp[packages.length][cap]).toBe(result.value);
    expect(result.steps.length).toBe(packages.length * (cap + 1));
  });

  it('never allocates more units than available inventory', () => {
    const singlePackage: Package[] = [
      { id: 'PK-X', name: 'Mega Kit', weight: 5, value: 50, category: 'Medical', quantity: 1 }
    ];
    const result = knapsack(singlePackage, 20);
    expect(result.chosen.length).toBe(1);
    expect(result.used).toBe(5);
  });
});

// ─── 4. Backtracking Team Assignment & State Space Tree ───────────────────────
describe('Backtracking Team Assignment (Acceptance #12, #13)', () => {
  it('assigns tasks to compatible available teams', () => {
    const result = assignTeams();
    expect(result.assignment).not.toBeNull();
    expect(result.assignment!.length).toBe(3);
    expect(result.treeNodes.length).toBeGreaterThan(1);
  });

  it('strictly rejects unavailable teams (Acceptance #13)', () => {
    const unavailableTeams = [
      { name: 'A', skills: ['medical'], available: false },
      { name: 'B', skills: ['general'], available: false },
    ];
    const tasks = [{ id: 'T1', need: 'medical' }];
    const result = assignTeams(unavailableTeams, tasks);
    expect(result.assignment).toBeNull();
    // Verify State Space Tree marks them as rejected
    expect(result.treeNodes.some(n => n.status === 'rejected' && n.reason.includes('unavailable'))).toBe(true);
  });

  it('State Space Tree traces pruning and backtracking decisions', () => {
    const teams = [
      { name: 'General Only', skills: ['general'], available: true },
    ];
    const tasks = [
      { id: 'T1', need: 'medical' }, // requires medical -> should be rejected/pruned
    ];
    const result = assignTeams(teams, tasks);
    expect(result.assignment).toBeNull();
    expect(result.treeNodes.some(n => n.status === 'rejected')).toBe(true);
  });
});
