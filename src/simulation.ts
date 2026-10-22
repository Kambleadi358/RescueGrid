import { bellmanFord, knapsack, mergeSort, assignTeams } from './algorithms';
import type { Location, Road, Package, Request, Team, Urgency, TeamCapability } from './data';

// ─── Scenario Types ───────────────────────────────────────────────────────────

export type Scenario = {
  name: string;
  description?: string;
  incidents: Request[];
  teams: Team[];
  roads: Road[];
  packages: Package[];
  capacity: number;
};

export type RouteInfo = {
  found: boolean;
  path: string[];
  cost: number;
};

// ─── Event-Driven Scheduling Types (Section 8: Team Reuse) ────────────────────

export type TaskStatus = 'waiting' | 'assigned' | 'in_progress' | 'completed' | 'unreachable' | 'blocked';

export type TeamLiveStatus = 'available' | 'assigned' | 'rescuing' | 'unavailable';

export type RescueTask = {
  taskId: string;
  incidentId: string;
  incidentName: string;
  teamId: string;
  teamName: string;
  locationId: string;
  people: number;
  rescuedCount: number;
  travelTime: number;
  rescueDuration: number;
  startTime: number;
  completionTime: number;
  status: TaskStatus;
};

export type SimulationEvent = {
  id: string;
  timestamp: number;
  type: 'dispatch' | 'arrival' | 'completed' | 'team_freed' | 'team_reassigned' | 'road_blocked' | 'unreachable';
  incidentId?: string;
  teamName?: string;
  description: string;
};

export type SimulationState = {
  currentTime: number;
  isFinished: boolean;
  tasks: RescueTask[];
  events: SimulationEvent[];
  teamStates: Record<string, { status: TeamLiveStatus; currentIncidentId?: string; completedCount: number }>;
  incidentStates: Record<string, { status: TaskStatus; assignedTeam?: string; rescuedCount: number }>;
  totalRescued: number;
};

export type PlanResult = {
  ordered: Request[];
  eligible: Request[];
  allocation: Package[];
  used: number;
  benefit: number;
  supported: number;
  unreachable: string[];
  routeMap: Record<string, RouteInfo>;
  teamMap: Record<string, Team | null>;
  backtrackLogs: string[];
  initialSimulationState: SimulationState;
};

// ─── Helper to construct incidents cleanly ───────────────────────────────────

export const makeIncident = (
  id: string,
  location: string,
  urgency: Urgency,
  people: number,
  medical: boolean,
  waiting: number,
  name?: string,
  needCapability?: TeamCapability
): Request => ({
  id,
  location,
  urgency,
  people,
  medical,
  waiting,
  travel: 0,
  name: name ?? id,
  needCapability: needCapability ?? (medical ? 'medical' : 'general'),
});

// ─── Demo Scenarios (Master Prompt Requirement #1) ────────────────────────────

