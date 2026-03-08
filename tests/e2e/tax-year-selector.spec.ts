import { test, expect } from "@playwright/test";

const screenshotDir = process.env.CAPTURE_SCREENSHOTS
  ? `screenshots/task-${process.env.CAPTURE_TASK ?? "unknown"}`
  : undefined;

test.describe("Tax Year Selector", () => {
  test.beforeEach(async ({ page }) => {
    // Prevent the mobile wizard from blocking UI interactions
    await page.addInitScript(() => {
      localStorage.setItem("fhs-wizard-done", "1");
    });
    await page.goto("/");
    // Wait for the page to hydrate
    await page.waitForSelector('[data-testid="country-jurisdiction-selector"]');
  });

  test("renders 2025 and 2026 tax year buttons", async ({ page }) => {
    const btn2025 = page.getByTestId("tax-year-2025");
    const btn2026 = page.getByTestId("tax-year-2026");

    await expect(btn2025).toBeVisible();
    await expect(btn2026).toBeVisible();
    // 2025 should be active by default
    await expect(btn2025).toHaveAttribute("aria-pressed", "true");
    await expect(btn2026).toHaveAttribute("aria-pressed", "false");

    if (screenshotDir) {
      await page.screenshot({
        path: `${screenshotDir}-tax-year-default.png`,
        fullPage: false,
      });
    }
  });

  test("switching tax year updates button state", async ({ page }) => {
    const btn2025 = page.getByTestId("tax-year-2025");
    const btn2026 = page.getByTestId("tax-year-2026");

    // Click 2026
    await btn2026.click();
    await expect(btn2026).toHaveAttribute("aria-pressed", "true");
    await expect(btn2025).toHaveAttribute("aria-pressed", "false");

    if (screenshotDir) {
      await page.screenshot({
        path: `${screenshotDir}-tax-year-2026.png`,
        fullPage: false,
      });
    }

    // Click back to 2025
    await btn2025.click();
    await expect(btn2025).toHaveAttribute("aria-pressed", "true");
    await expect(btn2026).toHaveAttribute("aria-pressed", "false");
  });

  test("tax year persists in URL state", async ({ page }) => {
    // Switch to 2026
    await page.getByTestId("tax-year-2026").click();

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Reload the page
    const url = page.url();
    await page.goto(url);
    await page.waitForSelector('[data-testid="tax-year-2026"]');

    // 2026 should still be selected after reload
    const btn2026 = page.getByTestId("tax-year-2026");
    await expect(btn2026).toHaveAttribute("aria-pressed", "true");
  });
});
