import os
import sys
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from playwright.sync_api import sync_playwright

BASE_DIR = r"d:\TY\DAA\disaster"
DOCS_DIR = os.path.join(BASE_DIR, "docs")
SCREENSHOTS_DIR = os.path.join(DOCS_DIR, "screenshots")
PDF_OUT = os.path.join(BASE_DIR, "RescueGrid_Project_Overview.pdf")
DOCX_OUT = os.path.join(BASE_DIR, "RescueGrid_Project_Overview.docx")
HTML_OUT = os.path.join(DOCS_DIR, "RescueGrid_Report.html")

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    tcPr.append(tcMar)

def create_docx():
    print("Generating DOCX document...")
    doc = Document()

    # Configure A4 Margins (0.75 in = 54 pt)
    for section in doc.sections:
        section.top_margin = Inches(0.7)
        section.bottom_margin = Inches(0.7)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)
        section.page_width = Inches(8.27)
        section.page_height = Inches(11.69)

    # Style colors
    c_primary = RGBColor(15, 23, 42)    # Slate 900
    c_blue = RGBColor(14, 116, 144)     # Cyan/Blue 700
    c_accent = RGBColor(2, 132, 199)    # Sky 600
    c_gray = RGBColor(71, 85, 105)      # Slate 600

    # Document Header / Badge
    p_badge = doc.add_paragraph()
    p_badge.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_badge = p_badge.add_run("COLLEGE DAA COURSE PROJECT · TECHNICAL SPECIFICATION & ALGORITHM AUDIT")
    r_badge.font.name = "Segoe UI"
    r_badge.font.size = Pt(9)
    r_badge.font.bold = True
    r_badge.font.color.rgb = c_accent

    # Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("RescueGrid: Disaster Relief Optimization System")
    r_title.font.name = "Segoe UI"
    r_title.font.size = Pt(22)
    r_title.font.bold = True
    r_title.font.color.rgb = c_primary

    # Subtitle
    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_sub = p_sub.add_run("Design and Analysis of Algorithms (DAA) Interactive Simulation & Verification Platform")
    r_sub.font.name = "Segoe UI"
    r_sub.font.size = Pt(11)
    r_sub.font.italic = True
    r_sub.font.color.rgb = c_gray

    # Metadata Table
    meta_table = doc.add_table(rows=2, cols=4)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_data = [
        [("Course", "Design & Analysis of Algorithms"), ("Project Type", "Disaster Response Simulation"), ("Graph Topology", "13 Nodes · 19 Roads"), ("Payload Limit", "15 Units (Configurable)")],
        [("Primary Stack", "React 18 · TypeScript · Vite"), ("Algorithms", "MergeSort · Bellman-Ford · Knapsack · Backtrack"), ("Execution Engine", "Discrete-Event Team Reuse"), ("Verification", "28 Vitest Tests Passed")]
    ]
    for row_idx, row in enumerate(meta_table.rows):
        for col_idx, cell in enumerate(row.cells):
            lbl, val = meta_data[row_idx][col_idx]
            set_cell_background(cell, "F1F5F9")
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            r1 = p.add_run(f"{lbl}: ")
            r1.font.name = "Segoe UI"
            r1.font.size = Pt(8.5)
            r1.font.bold = True
            r1.font.color.rgb = c_primary
            r2 = p.add_run(val)
            r2.font.name = "Segoe UI"
            r2.font.size = Pt(8.5)
            r2.font.color.rgb = c_gray

    doc.add_paragraph() # Spacing

    # ─────────────────────────────────────────────────────────────────────────
    # SECTION 1: PROJECT OVERVIEW
    # ─────────────────────────────────────────────────────────────────────────
    h1 = doc.add_heading(level=1)
    r_h1 = h1.add_run("1. Project Overview")
    r_h1.font.name = "Segoe UI"
    r_h1.font.size = Pt(15)
    r_h1.font.bold = True
    r_h1.font.color.rgb = c_blue

    p_intro = doc.add_paragraph()
    p_intro.paragraph_format.line_spacing = 1.15
    p_intro.add_run(
        "RescueGrid is an interactive disaster management simulation platform engineered to solve critical bottlenecks "
        "in emergency relief coordination. During humanitarian crises (such as flash floods, earthquakes, and urban fires), "
        "decision-makers face three high-stakes logistical challenges: triaging life-threatening casualty incidents under extreme time pressure, "
        "navigating heavily damaged town transit networks containing hazardous road collapses, and packing limited-capacity rescue transports "
        "with the most beneficial mixture of medical and relief supplies. RescueGrid addresses these challenges by integrating four classical "
        "Design and Analysis of Algorithms (DAA) paradigms into an end-to-end discrete-event simulation engine."
    )

    p_work = doc.add_paragraph()
    p_work.paragraph_format.line_spacing = 1.15
    p_work.add_run(
        "System Architecture & Operation: The application models an urban emergency zone as an undirected, weighted graph "
        "of 13 strategic infrastructure nodes (Operations Headquarters, Hospitals, River Banks, Shelters, Bridges) connected by 19 primary road segments. "
        "The system operates in two core operational modes:\n"
        "• Option A (User Input Scenario Builder): A clean starting canvas allowing operators to define custom incidents with specific casualty counts, "
        "urgency ratings, and specialized capability demands; configure rescue teams with medical, flood, and general skills; manage relief supplies; and "
        "dynamically toggle road hazards directly on the interactive town map.\n"
        "• Option B (Predefined Emergency Scenarios): Curated emergency scenarios (Normal Rescue, Critical Emergency, Resource Shortage, No Route Available) "
        "engineered to test boundary conditions, road closures, supply deficits, and isolated zones."
    )

    # ─────────────────────────────────────────────────────────────────────────
    # SECTION 2: FOUR ALGORITHMS USED
    # ─────────────────────────────────────────────────────────────────────────
    h2 = doc.add_heading(level=1)
    r_h2 = h2.add_run("2. Four Algorithms Implemented in RescueGrid")
    r_h2.font.name = "Segoe UI"
    r_h2.font.size = Pt(15)
    r_h2.font.bold = True
    r_h2.font.color.rgb = c_blue

    p_algo_intro = doc.add_paragraph()
    p_algo_intro.paragraph_format.line_spacing = 1.15
    p_algo_intro.add_run(
        "All algorithms in RescueGrid have been verified directly from the source code (src/algorithms.ts). "
        "Each algorithm addresses a distinct phase of disaster response:"
    )

    # Algorithm 1
    h_a1 = doc.add_heading(level=2)
    r_a1 = h_a1.add_run("2.1 Merge Sort — Multi-Criterion Casualty Incident Triage")
    r_a1.font.name = "Segoe UI"
    r_a1.font.size = Pt(12)
    r_a1.font.bold = True
    r_a1.font.color.rgb = c_primary

    p_a1 = doc.add_paragraph()
    p_a1.paragraph_format.line_spacing = 1.15
    p_a1.add_run(
        "• How It Works: Merge Sort is a divide-and-conquer algorithm that recursively splits an unsorted list of incident requests into singletons "
        "(arrays of length ≤ 1), and then systematically merges adjacent sublists in priority order using a custom comparator function.\n"
        "• Multi-Criterion Priority Hierarchy: Triage order is evaluated strictly through a 5-tier policy: "
        "(1) Urgency Tier (Critical > High > Medium > Low), "
        "(2) Medical Emergency Flag (medical incidents prioritize over non-medical), "
        "(3) Affected Population (descending casualty counts), "
        "(4) Waiting Time (longer elapsed waiting time prioritized), and "
        "(5) Deterministic Incident ID tie-break.\n"
        "• Where & Why Used in RescueGrid: Located in src/algorithms.ts (mergeSort and mergeSortWithTrace). It sorts the operational incident queue "
        "so rescue teams are dispatched to the most severe and time-sensitive disasters first, ensuring life-critical medical emergencies are never delayed.\n"
        "• Time Complexity: O(R log R) across best, worst, and average cases, where R is the number of incidents. Space Complexity: O(R) auxiliary space."
    )

    # Algorithm 2
    h_a2 = doc.add_heading(level=2)
    r_a2 = h_a2.add_run("2.2 Bellman-Ford — Shortest Safe Transit Path Under Road Hazards")
    r_a2.font.name = "Segoe UI"
    r_a2.font.size = Pt(12)
    r_a2.font.bold = True
    r_a2.font.color.rgb = c_primary

    p_a2 = doc.add_paragraph()
    p_a2.paragraph_format.line_spacing = 1.15
    p_a2.add_run(
        "• How It Works: Bellman-Ford is a dynamic programming graph traversal algorithm. It initializes distance estimates from Headquarters (HQ) "
        "to all vertices as ∞ (with dist[HQ] = 0). It systematically performs |V| - 1 passes over all active directed edges, relaxing any edge (u, v) "
        "where dist[u] + cost(u, v) < dist[v]. A final verification pass checks for negative-weight cycles.\n"
        "• Where & Why Used in RescueGrid: Located in src/algorithms.ts (bellmanFord). In disaster zones, collapsed roads, flood debris, and damaged bridges "
        "render road segments impassable. Bellman-Ford filters out all blocked roads and calculates the optimal minimum-travel-cost route from HQ "
        "to every incident destination, verifying reachability and providing alternative detours.\n"
        "• Time Complexity: O(V · E), where V is the number of town locations (13 nodes) and E is the number of road segments (19 bidirectional edges = 38 directed edges). "
        "Space Complexity: O(V) for predecessor and distance tables."
    )

    # Algorithm 3
    h_a3 = doc.add_heading(level=2)
    r_a3 = h_a3.add_run("2.3 0/1 Knapsack (Dynamic Programming) — Optimal Relief Supply Allocation")
    r_a3.font.name = "Segoe UI"
    r_a3.font.size = Pt(12)
    r_a3.font.bold = True
    r_a3.font.color.rgb = c_primary

    p_a3 = doc.add_paragraph()
    p_a3.paragraph_format.line_spacing = 1.15
    p_a3.add_run(
        "• How It Works: The 0/1 Knapsack algorithm constructs an (N + 1) × (W + 1) dynamic programming table where dp[i][w] represents the maximum "
        "humanitarian relief value attainable using a subset of the first i package items within weight capacity w. The recurrence relation is:\n"
        "   dp[i][w] = dp[i - 1][w] if weight[i] > w, else max(dp[i - 1][w], value[i] + dp[i - 1][w - weight[i]])\n"
        "Following table generation, the algorithm backtracks from dp[N][W] to determine the exact subset of packages packed onto the vehicle.\n"
        "• Where & Why Used in RescueGrid: Located in src/algorithms.ts (knapsack). Emergency transport vehicles have rigid physical payload limits "
        "(default 15 capacity units). The algorithm optimizes cargo manifests (Trauma Kits, Mobile Clinics, Water Purification Units, Food Rations) "
        "to maximize total casualty support value without exceeding payload limits. It also computes a greedy fractional comparison to demonstrate DP optimality.\n"
        "• Time Complexity: O(N · W) pseudo-polynomial time and space, where N is total relief items and W is vehicle payload capacity."
    )

    # Algorithm 4
    h_a4 = doc.add_heading(level=2)
    r_a4 = h_a4.add_run("2.4 Backtracking with State Space Tree — Specialized Rescue Team Assignment")
    r_a4.font.name = "Segoe UI"
    r_a4.font.size = Pt(12)
    r_a4.font.bold = True
    r_a4.font.color.rgb = c_primary

    p_a4 = doc.add_paragraph()
    p_a4.paragraph_format.line_spacing = 1.15
    p_a4.add_run(
        "• How It Works: Backtracking systematically explores the combinatorial assignment space using depth-first search over a state space tree. "
        "At each node, it evaluates candidate team assignments against strict feasibility constraints: (1) Team Availability (team must not be active elsewhere), "
        "and (2) Capability Compatibility (team skills must match incident demands, e.g., 'medical' for trauma clinics, 'flood' for river rescues, or 'general'). "
        "Infeasible assignments are immediately pruned (bounding step), causing the algorithm to backtrack up the tree and test alternative branches.\n"
        "• Where & Why Used in RescueGrid: Located in src/algorithms.ts (assignTeams). It prevents fatal dispatch mismatches (e.g., dispatching general volunteers "
        "to critical surgical trauma sites) and eliminates double-booking of emergency units.\n"
        "• Time Complexity: O(M^N) worst-case combinatorial complexity, where N is incident tasks and M is available rescue teams; significantly pruned in practice "
        "by capability and availability bounding constraints."
    )

    # Algorithm Comparison Table
    table_algo = doc.add_table(rows=5, cols=5)
    table_algo.alignment = WD_TABLE_ALIGNMENT.CENTER
    algo_headers = ["Algorithm", "Design Paradigm", "Time Complexity", "Space Complexity", "Operational Role in RescueGrid"]
    algo_rows = [
        ["Merge Sort", "Divide & Conquer", "O(R log R)", "O(R)", "Multi-criterion triage ranking of emergency incidents"],
        ["Bellman-Ford", "Dynamic Programming", "O(V · E)", "O(V)", "Shortest safe transit routing bypassing blocked road hazards"],
        ["0/1 Knapsack", "Dynamic Programming", "O(N · W)", "O(N · W)", "Relief cargo optimization under rigid vehicle payload limits"],
        ["Backtracking", "State Space Search", "O(M^N) worst (pruned)", "O(N) recursion", "Constraint-satisfaction assignment of specialized rescue teams"]
    ]
    for c_idx, text in enumerate(algo_headers):
        cell = table_algo.rows[0].cells[c_idx]
        set_cell_background(cell, "0F172A")
        set_cell_margins(cell, top=100, bottom=100, left=100, right=100)
        p = cell.paragraphs[0]
        r = p.add_run(text)
        r.font.name = "Segoe UI"
        r.font.size = Pt(8.5)
        r.font.bold = True
        r.font.color.rgb = RGBColor(255, 255, 255)

    for r_idx, row_data in enumerate(algo_rows):
        for c_idx, text in enumerate(row_data):
            cell = table_algo.rows[r_idx + 1].cells[c_idx]
            set_cell_background(cell, "F8FAFC" if r_idx % 2 == 0 else "FFFFFF")
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)
            p = cell.paragraphs[0]
            r = p.add_run(text)
            r.font.name = "Segoe UI"
            r.font.size = Pt(8)
            r.font.color.rgb = c_primary

    doc.add_paragraph() # Spacing

    # ─────────────────────────────────────────────────────────────────────────
    # SECTION 3: APPLICATION SCREENSHOTS
    # ─────────────────────────────────────────────────────────────────────────
    h3 = doc.add_heading(level=1)
    r_h3 = h3.add_run("3. Application Screenshots & Interface Walkthrough")
    r_h3.font.name = "Segoe UI"
    r_h3.font.size = Pt(15)
    r_h3.font.bold = True
    r_h3.font.color.rgb = c_blue

    p_screens_intro = doc.add_paragraph()
    p_screens_intro.paragraph_format.line_spacing = 1.15
    p_screens_intro.add_run(
        "Below are genuine high-resolution screenshots captured directly from the live running RescueGrid application. "
        "Each screen demonstrates an integral functional module of the system."
    )

    screenshot_specs = [
        ("Figure 1: Platform Mode Selection (Option A Custom Builder vs Option B Predefined Demos)",
         "01_mode_selection.png",
         "The landing view provides operators with two pathways: Option A for full granular control via the Scenario Builder, and Option B for one-click launching of 4 pre-engineered disaster scenarios that test critical conditions like severe debris blockages and supply bottlenecks."),

        ("Figure 2: Clean Scenario Builder Canvas (Option A User Input Starting State)",
         "02_scenario_builder_blank.png",
         "Upon selecting Option A, the system initializes a clean canvas with 0 incidents, 0 teams, and 0 relief packages. The interactive town road network is fully loaded, allowing users to toggle road blockages and enter custom emergency parameters from scratch."),

        ("Figure 3: Configured Disaster Scenario with Custom Incidents, Teams, and Road Hazards",
         "03_scenario_builder_configured.png",
         "Operators can input custom incident parameters (location, casualty count, urgency rating, medical flags), register specialized rescue squads (paramedic, flood, general), allocate relief packages, and block roads by clicking road segments directly on the SVG map."),

        ("Figure 4: Pre-Flight Mission Verification & Resource Review Modal",
         "04_mission_review.png",
         "Before initiating algorithms, the mission review screen validates system parameters: verifying at least 1 incident and 1 team exist, auditing road connectivity, and calculating total affected casualties and aggregate relief weight."),

        ("Figure 5: Operations Command Dashboard & Active Simulation Center",
         "05_simulation_dashboard.png",
         "The primary command center integrates the SVG town map, the Merge-Sort-ordered priority queue on the left, and the live status panel on the right. Operators can monitor live incident triage, dispatched teams, active shortest paths in neon cyan, and knapsack cargo allocations."),

        ("Figure 6: Interactive Town Map & Road Network Topological Graph",
         "06_interactive_town_map.png",
         "The SVG graph engine renders 13 municipal nodes and 19 road segments with transit costs in minutes. Blocked roads are rendered in bright red with hazard icons, while the active optimal transit route from HQ to the selected emergency is highlighted in dynamic cyan."),

        ("Figure 7: Incident Priority Queue (Multi-Criterion Merge Sort Triage)",
         "07_priority_triage_queue.png",
         "The left sidebar displays emergencies sorted strictly by the 5-tier Merge Sort comparator. Each incident card indicates rank (#1, #2, #3), urgency badges (Critical, High, Medium), medical status chips, casualty figures, and live fulfillment state (Waiting, In Progress, Completed)."),

        ("Figure 8: Relief Cargo Allocation (0/1 Knapsack) & Dynamic Team Dispatch",
         "08_resource_allocation_details.png",
         "The right operations panel details the selected incident's Bellman-Ford shortest path (HQ → Hotel → Market, cost: 7 min), assigned team (Bravo General), and optimal 0/1 Knapsack payload (15/15 units packed, delivering 49 total casualty support points)."),

        ("Figure 9: Step-by-Step Algorithm Visualizer — Merge Sort Divide & Conquer Tree",
         "10_algo_visualizer_merge_sort.png",
         "The interactive visualizer illustrates the recursive decomposition of incidents into tree subproblems, followed by pairwise merge steps with human-readable comparison reasoning justifying why each incident was prioritized."),

        ("Figure 10: Step-by-Step Algorithm Visualizer — Bellman-Ford Edge Relaxation Table",
         "11_algo_visualizer_bellman_ford.png",
         "An interactive edge relaxation inspector demonstrating dynamic programming passes over the graph. It highlights relaxed edges, compares candidate distances against current bests, and updates the distance array table snapshot in real time."),

        ("Figure 11: Step-by-Step Algorithm Visualizer — 0/1 Knapsack Dynamic Programming Matrix",
         "12_algo_visualizer_knapsack_dp.png",
         "Renders the complete (N + 1) × (W + 1) DP state matrix. Cells are highlighted as the algorithm computes include-versus-exclude decisions, followed by yellow backtrack markers tracing the exact optimal cargo subset."),

        ("Figure 12: Step-by-Step Algorithm Visualizer — Team Assignment State Space Tree",
         "13_algo_visualizer_backtracking.png",
         "Visualizes the combinatorial backtracking tree. Green branches indicate valid skill matches, red branches depict constraint violations (unavailable or lacking skills) pruned immediately to prevent invalid dispatches, and final goal nodes indicate complete feasible assignments."),

        ("Figure 13: Comprehensive DAA Execution Audit & Engineering Report",
         "14_daa_audit_report.png",
         "A formal printable engineering audit screen displaying high-level mission KPIs, incident outcome matrices (reachability, dispatched cargo, team assigned), road network audit logs, and theoretical-versus-empirical algorithm performance analyses.")
    ]

    for title, filename, desc in screenshot_specs:
        img_path = os.path.join(SCREENSHOTS_DIR, filename)
        if not os.path.exists(img_path):
            print(f"Warning: Screenshot {filename} not found at {img_path}")
            continue

        h_fig = doc.add_heading(level=2)
        r_hf = h_fig.add_run(title)
        r_hf.font.name = "Segoe UI"
        r_hf.font.size = Pt(11)
        r_hf.font.bold = True
        r_hf.font.color.rgb = c_primary

        p_img = doc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run_img = p_img.add_run()
        # Add picture with 6.2 inches width (fits nicely within 6.77 in printable area)
        run_img.add_picture(img_path, width=Inches(6.2))

        p_desc = doc.add_paragraph()
        p_desc.paragraph_format.line_spacing = 1.15
        r_d = p_desc.add_run(desc)
        r_d.font.name = "Segoe UI"
        r_d.font.size = Pt(9.5)
        r_d.font.italic = True
        r_d.font.color.rgb = c_gray
        doc.add_paragraph() # Spacing

    # ─────────────────────────────────────────────────────────────────────────
    # SECTION 4: CONCLUSION
    # ─────────────────────────────────────────────────────────────────────────
    h4 = doc.add_heading(level=1)
    r_h4 = h4.add_run("4. Conclusion")
    r_h4.font.name = "Segoe UI"
    r_h4.font.size = Pt(15)
    r_h4.font.bold = True
    r_h4.font.color.rgb = c_blue

    p_conc = doc.add_paragraph()
    p_conc.paragraph_format.line_spacing = 1.15
    p_conc.add_run(
        "RescueGrid successfully demonstrates how classical algorithms taught in computer science form the core foundation "
        "of modern, life-saving disaster relief logistics. By combining Merge Sort for deterministic multi-criterion casualty triage, "
        "Bellman-Ford for resilient shortest-path routing around physical road hazards, 0/1 Knapsack Dynamic Programming for payload-constrained "
        "cargo maximization, and Backtracking for capability-matched team dispatch, the system transforms chaotic emergency response into an optimized, "
        "data-driven operation.\n\n"
        "The project bridges theoretical algorithm design and practical software engineering by offering both a clean, customizable user scenario builder "
        "and rich step-by-step visualizers. Automated test suites (28/28 tests passing) confirm deterministic correctness across all boundary conditions. "
        "RescueGrid provides an extensible blueprint for emergency management systems where every second and every kilogram of relief cargo directly impacts human lives."
    )

    doc.save(DOCX_OUT)
    print(f"DOCX successfully generated at: {DOCX_OUT}")

