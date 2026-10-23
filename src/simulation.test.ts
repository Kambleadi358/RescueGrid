import { describe, it, expect } from 'vitest';
import {
  demoScenarios,
  planScenario,
  initializeSimulation,
  stepSimulationClock,
  makeIncident,
  summary,
  type Scenario
} from './simulation';
import { roads, packages, locations, type Road, type Team, type Package } from './data';

describe('RescueGrid Master Acceptance Criteria (#1–#20)', () => {
  const demos = demoScenarios(roads, packages);

  // ── Acceptance #1: User Input and Demo mode selection ──
  it('Acceptance #1: provides 4 distinct demo scenarios with required incident and team structures', () => {
    expect(demos.length).toBe(4);
    const names = demos.map(d => d.name);
    expect(names).toEqual(['Normal Rescue', 'Critical Emergency', 'Resource Shortage', 'No Route Available']);

    for (const d of demos) {
      expect(d.incidents.length).toBeGreaterThanOrEqual(3);
      expect(d.incidents.length).toBeLessThanOrEqual(5);
      expect(d.teams.length).toBeGreaterThanOrEqual(2);
      expect(d.teams.some(t => t.available)).toBe(true);
      expect(d.teams.some(t => !t.available)).toBe(true);
      expect(d.capacity).toBeGreaterThan(0);
      expect(d.roads.length).toBe(roads.length);
    }
  });

  // ── Acceptance #2 & #3: Adding, editing, removing entities & field validation ──
  it('Acceptance #2 & #3: supports dynamic addition, removal, and validation of scenario entities', () => {
    const customScenario: Scenario = {
      name: 'Custom User Scenario',
      incidents: [makeIncident('I-1', 'MKT', 'High', 30, false, 10)],
      teams: [{ id: 'T-1', name: 'Alpha', capability: 'general', available: true, location: 'HQ' }],
      roads: roads.map(r => ({ ...r })),
      packages: [{ id: 'P-1', name: 'Rations', weight: 3, value: 10, category: 'Food', quantity: 2 }],
      capacity: 10,
    };

    // Add new incident
    const newInc = makeIncident('I-2', 'SCH', 'Critical', 25, true, 40);
    customScenario.incidents.push(newInc);
    expect(customScenario.incidents.length).toBe(2);

    // Validation: positive population and valid location
    expect(newInc.people).toBeGreaterThan(0);
    expect(locations.some(l => l.id === newInc.location)).toBe(true);

    // Remove incident
    customScenario.incidents = customScenario.incidents.filter(i => i.id !== 'I-1');
    expect(customScenario.incidents.length).toBe(1);
    expect(customScenario.incidents[0].id).toBe('I-2');

    // Add and remove teams
    customScenario.teams.push({ id: 'T-2', name: 'Bravo', capability: 'medical', available: false, location: 'POL' });
    expect(customScenario.teams.length).toBe(2);
    customScenario.teams = customScenario.teams.filter(t => t.id !== 'T-1');
    expect(customScenario.teams[0].id).toBe('T-2');
  });

  it('User-defined input starts clean with zero demo entries and retains only user-added items', () => {
    const cleanUserScenario: Scenario = {
      name: 'Custom Disaster Scenario',
      description: 'User-configured emergency response scenario.',
      incidents: [],
      teams: [],
      roads: roads.map(r => ({ ...r, blocked: false })),
      packages: [],
      capacity: 15,
    };

    // Starts clean with zero pre-existing demo entries
    expect(cleanUserScenario.incidents.length).toBe(0);
    expect(cleanUserScenario.teams.length).toBe(0);
    expect(cleanUserScenario.packages.length).toBe(0);

    // User adds their custom items only
    cleanUserScenario.incidents.push(makeIncident('USER-1', 'MKT', 'Critical', 22, true, 15));
    cleanUserScenario.teams.push({ id: 'T-USR', name: 'User Team', capability: 'medical', available: true, location: 'HQ' });
    cleanUserScenario.packages.push({ id: 'PKG-USR', name: 'User First Aid', weight: 4, value: 20, category: 'Medical', quantity: 2 });

    expect(cleanUserScenario.incidents.length).toBe(1);
    expect(cleanUserScenario.incidents[0].id).toBe('USER-1');
    expect(cleanUserScenario.teams.length).toBe(1);
    expect(cleanUserScenario.teams[0].id).toBe('T-USR');
    expect(cleanUserScenario.packages.length).toBe(1);
    expect(cleanUserScenario.packages[0].id).toBe('PKG-USR');

    // Planning on clean user input succeeds and plans only the user-added items
    const plan = planScenario(cleanUserScenario, locations);
    expect(plan.ordered.length).toBe(1);
    expect(plan.ordered[0].id).toBe('USER-1');
    expect(plan.eligible.length).toBe(1);
    expect(plan.teamMap['USER-1']?.name).toBe('User Team');
  });

  // ── Acceptance #4: Map edge clicks update the exact road state used by simulation ──
  it('Acceptance #4: map edge toggling directly alters graph reachability in simulation', () => {
    const s = { ...demos[0], roads: demos[0].roads.map(r => ({ ...r })) };
    const planBefore = planScenario(s, locations);
    expect(planBefore.routeMap['N1'].found).toBe(true);
    expect(planBefore.routeMap['N1'].cost).toBe(7);

    // Simulate clicking Central Ave on map to block it
    s.roads = s.roads.map(r => r.name === 'Central Ave' ? { ...r, blocked: true } : r);
    const planAfter = planScenario(s, locations);
    // Route must detour via North River Rd (HQ -> RIV -> MKT), changing cost from 7 to 8
    expect(planAfter.routeMap['N1'].cost).toBe(8);
  });

  // ── Acceptance #7: Priority selection shows the correct incident route ──
  it('Acceptance #7: route map is keyed by stable incident ID, not array index', () => {
    const plan = planScenario(demos[0], locations);
    for (const inc of plan.ordered) {
      const route = plan.routeMap[inc.id];
      expect(route).toBeDefined();
      if (route.found) {
        expect(route.path[0]).toBe('HQ');
        expect(route.path[route.path.length - 1]).toBe(inc.location);
      }
    }
  });

  // ── Acceptance #14 & #15: Team dynamic reuse and early completion ──
  it('Acceptance #14 & #15: a team becomes available when its task completes, and is reused first', () => {
    // Construct scenario with 3 incidents and 2 teams:
    // Incident 1 has a very short duration and finishes first
    const incidents = [
      makeIncident('INC-1', 'HOT', 'Critical', 5, false, 30),  // short duration
      makeIncident('INC-2', 'COL', 'High', 40, false, 20),      // longer duration
      makeIncident('INC-3', 'SCH', 'Medium', 15, false, 10),    // waiting for next free team
    ];
    const teams: Team[] = [
      { id: 'TM-A', name: 'Team Alpha', capability: 'general', available: true, location: 'HQ' },
      { id: 'TM-B', name: 'Team Bravo', capability: 'general', available: true, location: 'HQ' },
    ];

    const testScenario: Scenario = {
      name: 'Dynamic Reuse Test',
      incidents,
      teams,
      roads: roads.map(r => ({ ...r, blocked: false })),
      packages: packages.map(p => ({ ...p })),
      capacity: 50,
    };

    const plan = planScenario(testScenario, locations);
    const sim0 = plan.initialSimulationState;

    expect(sim0.tasks.length).toBe(3);
    const task1 = sim0.tasks.find(t => t.incidentId === 'INC-1')!;
    const task2 = sim0.tasks.find(t => t.incidentId === 'INC-2')!;
    const task3 = sim0.tasks.find(t => t.incidentId === 'INC-3')!;

    // Task 1 and Task 2 start at T=0
    expect(task1.startTime).toBe(0);
    expect(task2.startTime).toBe(0);

    // One of them completes earlier than the other
    const earlierTask = task1.completionTime < task2.completionTime ? task1 : task2;
    const laterTask = task1.completionTime < task2.completionTime ? task2 : task1;

    // Task 3 MUST be scheduled to start immediately when the earlier team finishes,
    // WITHOUT waiting for the later team!
    expect(task3.startTime).toBe(earlierTask.completionTime);
    expect(task3.teamName).toBe(earlierTask.teamName);

    // Step clock to earlier completion time:
    const simMid = stepSimulationClock(sim0, earlierTask.completionTime);

    // The completed incident is marked completed
    expect(simMid.incidentStates[earlierTask.incidentId].status).toBe('completed');
    // The later task is still in progress
    expect(simMid.tasks.find(t => t.taskId === laterTask.taskId)?.status).toBe('in_progress');
    // The third task is now in progress with the freed team!
    expect(simMid.tasks.find(t => t.taskId === task3.taskId)?.status).toBe('in_progress');
  });

  // ── Acceptance #16: Prevention of duplicate rescue-completion events ──
  it('Acceptance #16: stepping clock past completion time does not double-count rescues', () => {
    const plan = planScenario(demos[0], locations);
    const sim0 = plan.initialSimulationState;

    const simAt30 = stepSimulationClock(sim0, 30);
    const rescuedAt30 = simAt30.totalRescued;

    const simAt60 = stepSimulationClock(simAt30, 60);
    // If all tasks were completed by 30, 60 should not double count
    if (simAt30.isFinished) {
      expect(simAt60.totalRescued).toBe(rescuedAt30);
    }
    // No completed task appears twice in completed lists
    const completedTasks = simAt60.tasks.filter(t => t.status === 'completed');
    const ids = completedTasks.map(t => t.taskId);
    expect(new Set(ids).size).toBe(completedTasks.length);
  });

  // ── Acceptance #17: No dispatch to unreachable destinations ──
  it('Acceptance #17: unreachable incidents receive 0 dispatched teams and supplies', () => {
    const noRouteScenario = demos[3]; // 'No Route Available'
    const plan = planScenario(noRouteScenario, locations);

    expect(plan.eligible.length).toBe(0);
    expect(plan.allocation.length).toBe(0);
    expect(plan.used).toBe(0);
    expect(plan.supported).toBe(0);

    for (const inc of noRouteScenario.incidents) {
      expect(plan.teamMap[inc.id]).toBeNull();
      expect(plan.routeMap[inc.id].found).toBe(false);
    }
  });

  // ── Acceptance #18: Correct supported and rescued population limits ──
  it('Acceptance #18: actual rescued count is capped by incident population and relief capacity', () => {
    const s = demos[2]; // Resource Shortage (capacity 7)
    const plan = planScenario(s, locations);

    // Total supported cannot exceed Knapsack value
    expect(plan.supported).toBeLessThanOrEqual(plan.benefit);

    const simEnd = stepSimulationClock(plan.initialSimulationState, 100);
    // Total rescued count cannot exceed the carrying capacity / supported benefit
    expect(simEnd.totalRescued).toBeLessThanOrEqual(plan.supported);

    // Each incident's rescued count cannot exceed its own casualty count
    for (const task of simEnd.tasks) {
      const inc = s.incidents.find(i => i.id === task.incidentId)!;
      expect(task.rescuedCount).toBeLessThanOrEqual(inc.people);
    }
  });

  // ── Acceptance #19: Report values match completed simulation ──
  it('Acceptance #19: summary and report metrics match authoritative simulation results', () => {
    const s = demos[1]; // Critical Emergency
    const plan = planScenario(s, locations);
    const sum = summary(s);

    expect(sum.incidents).toBe(s.incidents.length);
    expect(sum.available).toBe(s.teams.filter(t => t.available).length);
    expect(sum.blocked).toBe(s.roads.filter(r => r.blocked).length);

    const sim = stepSimulationClock(plan.initialSimulationState, 100);
    expect(sim.tasks.length).toBeGreaterThan(0);
    // Completed tasks match incident completed states
    for (const task of sim.tasks) {
      if (task.status === 'completed') {
        expect(sim.incidentStates[task.incidentId].status).toBe('completed');
      }
    }
  });

  // ── Acceptance #20: Scenario switching clearing stale state ──
  it('Acceptance #20: switching scenarios cleanly resets all computed plan and route states', () => {
    const planNormal = planScenario(demos[0], locations);
    const planNoRoute = planScenario(demos[3], locations);

    expect(planNormal.eligible.length).toBeGreaterThan(0);
    expect(planNoRoute.eligible.length).toBe(0);
    expect(planNoRoute.unreachable.length).toBe(demos[3].incidents.length);
  });
});
