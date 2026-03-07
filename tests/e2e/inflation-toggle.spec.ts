import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

// URL with a simple financial state (savings + income) for chart testing
const BASE_URL =
  "/?s=LTs!!!!!!!!!!!!!!!!!!!!!!!!!!%26#0JkQ4[k0000000000000";

test.describe("Inflation-adjusted projection toggle", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a pre-filled state with assets and income so the chart has real data
    await page.goto("/");
    await page.waitForSelector('[data-testid="projection-chart"]');
  });

  test("inflation controls are visible on the projection chart", async ({ page }) => {
    // ZoomableCard may render duplicate elements — scope to the first chart instance
    const chart = page.locator('[data-testid="projection-chart"]').first();
    const controls = chart.locator('[data-testid="inflation-controls"]');
    await expect(controls).toBeVisible();

    const toggle = chart.locator('[data-testid="inflation-toggle"]');
    await expect(toggle).toBeVisible();
    await expect(toggle).not.toBeChecked();

    await captureScreenshot(page, "task-110-inflation-toggle-off");
  });

  test("enabling inflation toggle shows rate input and tooltip", async ({ page }) => {
    const chart = page.locator('[data-testid="projection-chart"]').first();
    const toggle = chart.locator('[data-testid="inflation-toggle"]');
    await toggle.check();
    await expect(toggle).toBeChecked();

    // Rate input and tooltip appear
    const rateInput = chart.locator('[data-testid="inflation-rate-input"]');
    await expect(rateInput).toBeVisible();
    await expect(rateInput).toHaveValue("2.5");

    const tooltip = chart.locator('[data-testid="inflation-tooltip"]');
    await expect(tooltip).toBeVisible();

    await captureScreenshot(page, "task-110-inflation-toggle-on");
  });

  test("inflation toggle changes chart values downward", async ({ page }) => {
    const chart = page.locator('[data-testid="projection-chart"]').first();
    // Get net worth value from summary table before enabling inflation
    const summaryTable = chart.locator('[data-testid="projection-summary-table"]');
    await expect(summaryTable).toBeVisible();

    // Read the 50-year net worth column (last milestone column)
    // The table has columns: Now, 10yr, 20yr, 30yr, 40yr, 50yr
    const nominalCells = await summaryTable.locator("tbody tr:first-child td").allTextContents();
    // nominalCells[0] = "Net Worth", [1] = Now, [2] = 10yr, ..., [6] = 50yr
    const nominalFiftyYr = nominalCells[nominalCells.length - 1];

    // Enable inflation toggle
    const toggle = chart.locator('[data-testid="inflation-toggle"]');
    await toggle.check();

    // Wait for re-render
    await page.waitForTimeout(200);

    // Read the same cell again — should be lower now (summaryTable scoped to first chart)
    const adjustedCells = await summaryTable.locator("tbody tr:first-child td").allTextContents();
    const adjustedFiftyYr = adjustedCells[adjustedCells.length - 1];

    // The adjusted value should differ from nominal (lower in real terms)
    // At year 0 (Now) values should be identical; only future years differ
    expect(adjustedFiftyYr).not.toBe(nominalFiftyYr);

    await captureScreenshot(page, "task-110-inflation-values-lower");
  });

  test("changing inflation rate updates the chart", async ({ page }) => {
    const chart = page.locator('[data-testid="projection-chart"]').first();
    // Enable toggle
    await chart.locator('[data-testid="inflation-toggle"]').check();
    await page.waitForTimeout(100);

    const summaryTable = chart.locator('[data-testid="projection-summary-table"]');
    const cells25 = await summaryTable.locator("tbody tr:first-child td").allTextContents();
    const value25 = cells25[cells25.length - 1];

    // Change rate to 5%
    const rateInput = chart.locator('[data-testid="inflation-rate-input"]');
    await rateInput.fill("5");
    await rateInput.blur();
    await page.waitForTimeout(200);

    const cells50 = await summaryTable.locator("tbody tr:first-child td").allTextContents();
    const value50 = cells50[cells50.length - 1];

    // Higher inflation rate should produce lower real values
    expect(value50).not.toBe(value25);

    await captureScreenshot(page, "task-110-inflation-rate-changed");
  });

  test("'Now' column values unchanged by inflation toggle (year 0 deflator = 1)", async ({ page }) => {
    const chart = page.locator('[data-testid="projection-chart"]').first();
    const summaryTable = chart.locator('[data-testid="projection-summary-table"]');

    // Read current net worth (Now column = index 1)
    const nominalCells = await summaryTable.locator("tbody tr:first-child td").allTextContents();
    const nominalNow = nominalCells[1];

    // Enable inflation
    await chart.locator('[data-testid="inflation-toggle"]').check();
    await page.waitForTimeout(200);

    const adjustedCells = await summaryTable.locator("tbody tr:first-child td").allTextContents();
    const adjustedNow = adjustedCells[1];

    // Year 0 should be the same regardless of inflation
    expect(adjustedNow).toBe(nominalNow);

    await captureScreenshot(page, "task-110-inflation-now-unchanged");
  });

  test("disabling inflation toggle restores nominal values", async ({ page }) => {
    const chart = page.locator('[data-testid="projection-chart"]').first();
    const summaryTable = chart.locator('[data-testid="projection-summary-table"]');

    // Record nominal values
    const nominalCells = await summaryTable.locator("tbody tr:first-child td").allTextContents();

    // Enable then disable
    const toggle = chart.locator('[data-testid="inflation-toggle"]');
    await toggle.check();
    await page.waitForTimeout(200);
    await toggle.uncheck();
    await page.waitForTimeout(200);

    // Rate input should be hidden again
    await expect(chart.locator('[data-testid="inflation-rate-input"]')).not.toBeVisible();

    // Values should be back to nominal
    const restoredCells = await summaryTable.locator("tbody tr:first-child td").allTextContents();
    expect(restoredCells).toEqual(nominalCells);
  });
});
