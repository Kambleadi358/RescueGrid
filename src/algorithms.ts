import type { Road, Request, Package, Team } from './data';

// ─── Graph Builder ────────────────────────────────────────────────────────────

export function buildGraph(roads: Road[]): Record<string, { id: string; cost: number; roadId: string }[]> {
  const g: Record<string, { id: string; cost: number; roadId: string }[]> = {};
  roads
    .filter(r => !r.blocked)
    .forEach(r => {
      (g[r.a] ??= []).push({ id: r.b, cost: r.cost, roadId: r.id });
      (g[r.b] ??= []).push({ id: r.a, cost: r.cost, roadId: r.id });
    });
  return g;
}

// ─── Path Reconstruction ──────────────────────────────────────────────────────

function reconstructPath(
  src: string,
  dst: string | undefined,
  parent: Record<string, string>,
  seen: Set<string>,
  order: string[],
  cost: number
) {
  let path: string[] = [];
  if (dst && seen.has(dst)) {
    for (let n: string | undefined = dst; n; n = parent[n]) path.unshift(n);
    if (path[0] !== src) path = [];
  }
  return { order, reachable: [...seen], path, cost, found: !dst || path.length > 0 };
}

function pathDistance(
  roads: Road[],
  src: string,
  dst: string | undefined,
  parent: Record<string, string>
): number {
  if (!dst) return 0;
  let total = 0;
  for (let n: string | undefined = dst; n && n !== src; n = parent[n]) {
    const p = parent[n];
    if (!p) return Infinity;
    total += roads.find(r => (r.a === p && r.b === n) || (r.a === n && r.b === p))?.cost ?? Infinity;
  }
  return total;
}

// ─── BFS ──────────────────────────────────────────────────────────────────────

export function bfs(roads: Road[], src: string, dst?: string) {
  const g = buildGraph(roads);
  const q = [src];
  const seen = new Set(q);
  const parent: Record<string, string> = {};
  const order: string[] = [];

  while (q.length) {
    const u = q.shift()!;
    order.push(u);
    if (u === dst) break;
    for (const e of g[u] ?? []) {
      if (!seen.has(e.id)) {
        seen.add(e.id);
        parent[e.id] = u;
        q.push(e.id);
      }
    }
  }
  return reconstructPath(src, dst, parent, seen, order, pathDistance(roads, src, dst, parent));
}

// ─── DFS ──────────────────────────────────────────────────────────────────────

export function dfs(roads: Road[], src: string, dst?: string) {
  const g = buildGraph(roads);
  const seen = new Set<string>();
  const order: string[] = [];
  const parent: Record<string, string> = {};

  const visit = (u: string): boolean => {
    seen.add(u);
    order.push(u);
    if (u === dst) return true;
    for (const e of g[u] ?? []) {
      if (!seen.has(e.id)) {
        parent[e.id] = u;
        if (visit(e.id)) return true;
      }
    }
    return false;
  };

  visit(src);
  return reconstructPath(src, dst, parent, seen, order, pathDistance(roads, src, dst, parent));
}

// ─── Dijkstra ────────────────────────────────────────────────────────────────

export function dijkstra(roads: Road[], src: string, dst: string) {
  const g = buildGraph(roads);
  const dist: Record<string, number> = { [src]: 0 };
  const parent: Record<string, string> = {};
  const visited: string[] = [];
  const todo = new Set(Object.keys(g));
  todo.add(src);

  while (todo.size) {
    let u: string | undefined;
    for (const n of todo) {
      if (dist[n] !== undefined && (!u || dist[n] < dist[u])) u = n;
    }
    if (!u) break;
    todo.delete(u);
    visited.push(u);
    for (const e of g[u] ?? []) {
      if (todo.has(e.id) && (dist[e.id] === undefined || dist[u] + e.cost < dist[e.id])) {
        dist[e.id] = dist[u] + e.cost;
        parent[e.id] = u;
      }
    }
  }
  return reconstructPath(src, dst, parent, new Set(Object.keys(dist)), visited, dist[dst] ?? Infinity);
}

// ─── Bellman-Ford ─────────────────────────────────────────────────────────────
// Complexity: O(V·E)
// Relaxation: If dist[u] + cost < dist[v] then dist[v] = dist[u] + cost, parent[v] = u

export type BFStep = {
  pass: number;
  from: string;
  to: string;
  cost: number;
  old: number;
  candidate: number;
  changed: boolean;
  distSnapshot: Record<string, number>;
  parentSnapshot: Record<string, string>;
  description: string;
};

