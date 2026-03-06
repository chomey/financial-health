import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Tiered Bracket Bars Visualization", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-estimated-tax"]');
  });

  test("displays tiered bracket bars with fill for income brackets", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    // Federal bracket bars should be visible
    const federalTable = page.locator('[data-testid="tax-federal-brackets-table"]');
    await expect(federalTable).toBeVisible();

    // At least one filled bracket bar
    const fills = page.locator('[data-testid^="tax-federal-brackets-fill-"]');
    expect(await fills.count()).toBeGreaterThan(0);

    // Fill bars should have colored backgrounds (green palette)
    const firstFill = fills.first();
    const bgColor = await firstFill.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).not.toBe("rgba(0, 0, 0, 0)");

    // Multiple bracket rows should exist (filled and unfilled)
    const rows = page.locator('[data-testid^="tax-federal-brackets-row-"]');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(1);

    await captureScreenshot(page, "task-102-tiered-bracket-bars");
  });

  test("shows provincial tiered bracket bars separately", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    // Provincial bracket bars should also be visible
    const provincialTable = page.locator('[data-testid="tax-provincial-brackets-table"]');
    await expect(provincialTable).toBeVisible();

    // Provincial rows should exist
    const provRows = page.locator('[data-testid^="tax-provincial-brackets-row-"]');
    expect(await provRows.count()).toBeGreaterThan(0);

    // Provincial subtotal
    const provSubtotal = page.locator('[data-testid="tax-provincial-brackets-subtotal"]');
    await expect(provSubtotal).toBeVisible();

    await captureScreenshot(page, "task-102-provincial-bracket-bars");
  });

  test("bracket rows show range, rate, and tax amount", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    const row0 = page.locator('[data-testid="tax-federal-brackets-row-0"]');
    await expect(row0).toBeVisible();

    // Should contain a rate percentage
    const text = await row0.textContent();
    expect(text).toMatch(/\d+\.\d+%/);
    // Should contain a dollar amount
    expect(text).toMatch(/\$/);
  });

  test("brackets have fewer fills than total rows (unfilled brackets exist)", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    // Total bracket rows include unfilled brackets above income level
    const rows = page.locator('[data-testid^="tax-federal-brackets-row-"]');
    const rowCount = await rows.count();

    // Filled bracket bars should be fewer than total rows
    const fills = page.locator('[data-testid^="tax-federal-brackets-fill-"]');
    const fillCount = await fills.count();

    expect(rowCount).toBeGreaterThan(fillCount);

    await captureScreenshot(page, "task-102-unfilled-bracket-tiers");
  });
});