def create_pdf():
    print("Generating HTML template for PDF rendering...")

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>RescueGrid — Project Overview & DAA Algorithm Technical Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

    @page {{
      size: A4 portrait;
      margin: 12mm 14mm 14mm 14mm;
      @bottom-right {{
        content: "Page " counter(page) " of " counter(pages);
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748b;
      }}
      @bottom-left {{
        content: "RescueGrid — Disaster Relief Optimization System | DAA Course Project";
        font-family: 'Inter', sans-serif;
        font-size: 8pt;
        color: #64748b;
      }}
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.45;
      font-size: 9.5pt;
    }}

    .page-break {{
      page-break-after: always;
    }}

    /* Header Banner */
    .doc-header {{
      border-bottom: 2px solid #0284c7;
      padding-bottom: 12px;
      margin-bottom: 14px;
    }}

    .doc-badge {{
      display: inline-block;
      font-size: 7.5pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #0284c7;
      background: #e0f2fe;
      padding: 3px 8px;
      border-radius: 4px;
      margin-bottom: 6px;
    }}

    .doc-title {{
      font-size: 20pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.02em;
      line-height: 1.15;
    }}

    .doc-subtitle {{
      font-size: 10pt;
      font-weight: 500;
      color: #475569;
      margin-top: 3px;
    }}

    /* Metadata Grid */
    .meta-grid {{
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 14px;
    }}

    .meta-item {{
      font-size: 8pt;
    }}

    .meta-label {{
      font-weight: 700;
      color: #475569;
      text-transform: uppercase;
      font-size: 7pt;
      letter-spacing: 0.05em;
    }}

    .meta-val {{
      font-weight: 600;
      color: #0f172a;
      margin-top: 1px;
    }}

    /* Headings */
    h2.section-heading {{
      font-size: 12.5pt;
      font-weight: 800;
      color: #0369a1;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 12px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }}

    h3.sub-heading {{
      font-size: 10pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 8px;
      margin-bottom: 4px;
    }}

    p {{
      margin-bottom: 8px;
      text-align: justify;
      color: #334155;
    }}

    /* Algorithm Card Grid */
    .algo-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 8px;
      margin-bottom: 12px;
    }}

    .algo-card {{
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px;
      background: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
      break-inside: avoid;
    }}

    .algo-card-header {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid #f1f5f9;
    }}

    .algo-name {{
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
    }}

    .algo-complexity {{
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      font-weight: 600;
      background: #eff6ff;
      color: #1d4ed8;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #bfdbfe;
    }}

    .algo-body {{
      font-size: 8pt;
      color: #475569;
      line-height: 1.35;
    }}

    .algo-body strong {{
      color: #0f172a;
    }}

    /* Comparison Table */
    table.data-table {{
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 12px 0;
      font-size: 8pt;
      break-inside: avoid;
    }}

    table.data-table th {{
      background: #0f172a;
      color: #ffffff;
      font-weight: 600;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #0f172a;
    }}

    table.data-table td {{
      padding: 5px 8px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
    }}

    table.data-table tr:nth-child(even) td {{
      background: #f8fafc;
    }}

    /* Figure / Screenshot Containers */
    .figure-container {{
      margin: 10px 0;
      break-inside: avoid;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      background: #ffffff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.05);
    }}

    .figure-header {{
      background: #f8fafc;
      padding: 6px 10px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }}

    .figure-title {{
      font-size: 8.5pt;
      font-weight: 700;
      color: #0f172a;
    }}

    .figure-tag {{
      font-size: 7pt;
      font-weight: 600;
      text-transform: uppercase;
      color: #0284c7;
      background: #e0f2fe;
      padding: 2px 6px;
      border-radius: 3px;
    }}

    .figure-image {{
      width: 100%;
      display: block;
      max-height: 250px;
      object-fit: cover;
      object-position: top;
      background: #0b1120;
    }}

    .figure-image.full-dash {{
      max-height: 290px;
    }}

    .figure-caption {{
      padding: 6px 10px;
      font-size: 8pt;
      color: #475569;
      line-height: 1.35;
      background: #ffffff;
      border-top: 1px solid #f1f5f9;
    }}

    /* Grid for side-by-side screenshots */
    .figures-grid-2 {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 8px 0;
      break-inside: avoid;
    }}

    .callout-box {{
      background: #f0fdf4;
      border-left: 3px solid #16a34a;
      padding: 8px 12px;
      margin: 10px 0;
      border-radius: 0 4px 4px 0;
      font-size: 8.5pt;
      color: #166534;
      break-inside: avoid;
    }}

    .callout-box strong {{
      color: #14532d;
    }}
  </style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <div class="doc-header">
    <div class="doc-badge">Engineering Project Report · Design &amp; Analysis of Algorithms</div>
    <h1 class="doc-title">RescueGrid: Disaster Relief Optimization System</h1>
    <div class="doc-subtitle">Algorithmic Optimization Framework for Multi-Incident Response &amp; Emergency Transport Logistics</div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <div class="meta-label">Course Subject</div>
      <div class="meta-val">Design &amp; Analysis of Algorithms (DAA)</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Implementation Stack</div>
      <div class="meta-val">React 18 · TypeScript · Vite · SVG</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Graph Topology</div>
      <div class="meta-val">13 Municipal Nodes · 19 Road Edges</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Verification Status</div>
      <div class="meta-val">28 Unit/Acceptance Tests Passed</div>
    </div>
  </div>

  <h2 class="section-heading">1. Project Overview</h2>
  <p>
    <strong>RescueGrid</strong> is an intelligent disaster relief optimization and simulation system designed to solve high-stakes resource allocation and transit routing dilemmas during acute humanitarian crises. In real-world catastrophes—including torrential river floods, structural collapses, and industrial hazards—emergency management teams confront three fundamental bottlenecks: <em>triaging casualty incidents</em> under severe time urgency, <em>finding safe transit paths</em> across fractured road networks with collapsed bridges and road blockages, and <em>packing rescue transports</em> to maximize humanitarian impact without exceeding strict vehicle payload capacities.
  </p>
  <p>
    RescueGrid addresses these challenges through a unified discrete-event simulation architecture combining four core DAA algorithmic paradigms: <strong>Merge Sort</strong> with multi-criterion priority heuristics for incident triage, <strong>Bellman-Ford</strong> for resilient shortest-path transit under physical road blockages, <strong>0/1 Knapsack Dynamic Programming</strong> for optimal relief supply cargo packing, and <strong>Backtracking with State Space Search</strong> for constraint-satisfaction rescue team assignments.
  </p>
  <p>
    <strong>Dual-Mode Operational Architecture:</strong> The application supports two distinct operational modes:
    <strong>Option A (User Input Scenario Builder)</strong> presents a completely clean canvas (0 pre-filled demo incidents, 0 teams, 0 packages) allowing operators to construct custom emergency scenarios from scratch, add specialized units, and click roads directly on the interactive town map to simulate blockages.
    <strong>Option B (Predefined Demo Scenarios)</strong> provides 4 curated emergency cases (Normal Rescue, Critical Emergency, Resource Shortage, and No Route Available) engineered to benchmark boundary conditions, bridge collapses, and supply deficits.
  </p>

  <div class="figure-container">
    <div class="figure-header">
      <span class="figure-title">Figure 1: Platform Mode Selection (Option A Custom Builder vs Option B Predefined Emergency Cases)</span>
      <span class="figure-tag">Landing Portal</span>
    </div>
    <img src="{SCREENSHOTS_DIR}/01_mode_selection.png" class="figure-image" alt="Mode Selection">
    <div class="figure-caption">
      <strong>Functionality:</strong> Serves as the landing control center allowing operators to choose between Option A (full control user-input scenario builder) and Option B (instant access to 4 curated emergency response scenarios).
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== PAGE 2 ==================== -->
  <h2 class="section-heading">2. Four Algorithms Implemented in RescueGrid</h2>
  <p>
    Every algorithm implemented in RescueGrid has been verified directly from the project source code (<code>src/algorithms.ts</code>). Each algorithm plays a specialized, mathematically rigorous role in the emergency management pipeline:
  </p>

  <div class="algo-grid">
    <!-- Algorithm 1 -->
    <div class="algo-card">
      <div class="algo-card-header">
        <span class="algo-name">1. Merge Sort (Multi-Criterion Triage)</span>
        <span class="algo-complexity">O(R log R)</span>
      </div>
      <div class="algo-body">
        <p><strong>How it works:</strong> A stable divide-and-conquer sorting algorithm. Recursively halves the incident array until singletons remain, then merges sublists in prioritized sequence using a custom 5-tier comparator function.</p>
        <p><strong>Comparator Hierarchy:</strong> (1) Urgency Tier (Critical > High > Medium > Low), (2) Medical Emergency flag (true > false), (3) Affected Population (descending), (4) Elapsed Waiting Time (descending), and (5) Deterministic Incident ID.</p>
        <p><strong>Role in RescueGrid:</strong> Sorts the operational triage queue so that life-threatening medical emergencies in high-density areas receive immediate response first.</p>
        <p><strong>Complexity:</strong> <code>O(R log R)</code> time across all cases; <code>O(R)</code> auxiliary space (where R = number of incidents).</p>
      </div>
    </div>

    <!-- Algorithm 2 -->
    <div class="algo-card">
      <div class="algo-card-header">
        <span class="algo-name">2. Bellman-Ford (Shortest Safe Route)</span>
        <span class="algo-complexity">O(V · E)</span>
      </div>
      <div class="algo-body">
        <p><strong>How it works:</strong> Dynamic programming graph traversal. Initializes distance estimates from HQ to all nodes as ∞ (dist[HQ]=0). Performs |V|-1 passes over all open directed edges, relaxing edges where <code>dist[u] + cost(u,v) < dist[v]</code>. Detects unreachable nodes and verifies absence of negative cycles.</p>
        <p><strong>Role in RescueGrid:</strong> Filters out blocked roads (hazard zones/collapsed bridges) and discovers the guaranteed lowest-cost safe travel route from Operations HQ to any incident site.</p>
        <p><strong>Complexity:</strong> <code>O(V · E)</code> time (V = 13 nodes, E = 38 directed road edges); <code>O(V)</code> space for distance and parent vectors.</p>
      </div>
    </div>

    <!-- Algorithm 3 -->
    <div class="algo-card">
      <div class="algo-card-header">
        <span class="algo-name">3. 0/1 Knapsack (Relief Allocation)</span>
        <span class="algo-complexity">O(N · W)</span>
      </div>
      <div class="algo-body">
        <p><strong>How it works:</strong> Dynamic programming optimization. Builds an (N+1)×(W+1) table where <code>dp[i][w] = max(dp[i-1][w], value[i] + dp[i-1][w-weight[i]])</code>. Backtracks from dp[N][W] to recover chosen packages. Benchmarks against a greedy heuristic.</p>
        <p><strong>Role in RescueGrid:</strong> Emergency vehicles have rigid payload limits (default 15 capacity units). Knapsack packs the most impactful mixture of Trauma Kits, Mobile Clinics, Food Rations, and Water Supplies to maximize casualty support.</p>
        <p><strong>Complexity:</strong> <code>O(N · W)</code> pseudo-polynomial time and space (N = package items, W = payload capacity limit).</p>
      </div>
    </div>

    <!-- Algorithm 4 -->
    <div class="algo-card">
      <div class="algo-card-header">
        <span class="algo-name">4. Backtracking (Team Assignment)</span>
        <span class="algo-complexity">O(M^N) Pruned</span>
      </div>
      <div class="algo-body">
        <p><strong>How it works:</strong> Depth-First Search exploration of the combinatorial state space tree. At each decision node, candidate teams are evaluated against constraints: team availability and matching capability (medical, flood, structural, general).</p>
        <p><strong>Bounding &amp; Pruning:</strong> Infeasible branches are pruned immediately (dead end) and the algorithm backtracks up the tree, avoiding unproductive subtrees.</p>
        <p><strong>Role in RescueGrid:</strong> Assigns available rescue teams to triage incidents without double-booking while ensuring specialized medical/flood skills match the incident needs.</p>
        <p><strong>Complexity:</strong> <code>O(M^N)</code> worst-case; heavily pruned in practice by capability and availability bounding constraints.</p>
      </div>
    </div>
  </div>

  <h3 class="sub-heading">Summary Comparison of Implemented DAA Algorithms</h3>
  <table class="data-table">
    <thead>
      <tr>
        <th>Algorithm Name</th>
        <th>Design Paradigm</th>
        <th>Time Complexity</th>
        <th>Space Complexity</th>
        <th>System Responsibility in RescueGrid</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Merge Sort</strong></td>
        <td>Divide &amp; Conquer</td>
        <td><code>O(R log R)</code></td>
        <td><code>O(R)</code></td>
        <td>Multi-criterion priority ordering and triage hierarchy of casualty incidents</td>
      </tr>
      <tr>
        <td><strong>Bellman-Ford</strong></td>
        <td>Dynamic Programming</td>
        <td><code>O(V · E)</code></td>
        <td><code>O(V)</code></td>
        <td>Shortest safe path calculation from Operations HQ bypassing blocked road hazards</td>
      </tr>
      <tr>
        <td><strong>0/1 Knapsack</strong></td>
        <td>Dynamic Programming</td>
        <td><code>O(N · W)</code></td>
        <td><code>O(N · W)</code></td>
        <td>Optimal cargo manifest selection maximizing relief points under vehicle capacity</td>
      </tr>
      <tr>
        <td><strong>Backtracking</strong></td>
        <td>State Space Tree Search</td>
        <td><code>O(M^N)</code> (pruned)</td>
        <td><code>O(N)</code> stack</td>
        <td>Constraint-satisfaction assignment of specialized teams (Medical, Flood, General)</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== PAGE 3 ==================== -->
  <h2 class="section-heading">3. Application Screenshots &amp; Screen Analyses</h2>
  <p>
    Every visual artifact presented below has been captured directly from the live running application without modification:
  </p>

  <div class="figures-grid-2">
    <div class="figure-container">
      <div class="figure-header">
        <span class="figure-title">Figure 2: Clean Scenario Builder Canvas</span>
        <span class="figure-tag">Option A Blank State</span>
      </div>
      <img src="{SCREENSHOTS_DIR}/02_scenario_builder_blank.png" class="figure-image" alt="Blank Builder">
      <div class="figure-caption">
        <strong>Functionality:</strong> Shows the clean user-input starting canvas with 0 pre-filled incidents, 0 teams, and 0 relief packages. Operators configure custom scenarios from a clean state.
      </div>
    </div>

    <div class="figure-container">
      <div class="figure-header">
        <span class="figure-title">Figure 3: Configured Custom Scenario</span>
        <span class="figure-tag">Option A User Input</span>
      </div>
      <img src="{SCREENSHOTS_DIR}/03_scenario_builder_configured.png" class="figure-image" alt="Configured Scenario">
      <div class="figure-caption">
        <strong>Functionality:</strong> Custom scenario populated with user-added incidents, paramedic teams, relief cargo, and active road blockages toggled directly by clicking road segments on the SVG map.
      </div>
    </div>
  </div>

  <div class="figure-container">
    <div class="figure-header">
      <span class="figure-title">Figure 4: Pre-Flight Mission Verification &amp; Parameter Review Modal</span>
      <span class="figure-tag">Pre-Flight Audit</span>
    </div>
    <img src="{SCREENSHOTS_DIR}/04_mission_review.png" class="figure-image" alt="Mission Review">
    <div class="figure-caption">
      <strong>Functionality:</strong> Validates scenario integrity before algorithm execution. Computes total affected casualty demand, verifies team readiness, inspects road hazard blockages, and confirms vehicle payload constraints.
    </div>
  </div>

  <div class="figure-container">
    <div class="figure-header">
      <span class="figure-title">Figure 5: Operations Command Dashboard (Full Simulation Center)</span>
      <span class="figure-tag">Command Center</span>
    </div>
    <img src="{SCREENSHOTS_DIR}/05_simulation_dashboard.png" class="figure-image full-dash" alt="Dashboard">
    <div class="figure-caption">
      <strong>Functionality:</strong> The central operational hub. Integrates the left Merge-Sort triage queue, the interactive central SVG town map with active transit route highlights in cyan, and the right panel displaying Knapsack cargo and team dispatch.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== PAGE 4 ==================== -->
  <h2 class="section-heading">3. Application Screenshots (Core Subsystems Detail)</h2>

  <div class="figures-grid-2">
    <div class="figure-container">
      <div class="figure-header">
        <span class="figure-title">Figure 6: Town Road Network &amp; Graph Detail</span>
        <span class="figure-tag">SVG Graph</span>
      </div>
      <img src="{SCREENSHOTS_DIR}/06_interactive_town_map.png" class="figure-image" alt="Town Map">
      <div class="figure-caption">
        <strong>Functionality:</strong> High-detail graph view showing 13 municipal nodes, transit costs in minutes, blocked roads highlighted in red, and the active Bellman-Ford shortest route in neon cyan.
      </div>
    </div>

    <div class="figure-container">
      <div class="figure-header">
        <span class="figure-title">Figure 7: Incident Priority Queue</span>
        <span class="figure-tag">Merge Sort Queue</span>
      </div>
      <img src="{SCREENSHOTS_DIR}/07_priority_triage_queue.png" class="figure-image" alt="Priority Queue">
      <div class="figure-caption">
        <strong>Functionality:</strong> Left sidebar displaying incidents ordered by the 5-tier Merge Sort comparator with rank badges (#1, #2), urgency chips, medical markers, and live fulfillment statuses.
      </div>
    </div>
  </div>

  <div class="figures-grid-2">
    <div class="figure-container">
      <div class="figure-header">
        <span class="figure-title">Figure 8: Relief Cargo Packaging &amp; Team Details</span>
        <span class="figure-tag">0/1 Knapsack Panel</span>
      </div>
      <img src="{SCREENSHOTS_DIR}/08_resource_allocation_details.png" class="figure-image" alt="Relief Details">
      <div class="figure-caption">
        <strong>Functionality:</strong> Displays 0/1 Knapsack payload utilization (15/15 units, delivering 49 casualty benefit points), assigned team (Bravo General), and shortest path metrics.
      </div>
    </div>

    <div class="figure-container">
      <div class="figure-header">
        <span class="figure-title">Figure 9: Merge Sort Visualizer</span>
        <span class="figure-tag">Divide &amp; Conquer</span>
      </div>
      <img src="{SCREENSHOTS_DIR}/10_algo_visualizer_merge_sort.png" class="figure-image" alt="Merge Sort Visualizer">
      <div class="figure-caption">
        <strong>Functionality:</strong> Step-by-step trace showing recursive divide-and-conquer array halving, pairwise comparisons, and tie-breaking rationale for incident priority decisions.
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== PAGE 5 ==================== -->
  <h2 class="section-heading">3. Application Screenshots (Algorithm Visualizers &amp; Engineering Audit)</h2>

  <div class="figures-grid-2">
    <div class="figure-container">
      <div class="figure-header">
        <span class="figure-title">Figure 10: Bellman-Ford Edge Relaxation Visualizer</span>
        <span class="figure-tag">Dynamic Programming</span>
      </div>
      <img src="{SCREENSHOTS_DIR}/11_algo_visualizer_bellman_ford.png" class="figure-image" alt="Bellman-Ford Visualizer">
      <div class="figure-caption">
        <strong>Functionality:</strong> Step-by-step edge relaxation inspector displaying current passes, candidate distance calculations, relaxed edges, and the live distance vector snapshot table.
      </div>
    </div>

    <div class="figure-container">
      <div class="figure-header">
        <span class="figure-title">Figure 11: 0/1 Knapsack DP Table Visualizer</span>
        <span class="figure-tag">DP State Matrix</span>
      </div>
      <img src="{SCREENSHOTS_DIR}/12_algo_visualizer_knapsack_dp.png" class="figure-image" alt="Knapsack Visualizer">
      <div class="figure-caption">
        <strong>Functionality:</strong> Interactive (N+1)×(W+1) dynamic programming matrix rendering include vs exclude decisions for relief packages, complete with yellow backtracking path highlights.
      </div>
    </div>
  </div>

  <div class="figures-grid-2">
    <div class="figure-container">
      <div class="figure-header">
        <span class="figure-title">Figure 12: Backtracking Team Assignment Visualizer</span>
        <span class="figure-tag">State Space Tree</span>
      </div>
      <img src="{SCREENSHOTS_DIR}/13_algo_visualizer_backtracking.png" class="figure-image" alt="Backtracking Visualizer">
      <div class="figure-caption">
        <strong>Functionality:</strong> Displays the combinatorial state space tree. Green nodes represent feasible skill assignments; red nodes indicate constraint violations pruned immediately.
      </div>
    </div>

    <div class="figure-container">
      <div class="figure-header">
        <span class="figure-title">Figure 13: DAA Execution Audit &amp; Engineering Report</span>
        <span class="figure-tag">Printable Audit</span>
      </div>
      <img src="{SCREENSHOTS_DIR}/14_daa_audit_report.png" class="figure-image" alt="DAA Report">
      <div class="figure-caption">
        <strong>Functionality:</strong> Printable engineering report detailing operational KPIs, incident outcome tables (reachability, cargo dispatched, team assigned), road safety audits, and algorithm performance.
      </div>
    </div>
  </div>

  <div class="callout-box">
    <strong>Verification &amp; Test Suite Coverage:</strong> All four algorithm implementations and discrete-event simulation transitions are verified by 28 automated tests running in Vitest (17 algorithm tests and 11 simulation tests, 100% passing).
  </div>

  <h2 class="section-heading">4. Conclusion</h2>
  <p>
    <strong>RescueGrid</strong> demonstrates the direct application of fundamental Design and Analysis of Algorithms (DAA) concepts to life-critical humanitarian relief challenges. By formalizing real-world disaster coordination into well-defined mathematical problem instances:
  </p>
  <p>
    • <strong>Deterministic Incident Triage:</strong> Multi-criterion Merge Sort ensures that urgency level, life-threatening medical conditions, and high casualty counts dictate response order without subjective triage errors.<br>
    • <strong>Resilient Safe Routing:</strong> Bellman-Ford guarantees optimal travel routes from Headquarters to disaster zones while systematically bypassing impassable hazards and bridge collapses.<br>
    • <strong>Maximum Relief Impact:</strong> 0/1 Knapsack Dynamic Programming achieves mathematically optimal vehicle payload utilization, outperforming greedy heuristics and preventing vehicle overloading.<br>
    • <strong>Constraint-Satisfaction Dispatch:</strong> Backtracking eliminates capability mismatches (e.g. dispatching general units to surgical emergencies) and double-booking through systematic pruning.
  </p>
  <p>
    The system seamlessly integrates algorithm execution with an interactive SVG town map, comprehensive visual step-by-step traces, a clean custom scenario builder, and automated regression testing. RescueGrid stands as a robust, production-grade academic software project highlighting how algorithmic efficiency directly saves lives during municipal crises.
  </p>

</body>
</html>"""

    with open(HTML_OUT, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"HTML template written to: {HTML_OUT}")

    print("Rendering PDF via Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"file:///{HTML_OUT.replace(os.sep, '/')}")
        page.wait_for_load_state("networkidle")
        page.pdf(
            path=PDF_OUT,
            format="A4",
            print_background=True,
            margin={"top": "12mm", "bottom": "14mm", "left": "14mm", "right": "14mm"},
            display_header_footer=True,
            header_template="<span></span>",
            footer_template="""
            <div style="font-size: 8pt; font-family: 'Inter', sans-serif; color: #64748b; width: 100%; padding: 0 14mm; display: flex; justify-content: space-between;">
              <span>RescueGrid: Disaster Relief Optimization System · DAA Project Report</span>
              <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
            </div>
            """
        )
        browser.close()
    print(f"PDF successfully generated at: {PDF_OUT}")

def main():
    create_docx()
    create_pdf()
    print("\nVERIFICATION:")
    if os.path.exists(PDF_OUT):
        print(f"✓ PDF exists: {PDF_OUT} ({os.path.getsize(PDF_OUT):,} bytes)")
    else:
        print(f"✗ PDF NOT found: {PDF_OUT}")

    if os.path.exists(DOCX_OUT):
        print(f"✓ DOCX exists: {DOCX_OUT} ({os.path.getsize(DOCX_OUT):,} bytes)")
    else:
        print(f"✗ DOCX NOT found: {DOCX_OUT}")

if __name__ == "__main__":
    main()
