import { Page, test as base } from "@playwright/test";
import path from "path";

const SCREENSHOTS_DIR = path.join(process.cwd(), "screenshots");

/**
 * Capture a screenshot to the screenshots/ directory.
 * Only captures when CAPTURE_SCREENSHOTS=1 is set (e.g., during Ralph task commits).
 * Normal test runs skip screenshot capture to avoid overwriting committed task screenshots.
 *
 * If CAPTURE_TASK is set (e.g., CAPTURE_TASK=102), only screenshots whose name
 * contains that task number will be written. This prevents the full Playwright
 * suite from overwriting screenshots from other tasks.
 */
/**
 * Navigate to the dashboard phase, skipping the wizard.
 * Most E2E tests expect the dashboard — use this instead of page.goto("/").
 */
export async function gotoDashboard(page: Page): Promise<void> {
  await page.goto("/?step=dashboard");
}

/**
 * Custom test fixture that auto-navigates to the dashboard before each test.
 * Use: import { test } from "./helpers" instead of from "@playwright/test"
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    // Override page.goto to auto-append step=dashboard for bare "/" navigations
    const originalGoto = page.goto.bind(page);
    page.goto = async (url: string, options?: Parameters<Page["goto"]>[1]) => {
      // If navigating to bare "/" or "/?..." without step= param, add step=dashboard
      if (url === "/" || url === "") {
        url = "/?step=dashboard";
      } else if (url.startsWith("/?") && !url.includes("step=")) {
        url = url + "&step=dashboard";
      }
      return originalGoto(url, options);
    };
    await use(page);
  },
});

export async function captureScreenshot(
  page: Page,
  name: string
): Promise<string> {
  const filepath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  if (process.env.CAPTURE_SCREENSHOTS === "1") {
    const taskFilter = process.env.CAPTURE_TASK;
    if (taskFilter && !name.includes(`task-${taskFilter}`)) {
      return filepath; // Skip — not the current task's screenshot
    }
    await page.screenshot({ path: filepath, fullPage: true });
  }
  return filepath;
}