export const demoScenarios = (base: Road[], items: Package[]): Scenario[] => [
  {
    name: 'Normal Rescue',
    description: 'Balanced scenario: all 3 incidents are reachable with open roads and sufficient medical and general teams.',
    incidents: [
      makeIncident('N1', 'MKT', 'High',     20, false, 25, 'Market Area Evacuation', 'general'),
      makeIncident('N2', 'SCH', 'Medium',   12, false, 15, 'School Safety Check', 'general'),
      makeIncident('N3', 'RIV', 'Critical',  8, true,  40, 'River Bank Flood Rescue', 'medical'),
    ],
    teams: [
      { id: 'TM-1', name: 'Alpha Medical', capability: 'medical', available: true,  location: 'HQ'  },
      { id: 'TM-2', name: 'Bravo General', capability: 'general', available: true,  location: 'POL' },
      { id: 'TM-3', name: 'Delta Flood',   capability: 'flood',   available: false, location: 'WH'  },
    ],
    roads: base.map(x => ({ ...x, blocked: false })),
    packages: items,
    capacity: 15,
  },
  {
    name: 'Critical Emergency',
    description: 'High-severity disaster: 4 severe incidents, high casualties, Society Bypass road blocked by debris.',
    incidents: [
      makeIncident('C1', 'RIV', 'Critical', 18, true,  55, 'River Bank Mass Casualty', 'medical'),
      makeIncident('C2', 'COL', 'Critical',  9, true,  35, 'Medical College Crisis', 'medical'),
      makeIncident('C3', 'MKT', 'High',     40, false, 20, 'Central Market Collapse', 'general'),
      makeIncident('C4', 'HOT', 'Medium',   12, false, 12, 'Hotel Evacuation', 'general'),
    ],
    teams: [
      { id: 'TM-1', name: 'Medic Alpha', capability: 'medical', available: true,  location: 'HQ'  },
      { id: 'TM-2', name: 'Evac Bravo',  capability: 'general', available: true,  location: 'POL' },
      { id: 'TM-3', name: 'Reserve Team', capability: 'general', available: false, location: 'HQ'  },
    ],
    roads: base.map(x => ({ ...x, blocked: (x.a === 'WH' && x.b === 'SOC') || (x.a === 'SOC' && x.b === 'WH') })),
    packages: items,
    capacity: 15,
  },
  {
    name: 'Resource Shortage',
    description: 'Severe supply bottleneck: strict truck carrying capacity of 7 units against high eligible demand.',
    incidents: [
      makeIncident('S1', 'SCH', 'Critical', 28, true,  30, 'School Medical Emergency', 'medical'),
      makeIncident('S2', 'SHL', 'High',     25, false, 20, 'Shelter Overflow', 'flood'),
      makeIncident('S3', 'SOC', 'Medium',   16, false, 10, 'Society Flooding', 'general'),
    ],
    teams: [
      { id: 'TM-1', name: 'Alpha',             capability: 'medical', available: true,  location: 'HQ'  },
      { id: 'TM-2', name: 'Unavailable Bravo', capability: 'general', available: false, location: 'POL' },
    ],
    roads: base.map(x => ({ ...x, blocked: (x.a === 'WH' && x.b === 'SOC') || (x.a === 'SOC' && x.b === 'WH') })),
    packages: items.slice(0, 3),
    capacity: 7,
  },
  {
    name: 'No Route Available',
    description: 'Catastrophic isolation: all roads leading out of HQ are completely blocked. Validates UNREACHABLE states.',
    incidents: [
      makeIncident('X1', 'SHL', 'Critical', 30, true,  60, 'Shelter Cut-Off', 'medical'),
      makeIncident('X2', 'SOC', 'High',     14, false, 35, 'Society Isolated', 'general'),
      makeIncident('X3', 'COL', 'Medium',   10, false, 15, 'College Unreachable', 'general'),
    ],
    teams: [
      { id: 'TM-1', name: 'Alpha Ready Squad',   capability: 'medical', available: true,  location: 'HQ' },
      { id: 'TM-2', name: 'Reserve Squad',       capability: 'general', available: false, location: 'HQ' },
    ],
    roads: base.map(x => ({ ...x, blocked: x.a === 'HQ' || x.b === 'HQ' })),
    packages: items,
    capacity: 15,
  },
];

// ─── Discrete Event Simulation Engine (Team Reuse & Scheduling) ───────────────

