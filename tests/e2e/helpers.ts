import { Page } from "@playwright/test";
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