export type BFResult = {
  order: string[];
  reachable: string[];
  path: string[];
  cost: number;
  found: boolean;
  steps: BFStep[];
  dist: Record<string, number>;
  parent: Record<string, string>;
  negativeCycle: boolean;
  passesCount: number;
};

export function bellmanFord(roads: Road[], nodes: string[], src: string, dst: string): BFResult {
  const edges = roads
    .filter(r => !r.blocked)
    .flatMap(r => [
      { from: r.a, to: r.b, cost: r.cost, roadId: r.id },
      { from: r.b, to: r.a, cost: r.cost, roadId: r.id },
    ]);

  const dist: Record<string, number> = {};
  const parent: Record<string, string> = {};
  const steps: BFStep[] = [];

  nodes.forEach(n => (dist[n] = Infinity));
  dist[src] = 0;

  let passesCount = 0;

  for (let pass = 1; pass < nodes.length; pass++) {
    passesCount = pass;
    let changed = false;
    for (const e of edges) {
      if (dist[e.from] === Infinity) {
        steps.push({
          pass,
          from: e.from,
          to: e.to,
          cost: e.cost,
          old: dist[e.to],
          candidate: Infinity,
          changed: false,
          distSnapshot: { ...dist },
          parentSnapshot: { ...parent },
          description: `Pass ${pass}: Edge ${e.from} → ${e.to} skipped because dist[${e.from}] = ∞`,
        });
        continue;
      }

      const old = dist[e.to];
      const candidate = dist[e.from] + e.cost;
      const improved = candidate < old;

      if (improved) {
        dist[e.to] = candidate;
        parent[e.to] = e.from;
        changed = true;
      }

      steps.push({
        pass,
        from: e.from,
        to: e.to,
        cost: e.cost,
        old,
        candidate,
        changed: improved,
        distSnapshot: { ...dist },
        parentSnapshot: { ...parent },
        description: improved
          ? `Pass ${pass}: Relaxed ${e.from} → ${e.to}: dist[${e.to}] improved from ${old === Infinity ? '∞' : old} to ${candidate}`
          : `Pass ${pass}: Checked ${e.from} → ${e.to}: candidate ${candidate} ≥ current ${old === Infinity ? '∞' : old} (no update)`,
      });
    }
    if (!changed) break;
  }

  const negativeCycle = edges.some(e => dist[e.from] !== Infinity && dist[e.from] + e.cost < dist[e.to]);
  const reached = new Set(nodes.filter(n => dist[n] < Infinity));
  const base = reconstructPath(src, dst, parent, reached, steps.map(s => s.to), dist[dst]);

  return {
    ...base,
    steps,
    dist,
    parent,
    negativeCycle,
    passesCount,
  };
}

// ─── Merge Sort ───────────────────────────────────────────────────────────────
// Complexity: O(R log R) where R = number of incidents
// Priority policy:
//   1. Urgency level (Critical > High > Medium > Low)
//   2. Medical emergency (true > false)
//   3. Affected population (higher > lower)
//   4. Waiting time (higher > lower)
//   5. Stable ID for deterministic tie-breaking

export const urgencyRank: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };

export function compareIncidents(x: Request, y: Request): { before: boolean; reason: string } {
  if (urgencyRank[x.urgency] !== urgencyRank[y.urgency]) {
    const before = urgencyRank[x.urgency] < urgencyRank[y.urgency];
    return {
      before,
      reason: `${before ? x.urgency : y.urgency} urgency prioritizes higher than ${before ? y.urgency : x.urgency}`,
    };
  }
  if (x.medical !== y.medical) {
    const before = x.medical ? true : false;
    return {
      before,
      reason: `Medical emergency prioritized over non-medical`,
    };
  }
  if (x.people !== y.people) {
    const before = x.people > y.people;
    return {
      before,
      reason: `Greater affected population (${x.people} vs ${y.people})`,
    };
  }
  if (x.waiting !== y.waiting) {
    const before = x.waiting > y.waiting;
    return {
      before,
      reason: `Longer waiting time (${x.waiting}m vs ${y.waiting}m)`,
    };
  }
  return {
    before: x.id < y.id,
    reason: `Deterministic tie-break by Incident ID (${x.id} vs ${y.id})`,
  };
}

export function incidentBefore(x: Request, y: Request): boolean {
  return compareIncidents(x, y).before;
}

export function mergeSort(items: Request[]): Request[] {
  if (items.length < 2) return items.slice();
  const m = Math.floor(items.length / 2);
  const a = mergeSort(items.slice(0, m));
  const b = mergeSort(items.slice(m));
  let i = 0, j = 0;
  const out: Request[] = [];
  while (i < a.length && j < b.length) {
    out.push(incidentBefore(a[i], b[j]) ? a[i++] : b[j++]);
  }
  return out.concat(a.slice(i), b.slice(j));
}

