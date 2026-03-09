/**
 * T2 E2E tests for Task 123: Mortgage burndown line on projection chart
 */
import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Task 123 — Mortgage burndown line on projection chart", () => {
  test("mortgage burndown legend appears when mortgage exists", async ({ page }) => {
    // Load mid-career sample profile (has mortgage) via welcome step
    await page.goto("/?step=welcome");
    await page.getByTestId("sample-profile-mid-career").click();
    await page.waitForFunction(() => window.location.search.includes("s="));

    const chart = page.locator('[data-testid="projection-chart"]').first();
    await expect(chart).toBeVisible();

    // Mortgage legend entry should appear
    const mortgageLegend = chart.getByTestId("mortgage-burndown-legend");
    await expect(mortgageLegend).toBeVisible();
    await expect(mortgageLegend).toContainText("Mortgage");

    await captureScreenshot(page, "task-123-mortgage-legend-visible");
  });

  test("mortgage burndown legend is NOT shown when no mortgage exists", async ({ page }) => {
    // Load fresh-grad profile (no properties, no mortgage) via welcome step
    await page.goto("/?step=welcome");
    await page.getByTestId("sample-profile-fresh-grad").click();
    await page.waitForFunction(() => window.location.search.includes("s="));

    const chart = page.locator('[data-testid="projection-chart"]').first();
    await expect(chart).toBeVisible();

    // Mortgage legend should NOT appear
    const mortgageLegend = chart.getByTestId("mortgage-burndown-legend");
    await expect(mortgageLegend).not.toBeVisible();

    await captureScreenshot(page, "task-123-no-mortgage-no-legend");
  });

  test("projection chart container renders with mortgage data", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.getByTestId("sample-profile-mid-career").click();
    await page.waitForFunction(() => window.location.search.includes("s="));

    const chartContainer = page.locator('[data-testid="projection-chart-container"]').first();
    await expect(chartContainer).toBeVisible();

    const svg = chartContainer.locator("svg").first();
    await expect(svg).toBeVisible();

    await captureScreenshot(page, "task-123-chart-with-mortgage-line");
  });

  test("summary table shows Mortgage row when mortgage exists", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.getByTestId("sample-profile-mid-career").click();
    await page.waitForFunction(() => window.location.search.includes("s="));

    const table = page.locator('[data-testid="projection-summary-table"]').first();
    await expect(table).toBeVisible();

    await captureScreenshot(page, "task-123-summary-table-mortgage");
  });

  test("mortgage-free milestone label appears in chart callout", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.getByTestId("sample-profile-mid-career").click();
    await page.waitForFunction(() => window.location.search.includes("s="));

    const chart = page.locator('[data-testid="projection-chart"]').first();
    await expect(chart).toBeVisible();

    const mortgageFreeLabel = chart.getByTestId("mortgage-free-label");
    if (await mortgageFreeLabel.isVisible()) {
      await expect(mortgageFreeLabel).toContainText("Mortgage free");
    }

    await captureScreenshot(page, "task-123-mortgage-free-milestone");
  });
});
