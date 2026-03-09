import { Page, test as base } from "@playwright/test";
import path from "path";

const SCREENSHOTS_DIR = path.join(process.cwd(), "screenshots");

/**
 * Capture a screenshot to the screenshots/ directory.
 * Only captures when CAPTURE_TASK is set (e.g., CAPTURE_TASK=102).
 * Screenshots whose name contains `task-{CAPTURE_TASK}` are written;
 * all others are skipped. Normal test runs (no CAPTURE_TASK) skip all captures.
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

/**
 * Override the Playwright storageState default of advanced mode.
 * Call before navigation in tests that need simple mode.
 */
export async function setSimpleMode(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("fhs-default-mode", "simple");
  });
}

export async function captureScreenshot(
  page: Page,
  name: string
): Promise<string> {
  const filepath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  const taskFilter = process.env.CAPTURE_TASK;
  if (taskFilter && name.includes(`task-${taskFilter}`)) {
    await page.screenshot({ path: filepath, fullPage: true });
  }
  return filepath;
}
