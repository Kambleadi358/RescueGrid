# RescueGrid DAA Project Report

## 1. Abstract
RescueGrid is a browser-based educational simulation that applies core Design and Analysis of Algorithms techniques to a fictional disaster-relief coordination problem. It models roads, rescue requests, supply packages and small team assignments. Outputs are demonstrations only and must not be used for real emergency decisions.

## 2. Introduction and problem definition
Flooding or damage can block roads while demand for help exceeds capacity. Given a graph with blocked edges, request attributes and finite package capacity, the system must expose reachability, routes, priority order and a mathematically defined allocation.

## 3. Objectives and requirements
The objectives are to show graph traversal, shortest paths, divide-and-conquer sorting, dynamic programming and recursive search in a usable dashboard. The system requires a local browser, sample input, editable roads, deterministic outputs and no cloud service.

## 4. System design
React presents controls and results. TypeScript separates immutable sample data from algorithms. An adjacency list is built from unblocked roads. C++17 code mirrors the key algorithm ideas for compilation and viva demonstration.

## 5. Algorithm design and pseudocode
**BFS:** enqueue source; repeatedly dequeue it and enqueue unvisited accessible neighbours. **DFS:** visit a node and recursively visit each unvisited accessible neighbour. **Dijkstra:** set source distance zero; repeatedly select the smallest unsettled distance and relax accessible edges. **Merge Sort:** recursively split requests; merge halves using urgency, medical, people, wait, ID. **Knapsack:** for each item and capacity, select max(exclude, include). **Backtracking:** try each compatible unused team; recurse; undo choice on failure.

## 6. Complexity analysis
BFS/DFS take O(V+E) time and O(V) auxiliary space. Dijkstra with a min-priority queue takes O((V+E) log V). Merge Sort takes O(R log R) time and O(R) auxiliary space in all typical cases. Knapsack takes O(RW) time and O(RW) space; it is pseudo-polynomial. The small assignment search is exponential worst case.

## 7. Implementation details
The dashboard starts with seven locations and nine roads, two blocked. All routing re-runs against current road controls. Merge Sort does not call a built-in sort. Knapsack uses an integer full DP table and reconstructs selected packages. The greedy result is explicitly only a baseline.

## 8. Test cases and results
Automated tests cover connected BFS, disconnected/unreachable Dijkstra, blocked-edge exclusion, DFS reachability, duplicate priority entries, zero and empty knapsack cases, capacity bounds and a valid backtracking instance. Results are produced by the local test command rather than claimed as external experimental evidence.

## 9. Limitations and conclusion
The model does not model traffic, time windows, uncertainty, fairness, package splitting or validated geography. It nevertheless provides a transparent, beginner-friendly demonstration of how algorithmic choices change a simulated decision. References: CLRS, *Introduction to Algorithms*; standard C++17 library documentation; Vite and React documentation.