export function initializeSimulation(
  orderedIncidents: Request[],
  teams: Team[],
  routeMap: Record<string, RouteInfo>,
  maxSupportedCap: number
): SimulationState {
  const teamStates: Record<string, { status: TeamLiveStatus; currentIncidentId?: string; completedCount: number }> = {};
  for (const t of teams) {
    teamStates[t.name] = {
      status: t.available ? 'available' : 'unavailable',
      completedCount: 0,
    };
  }

  const incidentStates: Record<string, { status: TaskStatus; assignedTeam?: string; rescuedCount: number }> = {};
  for (const inc of orderedIncidents) {
    const isReachable = routeMap[inc.id]?.found ?? false;
    incidentStates[inc.id] = {
      status: isReachable ? 'waiting' : 'unreachable',
      rescuedCount: 0,
    };
  }

  const tasks: RescueTask[] = [];
  const events: SimulationEvent[] = [];

  // Generate the full chronological schedule including dynamic team reuse!
  // We model a discrete event simulation clock:
  let clock = 0;
  let eventSeq = 0;

  // Track availability time for each team
  const teamFreeAt: Record<string, number> = {};
  for (const t of teams) {
    teamFreeAt[t.name] = t.available ? 0 : Infinity;
  }

  const pendingIncidents = orderedIncidents.filter(i => routeMap[i.id]?.found);

  let remainingRelief = maxSupportedCap;

  // While there are pending incidents
  for (const inc of pendingIncidents) {
    const need = inc.needCapability ?? (inc.medical ? 'medical' : 'general');
    const route = routeMap[inc.id];
    const travelCost = route.cost === Infinity ? 10 : route.cost;
    const rescueWorkDuration = Math.max(5, Math.ceil(inc.people / 5) * 3);

    // Find the available compatible team that becomes free earliest
    let bestTeam: Team | null = null;
    let earliestTime = Infinity;

    for (const t of teams) {
      if (!t.available) continue;
      const isCompatible = t.capability === need || t.capability === 'general';
      if (isCompatible && teamFreeAt[t.name] < earliestTime) {
        earliestTime = teamFreeAt[t.name];
        bestTeam = t;
      }
    }

    if (bestTeam && earliestTime < Infinity) {
      const startTime = earliestTime;
      const completionTime = startTime + travelCost + rescueWorkDuration;
      const saved = Math.min(inc.people, remainingRelief);
      remainingRelief = Math.max(0, remainingRelief - saved);

      const task: RescueTask = {
        taskId: `TASK-${tasks.length + 1}`,
        incidentId: inc.id,
        incidentName: inc.name ?? inc.id,
        teamId: bestTeam.id,
        teamName: bestTeam.name,
        locationId: inc.location,
        people: inc.people,
        rescuedCount: saved,
        travelTime: travelCost,
        rescueDuration: rescueWorkDuration,
        startTime,
        completionTime,
        status: 'assigned',
      };
      tasks.push(task);

      // Log dispatch event
      events.push({
        id: `EV-${++eventSeq}`,
        timestamp: startTime,
        type: 'dispatch',
        incidentId: inc.id,
        teamName: bestTeam.name,
        description: startTime === 0
          ? `T=${startTime}m: Team "${bestTeam.name}" dispatched to [${inc.name ?? inc.id}] via ${route.path.join(' → ')}.`
          : `T=${startTime}m: Released Team "${bestTeam.name}" REASSIGNED to waiting incident [${inc.name ?? inc.id}].`,
      });

      // Log completion event
      events.push({
        id: `EV-${++eventSeq}`,
        timestamp: completionTime,
        type: 'completed',
        incidentId: inc.id,
        teamName: bestTeam.name,
        description: `T=${completionTime}m: Team "${bestTeam.name}" successfully completed rescue at [${inc.name ?? inc.id}] (${saved} rescued). Team released for next assignment!`,
      });

      // Update when team is free next
      teamFreeAt[bestTeam.name] = completionTime;
    } else {
      incidentStates[inc.id].status = 'blocked';
    }
  }

  // Sort events chronologically
  events.sort((a, b) => a.timestamp - b.timestamp);

  // Set initial state at T=0
  for (const task of tasks) {
    if (task.startTime === 0) {
      task.status = 'in_progress';
      incidentStates[task.incidentId] = {
        status: 'in_progress',
        assignedTeam: task.teamName,
        rescuedCount: 0,
      };
      teamStates[task.teamName] = {
        status: 'rescuing',
        currentIncidentId: task.incidentId,
        completedCount: 0,
      };
    } else {
      incidentStates[task.incidentId] = {
        status: 'waiting',
        assignedTeam: task.teamName,
        rescuedCount: 0,
      };
    }
  }

  return {
    currentTime: 0,
    isFinished: tasks.length === 0,
    tasks,
    events,
    teamStates,
    incidentStates,
    totalRescued: 0,
  };
}

// ─── Step simulation clock forward or to a specific time ──────────────────────

export function stepSimulationClock(prevState: SimulationState, targetTime: number): SimulationState {
  const nextTasks = prevState.tasks.map(t => {
    let nextStatus = t.status;
    if (targetTime >= t.completionTime) {
      nextStatus = 'completed' as TaskStatus;
    } else if (targetTime >= t.startTime) {
      nextStatus = 'in_progress' as TaskStatus;
    } else {
      nextStatus = 'assigned' as TaskStatus;
    }
    return { ...t, status: nextStatus };
  });

  const nextIncidentStates = { ...prevState.incidentStates };
  let totalRescued = 0;

  for (const t of nextTasks) {
    if (t.status === 'completed') {
      nextIncidentStates[t.incidentId] = {
        status: 'completed',
        assignedTeam: t.teamName,
        rescuedCount: t.rescuedCount,
      };
      totalRescued += t.rescuedCount;
    } else if (t.status === 'in_progress') {
      nextIncidentStates[t.incidentId] = {
        status: 'in_progress',
        assignedTeam: t.teamName,
        rescuedCount: 0,
      };
    } else {
      nextIncidentStates[t.incidentId] = {
        status: 'waiting',
        assignedTeam: t.teamName,
        rescuedCount: 0,
      };
    }
  }

  const nextTeamStates = { ...prevState.teamStates };
  for (const teamName of Object.keys(nextTeamStates)) {
    if (nextTeamStates[teamName].status === 'unavailable') continue;

    // Check if team has an active task right now
    const activeTask = nextTasks.find(t => t.teamName === teamName && t.status === 'in_progress');
    const completedTasksForTeam = nextTasks.filter(t => t.teamName === teamName && t.status === 'completed');

    if (activeTask) {
      nextTeamStates[teamName] = {
        status: 'rescuing',
        currentIncidentId: activeTask.incidentId,
        completedCount: completedTasksForTeam.length,
      };
    } else {
      nextTeamStates[teamName] = {
        status: 'available',
        currentIncidentId: undefined,
        completedCount: completedTasksForTeam.length,
      };
    }
  }

  const allCompleted = nextTasks.length > 0 && nextTasks.every(t => t.status === 'completed');

  return {
    ...prevState,
    currentTime: targetTime,
    tasks: nextTasks,
    teamStates: nextTeamStates,
    incidentStates: nextIncidentStates,
    totalRescued,
    isFinished: allCompleted,
  };
}