// Merge Sort with Full Tree Trace for step-by-step animation
export type MergeSortTreeNode = {
  id: string;
  items: Request[];
  depth: number;
  type: 'split' | 'base' | 'merged';
  leftChildId?: string;
  rightChildId?: string;
  parentId?: string;
};

export type MergeSortTraceStep = {
  stepIndex: number;
  type: 'split' | 'base' | 'compare' | 'merge_item' | 'merge_done';
  description: string;
  comparing?: { a: Request; b: Request; winner: Request; reason: string };
  currentArray: Request[];
  leftArray?: Request[];
  rightArray?: Request[];
  nodeId?: string;
};

export function mergeSortWithTrace(items: Request[]): {
  sorted: Request[];
  treeNodes: MergeSortTreeNode[];
  steps: MergeSortTraceStep[];
} {
  const treeNodes: MergeSortTreeNode[] = [];
  const steps: MergeSortTraceStep[] = [];
  let nodeCounter = 0;
  let stepIndex = 0;

  function sort(arr: Request[], depth: number, parentId?: string): { result: Request[]; nodeId: string } {
    const nodeId = `node-${++nodeCounter}`;
    if (arr.length <= 1) {
      const node: MergeSortTreeNode = {
        id: nodeId,
        items: arr,
        depth,
        type: 'base',
        parentId,
      };
      treeNodes.push(node);
      steps.push({
        stepIndex: ++stepIndex,
        type: 'base',
        description: arr.length === 1
          ? `Base case reached: [${arr[0].name ?? arr[0].id}] is trivially sorted.`
          : `Base case reached: empty list.`,
        currentArray: arr,
        nodeId,
      });
      return { result: arr.slice(), nodeId };
    }

    const mid = Math.floor(arr.length / 2);
    const leftSlice = arr.slice(0, mid);
    const rightSlice = arr.slice(mid);

    const splitNode: MergeSortTreeNode = {
      id: nodeId,
      items: arr,
      depth,
      type: 'split',
      parentId,
    };
    treeNodes.push(splitNode);

    steps.push({
      stepIndex: ++stepIndex,
      type: 'split',
      description: `Divide: Splitting array of ${arr.length} incidents into left (${leftSlice.length}) and right (${rightSlice.length}) halves.`,
      currentArray: arr,
      leftArray: leftSlice,
      rightArray: rightSlice,
      nodeId,
    });

    const left = sort(leftSlice, depth + 1, nodeId);
    const right = sort(rightSlice, depth + 1, nodeId);

    splitNode.leftChildId = left.nodeId;
    splitNode.rightChildId = right.nodeId;

    // Merge step
    let i = 0, j = 0;
    const merged: Request[] = [];

    while (i < left.result.length && j < right.result.length) {
      const cmp = compareIncidents(left.result[i], right.result[j]);
      const winner = cmp.before ? left.result[i] : right.result[j];

      steps.push({
        stepIndex: ++stepIndex,
        type: 'compare',
        description: `Compare: ${left.result[i].id} vs ${right.result[j].id} → ${winner.id} prioritized (${cmp.reason}).`,
        comparing: {
          a: left.result[i],
          b: right.result[j],
          winner,
          reason: cmp.reason,
        },
        currentArray: [...merged],
        leftArray: left.result.slice(i),
        rightArray: right.result.slice(j),
        nodeId,
      });

      if (cmp.before) {
        merged.push(left.result[i++]);
      } else {
        merged.push(right.result[j++]);
      }
    }

    while (i < left.result.length) merged.push(left.result[i++]);
    while (j < right.result.length) merged.push(right.result[j++]);

    steps.push({
      stepIndex: ++stepIndex,
      type: 'merge_done',
      description: `Merged: [${merged.map(x => x.id).join(', ')}] sorted for this subtree.`,
      currentArray: merged,
      nodeId,
    });

    return { result: merged, nodeId };
  }

  const { result } = sort(items, 0);
  return { sorted: result, treeNodes, steps };
}

// ─── 0/1 Knapsack ─────────────────────────────────────────────────────────────
// Complexity: O(N·W)
// Recurrence:
//   dp[i][w] = dp[i-1][w] if weight[i] > w
//   dp[i][w] = max(dp[i-1][w], value[i] + dp[i-1][w - weight[i]]) otherwise

export type KnapsackCellStep = {
  i: number;
  w: number;
  item: Package;
  includeVal?: number;
  excludeVal: number;
  decision: 'include' | 'exclude' | 'too_heavy';
  cellVal: number;
  explanation: string;
};

