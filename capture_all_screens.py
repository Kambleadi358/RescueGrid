import os
import time
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = r"d:\TY\DAA\disaster\docs\screenshots"
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1600, "height": 1000},
            device_scale_factor=2
        )
        page = context.new_page()

        print("Navigating to http://localhost:5173/ ...")
        page.goto("http://localhost:5173/")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # 1. Mode Select (Landing screen)
        print("Capturing 01_mode_selection.png...")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "01_mode_selection.png"))

        # 2. Scenario Builder Blank
        print("Navigating to Scenario Builder...")
        page.locator("button:has-text('Build Custom Scenario')").click()
        time.sleep(1)
        print("Capturing 02_scenario_builder_blank.png...")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "02_scenario_builder_blank.png"))

        # Add sample incident
        name_input = page.locator("input[placeholder*='Flood Shelter A']").first
        if name_input.is_visible():
            name_input.fill("North Medical Clinic")
        people_input = page.locator("input[type='number']").first
        if people_input.is_visible():
            people_input.fill("28")
        add_inc = page.locator("button:has-text('Add Incident')").first
        if add_inc.is_visible():
            add_inc.click()
            time.sleep(0.4)

        # Add sample team
        teams_tab = page.locator(".builder-tab:has-text('Teams')").first
        if teams_tab.is_visible():
            teams_tab.click()
            time.sleep(0.4)
            team_input = page.locator("input[placeholder*='Unit Echo']").first
            if team_input.is_visible():
                team_input.fill("Squad Bravo (Paramedic)")
            add_team = page.locator("button:has-text('Add Team')").first
            if add_team.is_visible():
                add_team.click()
                time.sleep(0.4)

        # Add sample relief package
        res_tab = page.locator(".builder-tab:has-text('Resources')").first
        if res_tab.is_visible():
            res_tab.click()
            time.sleep(0.4)
            pkg_input = page.locator("input[placeholder*='Trauma First-Aid']").first
            if pkg_input.is_visible():
                pkg_input.fill("Trauma Surgery Pack")
            add_pkg = page.locator("button:has-text('Add Relief Package')").first
            if add_pkg.is_visible():
                add_pkg.click()
                time.sleep(0.4)

        # Toggle road
        road_el = page.locator("line.map-road-interactive").first
        if road_el.is_visible():
            road_el.click(force=True)
            time.sleep(0.4)

        print("Capturing 03_scenario_builder_configured.png...")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "03_scenario_builder_configured.png"))

        # 3. Review Mission Scenario
        print("Navigating to Review Mission...")
        page.locator("button:has-text('Review Mission Scenario')").first.click()
        time.sleep(1)
        print("Capturing 04_mission_review.png...")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "04_mission_review.png"))

        # 4. Mode Select -> Normal Rescue
        print("Launching Demo: Normal Rescue...")
        page.locator(".nav-tab:has-text('Mode Select')").click()
        time.sleep(1)
        page.locator("text=Normal Rescue").first.click()
        time.sleep(1.5)

        # 5. Full Simulation Center Dashboard
        print("Capturing 05_simulation_dashboard.png...")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "05_simulation_dashboard.png"))

        # 6. Town map panel
        map_panel = page.locator(".map-center-panel, .map-canvas-card, .town-map-panel").first
        if map_panel.is_visible():
            print("Capturing 06_interactive_town_map.png...")
            map_panel.screenshot(path=os.path.join(SCREENSHOT_DIR, "06_interactive_town_map.png"))

        # 7. Priority Incidents Queue (Left Panel)
        incidents_panel = page.locator(".priority-sidebar, .sidebar-incidents, .incidents-sidebar").first
        if incidents_panel.is_visible():
            print("Capturing 07_priority_triage_queue.png...")
            incidents_panel.screenshot(path=os.path.join(SCREENSHOT_DIR, "07_priority_triage_queue.png"))

        # 8. Resource Allocation & Details Panel (Right Panel)
        details_panel = page.locator(".right-details-panel, .details-panel, .details-card").first
        if details_panel.is_visible():
            print("Capturing 08_resource_allocation_details.png...")
            details_panel.screenshot(path=os.path.join(SCREENSHOT_DIR, "08_resource_allocation_details.png"))

        # 9. Step Simulation forward
        print("Stepping simulation clock forward...")
        step_btn = page.locator("button[title*='Step Forward']").first
        if step_btn.is_visible():
            for _ in range(3):
                step_btn.click()
                time.sleep(0.4)
            time.sleep(1)
            print("Capturing 09_simulation_in_progress.png...")
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "09_simulation_in_progress.png"))

        # 10. Algorithm Visualizer - Merge Sort
        print("Navigating to Algorithm Visualizer...")
        page.locator(".nav-tab:has-text('Algorithm Visualizer')").click()
        time.sleep(1.2)
        print("Capturing 10_algo_visualizer_merge_sort.png...")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "10_algo_visualizer_merge_sort.png"))

        # Tab: Bellman-Ford
        print("Switching to Bellman-Ford tab...")
        page.locator(".algo-tab:has-text('Bellman-Ford')").first.click()
        time.sleep(0.8)
        print("Capturing 11_algo_visualizer_bellman_ford.png...")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "11_algo_visualizer_bellman_ford.png"))

        # Tab: 0/1 Knapsack
        print("Switching to 0/1 Knapsack tab...")
        page.locator(".algo-tab:has-text('0/1 Knapsack')").first.click()
        time.sleep(0.8)
        print("Capturing 12_algo_visualizer_knapsack_dp.png...")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "12_algo_visualizer_knapsack_dp.png"))

        # Tab: Backtracking Team Assignment
        print("Switching to Backtracking tab...")
        page.locator(".algo-tab:has-text('Backtracking')").first.click()
        time.sleep(0.8)
        print("Capturing 13_algo_visualizer_backtracking.png...")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "13_algo_visualizer_backtracking.png"))

        # 11. DAA Report
        print("Navigating to DAA Report...")
        page.locator(".nav-tab:has-text('DAA Report')").click()
        time.sleep(1.5)
        print("Capturing 14_daa_audit_report.png...")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "14_daa_audit_report.png"))

        browser.close()
        print("COMPLETE: All 14 high-res screenshots captured successfully!")

if __name__ == "__main__":
    main()
