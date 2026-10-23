import os
import time
from playwright.sync_api import sync_playwright

SCREENSHOT_DIR = r"d:\TY\DAA\disaster\docs\screenshots"

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1600, "height": 1000},
            device_scale_factor=2
        )
        page = context.new_page()
        page.goto("http://localhost:5173/")
        page.wait_for_load_state("networkidle")
        time.sleep(1)

        # Launch Normal Rescue demo
        page.locator("text=Normal Rescue").first.click()
        time.sleep(1.5)

        # 6. Central Town Map panel
        print("Capturing 06_interactive_town_map.png...")
        page.locator(".panel-center").first.screenshot(path=os.path.join(SCREENSHOT_DIR, "06_interactive_town_map.png"))

        # 7. Left Priority Panel
        print("Capturing 07_priority_triage_queue.png...")
        page.locator(".panel-left").first.screenshot(path=os.path.join(SCREENSHOT_DIR, "07_priority_triage_queue.png"))

        # 8. Right Details Panel
        print("Capturing 08_resource_allocation_details.png...")
        page.locator(".panel-right").first.screenshot(path=os.path.join(SCREENSHOT_DIR, "08_resource_allocation_details.png"))

        # Advance simulation to show active progress
        step_btn = page.locator("button[title*='Step Forward']").first
        if step_btn.is_visible():
            for _ in range(3):
                step_btn.click()
                time.sleep(0.3)
        time.sleep(1)
        print("Capturing 09_simulation_in_progress.png...")
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "09_simulation_in_progress.png"))

        browser.close()
        print("Panels captured successfully!")

if __name__ == "__main__":
    main()