export type KnapsackResult = {
  dp: number[][];
  chosen: Package[];
  value: number;
  used: number;
  greedy: number;
  steps: KnapsackCellStep[];
  backtrackPath: { i: number; w: number; chosen: boolean; item?: Package }[];
};

export function knapsack(items: Package[], cap: number): KnapsackResult {
  // Flatten items by quantity if provided
  const flatItems: Package[] = [];
  for (const item of items) {
    const qty = Math.max(1, item.quantity ?? 1);
    for (let q = 1; q <= qty; q++) {
      flatItems.push({
        ...item,
        name: qty > 1 ? `${item.name} (#${q})` : item.name,
      });
    }
  }

  const n = flatItems.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(cap + 1).fill(0));
  const steps: KnapsackCellStep[] = [];

  for (let i = 1; i <= n; i++) {
    const cur = flatItems[i - 1];
    for (let w = 0; w <= cap; w++) {
      if (cur.weight > w) {
        dp[i][w] = dp[i - 1][w];
        steps.push({
          i,
          w,
          item: cur,
          excludeVal: dp[i - 1][w],
          decision: 'too_heavy',
          cellVal: dp[i][w],
          explanation: `Item "${cur.name}" (wt: ${cur.weight}) exceeds capacity ${w}. Excluded (value = ${dp[i][w]}).`,
        });
      } else {
        const includeVal = cur.value + dp[i - 1][w - cur.weight];
        const excludeVal = dp[i - 1][w];
        if (includeVal > excludeVal) {
          dp[i][w] = includeVal;
          steps.push({
            i,
            w,
            item: cur,
            includeVal,
            excludeVal,
            decision: 'include',
            cellVal: dp[i][w],
            explanation: `Item "${cur.name}": Include (${includeVal}) > Exclude (${excludeVal}). Decision: Include!`,
          });
        } else {
          dp[i][w] = excludeVal;
          steps.push({
            i,
            w,
            item: cur,
            includeVal,
            excludeVal,
            decision: 'exclude',
            cellVal: dp[i][w],
            explanation: `Item "${cur.name}": Exclude (${excludeVal}) ≥ Include (${includeVal}). Decision: Exclude.`,
          });
        }
      }
    }
  }

  // Backtrack to find chosen items
  let w = cap;
  const chosen: Package[] = [];
  const backtrackPath: { i: number; w: number; chosen: boolean; item?: Package }[] = [];

  for (let i = n; i > 0; i--) {
    const cur = flatItems[i - 1];
    if (dp[i][w] !== dp[i - 1][w]) {
      chosen.unshift(cur);
      backtrackPath.push({ i, w, chosen: true, item: cur });
      w -= cur.weight;
    } else {
      backtrackPath.push({ i, w, chosen: false, item: cur });
    }
  }

  // Greedy comparison (for educational comparison in DAA report)
  const greedy = flatItems.slice().sort((a, b) => b.value / b.weight - a.value / a.weight);
  let left = cap, gvalue = 0;
  for (const x of greedy) {
    if (x.weight <= left) {
      left -= x.weight;
      gvalue += x.value;
    }
  }

  return {
    dp,
    chosen,
    value: dp[n][cap],
    used: cap - w,
    greedy: gvalue,
    steps,
    backtrackPath,
  };
}

// ─── Backtracking — Team Assignment with State Space Tree ────────────────────
// Assigns available teams to incidents respecting capability constraints.
// Generates an explicit State Space Tree for interactive step-by-step visualization.

export type BacktrackTeam = { id?: string; name: string; skills: string[]; available: boolean };
export type BacktrackTask = { id: string; need: string; name?: string };

export type StateTreeNode = {
  id: string;
  parentId?: string;
  taskIndex: number;
  taskId: string;
  teamName: string;
  status: 'valid' | 'rejected' | 'backtrack' | 'solution';
  reason: string;
  depth: number;
  currentAssignments: string[];
};

export type BacktrackStep = {
  stepIndex: number;
  nodeId: string;
  description: string;
  status: 'try' | 'accept' | 'reject' | 'backtrack' | 'solution';
  currentAssignments: string[];
};

export type BacktrackResult = {
  tasks: BacktrackTask[];
  teams: BacktrackTeam[];
  logs: string[];
  assignment: string[] | null;
  treeNodes: StateTreeNode[];
  steps: BacktrackStep[];
};

