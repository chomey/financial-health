import { Page } from "@playwright/test";
import path from "path";

const SCREENSHOTS_DIR = path.join(process.cwd(), "screenshots");

/**
 * Capture a screenshot to the screenshots/ directory.
 * Only captures when CAPTURE_SCREENSHOTS=1 is set (e.g., during Ralph task commits).
 * Normal test runs skip screenshot capture to avoid overwriting committed task screenshots.
 */
export async function captureScreenshot(
  page: Page,
  name: string
): Promise<string> {
  const filepath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  if (process.env.CAPTURE_SCREENSHOTS === "1") {
    await page.screenshot({ path: filepath, fullPage: true });
  }
  return filepath;
}
