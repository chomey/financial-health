import { Page } from "@playwright/test";
import path from "path";

const SCREENSHOTS_DIR = path.join(process.cwd(), "screenshots");

/**
 * Capture a screenshot and save it to the screenshots/ directory.
 * @param page - Playwright page instance
 * @param name - Descriptive filename (without extension), e.g. "task-2-home-loaded"
 * @returns The full path to the saved screenshot
 */
export async function captureScreenshot(
  page: Page,
  name: string
): Promise<string> {
  const filename = `${name}.png`;
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}
