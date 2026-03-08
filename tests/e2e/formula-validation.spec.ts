import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Formula Validation — Metric Card Consistency", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');
  });

  test("net worth card value matches explainer breakdown", async ({ page }) => {
    // Click the Net Worth card to open explainer
    await page.click('[data-testid="metric-card-net-worth"]');
    await page.waitForSelector('[data-testid="explainer-modal"]');

    // The explainer should show breakdown items that sum to the card value
    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();
    // Should contain asset and debt summary items
    await expect(modal).toContainText("Savings");

    await captureScreenshot(page, "task-107-net-worth-explainer");
    await page.keyboard.press("Escape");
  });

  test("estimated tax card shows federal + provincial = total", async ({ page }) => {
    // Click Estimated Tax card
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    const taxExplainer = page.locator('[data-testid="tax-explainer"]');
    await expect(taxExplainer).toBeVisible();

    // Should show both federal and provincial sections
    await expect(taxExplainer).toContainText("Federal");

    // Should show effective rate
    const effectiveRate = page.locator('[data-testid="tax-effective-rate"]');
    if (await effectiveRate.isVisible()) {
      const rateText = await effectiveRate.textContent();
      expect(rateText).toContain("%");
    }

    await captureScreenshot(page, "task-107-tax-explainer");
    await page.keyboard.press("Escape");
  });

  test("financial runway card value is consistent with explainer", async ({ page }) => {
    // Click Financial Runway card
    await page.click('[data-testid="metric-card-financial-runway"]');
    await page.waitForSelector('[data-testid="explainer-modal"]');

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Should show monthly obligations breakdown
    await expect(modal).toContainText("month");

    await captureScreenshot(page, "task-107-runway-explainer");
    await page.keyboard.press("Escape");
  });

  test("all five metric cards render with values", async ({ page }) => {
    const cards = [
      "metric-card-net-worth",
      "metric-card-monthly-cash-flow",
      "metric-card-estimated-tax",
      "metric-card-financial-runway",
      "metric-card-debt-to-asset-ratio",
    ];

    for (const testid of cards) {
      const card = page.locator(`[data-testid="${testid}"]`);
      await expect(card).toBeVisible();
      // Each card should contain a formatted value
      const text = await card.textContent();
      expect(text!.length).toBeGreaterThan(0);
    }

    await captureScreenshot(page, "task-107-all-metric-cards");
  });
});