export function assignTeams(
  teams?: BacktrackTeam[],
  tasks?: BacktrackTask[]
): BacktrackResult {
  const _teams: BacktrackTeam[] = teams ?? [
    { name: 'Alpha', skills: ['medical', 'general'], available: true },
    { name: 'Bravo', skills: ['general'], available: true },
    { name: 'Charlie', skills: ['water', 'flood'], available: true },
  ];
  const _tasks: BacktrackTask[] = tasks ?? [
    { id: 'RQ-104', need: 'medical' },
    { id: 'RQ-103', need: 'flood' },
    { id: 'RQ-102', need: 'general' },
  ];

  const logs: string[] = [];
  const treeNodes: StateTreeNode[] = [];
  const steps: BacktrackStep[] = [];
  let nodeCount = 0;
  let stepCount = 0;

  // Root node of State Space Tree
  const rootId = 'root';
  treeNodes.push({
    id: rootId,
    taskIndex: -1,
    taskId: 'START',
    teamName: 'NONE',
    status: 'valid',
    reason: 'Initial state: 0 tasks assigned',
    depth: 0,
    currentAssignments: [],
  });

  function search(i: number, used: Set<number>, out: string[], parentNodeId: string): string[] | null {
    if (i === _tasks.length) {
      const solId = `node-${++nodeCount}`;
      treeNodes.push({
        id: solId,
        parentId: parentNodeId,
        taskIndex: i,
        taskId: 'COMPLETE',
        teamName: 'GOAL',
        status: 'solution',
        reason: 'Complete feasible assignment found for all tasks!',
        depth: i + 1,
        currentAssignments: [...out],
      });
      steps.push({
        stepIndex: ++stepCount,
        nodeId: solId,
        description: `Complete feasible assignment found! (${out.join(', ')})`,
        status: 'solution',
        currentAssignments: [...out],
      });
      return out;
    }

    const curTask = _tasks[i];

    for (let j = 0; j < _teams.length; j++) {
      const team = _teams[j];
      const nodeId = `node-${++nodeCount}`;

      if (!team.available) {
        logs.push(`Skip ${team.name}: unavailable`);
        treeNodes.push({
          id: nodeId,
          parentId: parentNodeId,
          taskIndex: i,
          taskId: curTask.id,
          teamName: team.name,
          status: 'rejected',
          reason: `Team "${team.name}" is unavailable`,
          depth: i + 1,
          currentAssignments: [...out],
        });
        steps.push({
          stepIndex: ++stepCount,
          nodeId,
          description: `Reject ${team.name} for ${curTask.id}: team is marked unavailable.`,
          status: 'reject',
          currentAssignments: [...out],
        });
        continue;
      }

      const isUsed = used.has(j);
      const isCompatible = team.skills.includes(curTask.need) || curTask.need === 'general';

      if (!isUsed && isCompatible) {
        logs.push(`Try ${team.name} → ${curTask.id}`);
        used.add(j);
        const nextAssignments = [...out, `${team.name} → ${curTask.id}`];

        treeNodes.push({
          id: nodeId,
          parentId: parentNodeId,
          taskIndex: i,
          taskId: curTask.id,
          teamName: team.name,
          status: 'valid',
          reason: `Feasible: ${team.name} has [${curTask.need}] skill and is free.`,
          depth: i + 1,
          currentAssignments: nextAssignments,
        });
        steps.push({
          stepIndex: ++stepCount,
          nodeId,
          description: `Assign: ${team.name} → ${curTask.id} (feasible capability match).`,
          status: 'accept',
          currentAssignments: nextAssignments,
        });

        const r = search(i + 1, used, nextAssignments, nodeId);
        if (r) return r;

        used.delete(j);
        logs.push(`Backtrack: ${team.name} freed`);
        steps.push({
          stepIndex: ++stepCount,
          nodeId,
          description: `Backtrack from ${team.name} on ${curTask.id}: branch did not lead to full assignment.`,
          status: 'backtrack',
          currentAssignments: [...out],
        });
      } else {
        const rejectReason = isUsed ? 'already assigned to another task' : `lacks required skill (${curTask.need})`;
        logs.push(`Reject ${team.name}: ${rejectReason}`);
        treeNodes.push({
          id: nodeId,
          parentId: parentNodeId,
          taskIndex: i,
          taskId: curTask.id,
          teamName: team.name,
          status: 'rejected',
          reason: rejectReason,
          depth: i + 1,
          currentAssignments: [...out],
        });
        steps.push({
          stepIndex: ++stepCount,
          nodeId,
          description: `Reject ${team.name} for ${curTask.id}: ${rejectReason}.`,
          status: 'reject',
          currentAssignments: [...out],
        });
      }
    }
    return null;
  }

  const assignment = search(0, new Set(), [], rootId);
  return {
    tasks: _tasks,
    teams: _teams,
    logs,
    assignment,
    treeNodes,
    steps,
  };
}
