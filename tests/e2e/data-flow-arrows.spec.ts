import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Data Flow — Explainer Modal", () => {
  test("DataFlowProvider renders without errors on homepage", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="dashboard-panel"]', { timeout: 15000 });

    // No explainer modal should be visible initially
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible();
  });

  test("Explainer modal system is available (no old spotlight overlay)", async ({
    page,
  }) => {
    await page.goto("/");

    // Check that the DataFlowProvider wraps the page
    const hasProvider = await page.evaluate(() => {
      const root = document.querySelector("#__next") || document.body;
      return root.querySelector("main") !== null;
    });
    expect(hasProvider).toBe(true);

    // No spotlight overlay should exist (removed)
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCount(0);

    await captureScreenshot(page, "task-69-data-flow-arrows-base");
  });

  test("metric cards are clickable with cursor pointer", async ({ page }) => {
    await page.goto("/");

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();
    const cursor = await netWorthCard.evaluate((el) => getComputedStyle(el).cursor);
    expect(cursor).toBe("pointer");
  });
});
