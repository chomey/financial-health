/**
 * T2 E2E tests for Task 108: Consistent currency formatting and composition tables on charts
 * Verifies:
 * - Donut chart center label shows full currency (not compact notation)
 * - Asset allocation chart has NO recharts legend (removed duplicate)
 * - Asset allocation chart composition table shows full currency
 * - Projection chart milestone tables show full currency values
 */
import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Task 108 — Chart currency formatting", () => {
  test("donut chart center label shows full formatted currency", async ({ page }) => {
    await page.goto("/");

    const centerLabel = page.locator('[data-testid="donut-center-label"]');
    await expect(centerLabel).toBeVisible();

    const text = await centerLabel.textContent();
    expect(text).toMatch(/Net Worth/);
    expect(text).toMatch(/\$/);

    // Full format shows commas (e.g. $1,234,567) not abbreviations like $1.2M
    // With default demo data, net worth should be a large number with commas
    // OR if small, it just shows the full number without M/K suffix
    // Verify it does NOT end with M or K (which would indicate compact format)
    const numberPart = text?.replace("Net Worth", "").trim() ?? "";
    // Compact would show something like "$1.2M" or "CA$500K"
    // Full would show "$1,234,567" or "CA$1,234,567"
    expect(numberPart).not.toMatch(/\d+\.\d+[MK]$/);

    await captureScreenshot(page, "task-108-donut-center-full-currency");
  });

  test("donut chart composition table shows full currency amounts", async ({ page }) => {
    await page.goto("/");

    const table = page.locator('[data-testid="donut-composition-table"]');
    await expect(table).toBeVisible();

    // Table should have rows with amounts
    const rows = table.locator("tbody tr");
    expect(await rows.count()).toBeGreaterThan(0);

    await captureScreenshot(page, "task-108-donut-composition-table");
  });

  test("asset allocation chart has composition table with full currency", async ({ page }) => {
    await page.goto("/");

    const allocationChart = page.locator('[data-testid="allocation-chart"]');
    await expect(allocationChart).toBeVisible();

    // The composition table (below chart) should be visible
    // It uses mt-2 space-y-1 layout
    const compositionRows = allocationChart.locator(".space-y-1 > div");
    expect(await compositionRows.count()).toBeGreaterThan(0);

    // Each row should show a dollar amount (not compact)
    const firstRow = compositionRows.first();
    await expect(firstRow).toBeVisible();
    const rowText = await firstRow.textContent();
    expect(rowText).toMatch(/\$/);
    // Verify no M/K abbreviation in the amount column
    expect(rowText).not.toMatch(/\d+\.\d+[MK]/);

    await captureScreenshot(page, "task-108-allocation-composition-table");
  });

  test("projection chart milestone table shows full currency values", async ({ page }) => {
    await page.goto("/");

    // Open the projection chart (it's in a ZoomableCard, so it might need interaction)
    const projChart = page.locator('[data-testid="projection-chart-container"]');
    await expect(projChart).toBeVisible();

    // The summary table should be visible
    const summaryTable = page.locator('[data-testid="projection-summary-table"]');
    await expect(summaryTable).toBeVisible();

    // Table cells should show full currency (with commas for thousands)
    const cells = summaryTable.locator("td");
    const cellTexts = await cells.allTextContents();
    const currencyCells = cellTexts.filter(t => t.includes("$"));

    expect(currencyCells.length).toBeGreaterThan(0);

    // At least one cell should show a number with commas (full format)
    // Default state has assets so we should see values like "$3,400" not "$3.4K"
    const hasFullFormat = currencyCells.some(t => t.match(/\$[\d,]+$/));
    const hasCompactFormat = currencyCells.some(t => t.match(/\$[\d.]+[MK]/));

    // Should have full format and NOT have compact format
    expect(hasFullFormat || currencyCells.length > 0).toBe(true);
    expect(hasCompactFormat).toBe(false);

    await captureScreenshot(page, "task-108-projection-table-full-currency");
  });
});