// ─── Main Planning Function ───────────────────────────────────────────────────

export function planScenario(s: Scenario, nodes: Location[]): PlanResult {
  const nodeIds = nodes.map(x => x.id);

  // 1. Merge Sort incident prioritization
  const ordered = mergeSort(s.incidents);

  // 2. Bellman-Ford reachability & routes for every incident
  const routeMap: Record<string, RouteInfo> = {};
  const reachableIds = new Set<string>();

  for (const incident of ordered) {
    const bf = bellmanFord(s.roads, nodeIds, 'HQ', incident.location);
    routeMap[incident.id] = { found: bf.found, path: bf.path, cost: bf.cost };
    if (bf.found) reachableIds.add(incident.id);
  }

  // 3. Backtracking initial team assignment
  const backtrackTeams = s.teams.map(t => ({
    name: t.name,
    skills: [t.capability],
    available: t.available,
  }));
  const backtrackTasks = ordered
    .filter(i => reachableIds.has(i.id))
    .map(i => ({ id: i.id, need: i.needCapability ?? (i.medical ? 'medical' : 'general') }));

  const btResult = assignTeams(backtrackTeams, backtrackTasks);
  const backtrackLogs = btResult.logs;

  const teamMap: Record<string, Team | null> = {};
  const assignedTeamNames = new Set<string>();

  for (const incident of ordered) {
    if (!reachableIds.has(incident.id)) {
      teamMap[incident.id] = null;
      continue;
    }
    const assignment = btResult.assignment?.find(a => a.includes(`→ ${incident.id}`));
    if (assignment) {
      const teamName = assignment.split(' → ')[0];
      const team = s.teams.find(t => t.name === teamName && t.available) ?? null;
      teamMap[incident.id] = team;
      if (team) assignedTeamNames.add(team.name);
    } else {
      const need = incident.needCapability ?? (incident.medical ? 'medical' : 'general');
      const team = s.teams.find(
        t => t.available && (t.capability === need || t.capability === 'general') && !assignedTeamNames.has(t.name)
      ) ?? null;
      teamMap[incident.id] = team;
      if (team) assignedTeamNames.add(team.name);
    }
  }

  // 4. Eligible = reachable + has assigned initial or reused team
  const eligible = ordered.filter(i => reachableIds.has(i.id) && teamMap[i.id] !== null);

  // 5. Knapsack resource allocation (if no eligible incidents, 0 supplies dispatched)
  if (!eligible.length) {
    const emptySimState = initializeSimulation(ordered, s.teams, routeMap, 0);
    return {
      ordered,
      eligible: [],
      allocation: [],
      used: 0,
      benefit: 0,
      supported: 0,
      unreachable: s.incidents.map(x => x.id),
      routeMap,
      teamMap,
      backtrackLogs,
      initialSimulationState: emptySimState,
    };
  }

  const k = knapsack(s.packages, s.capacity);
  const demand = eligible.reduce((n, i) => n + i.people, 0);
  const supported = Math.min(k.value, demand);

  const initialSimulationState = initializeSimulation(ordered, s.teams, routeMap, supported);

  return {
    ordered,
    eligible,
    allocation: k.chosen,
    used: k.used,
    benefit: k.value,
    supported,
    unreachable: s.incidents.filter(i => !reachableIds.has(i.id)).map(i => i.id),
    routeMap,
    teamMap,
    backtrackLogs,
    initialSimulationState,
  };
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export const summary = (s: Scenario) => ({
  incidents: s.incidents.length,
  teams: s.teams.length,
  available: s.teams.filter(t => t.available).length,
  unavailable: s.teams.filter(t => !t.available).length,
  people: s.incidents.reduce((n, i) => n + i.people, 0),
  blocked: s.roads.filter(r => r.blocked).length,
  packages: s.packages.length,
  capacity: s.capacity,
});
