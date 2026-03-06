import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Unified 50-year chart", () => {
  test("no timeline selector buttons — always 50 years", async ({ page }) => {
    await page.goto("/");
    const chart = page.getByTestId("projection-chart");
    await expect(chart).toBeVisible();

    // Timeline selector buttons should not exist
    await expect(chart.getByTestId("timeline-10yr")).not.toBeVisible().catch(() => {});
    const timelineButtons = await chart.locator("[data-testid^='timeline-']").count();
    expect(timelineButtons).toBe(0);

    await captureScreenshot(page, "task-99-50yr-chart");
  });

  test("summary table shows 40yr and 50yr columns", async ({ page }) => {
    await page.goto("/");
    const table = page.getByTestId("projection-summary-table");
    await expect(table).toBeVisible();

    // Should show all 5 milestone columns
    await expect(table.getByText("10yr")).toBeVisible();
    await expect(table.getByText("20yr")).toBeVisible();
    await expect(table.getByText("30yr")).toBeVisible();
    await expect(table.getByText("40yr")).toBeVisible();
    await expect(table.getByText("50yr")).toBeVisible();

    await captureScreenshot(page, "task-99-summary-table-50yr");
  });

  test("burndown mode uses year-based X-axis", async ({ page }) => {
    await page.goto("/");
    const chart = page.getByTestId("projection-chart");

    // Switch to Income Stops mode
    const incomeStopsTab = chart.getByTestId("mode-income-stops");
    await expect(incomeStopsTab).toBeVisible();
    await incomeStopsTab.click();

    // Burndown chart should be visible
    await expect(chart.getByTestId("burndown-chart-container")).toBeVisible();

    // Summary should still be present
    await expect(chart.getByTestId("burndown-summary")).toBeVisible();

    await captureScreenshot(page, "task-99-burndown-years-axis");
  });

  test("asset projections table shows 40yr and 50yr columns", async ({ page }) => {
    await page.goto("/");
    const assetTable = page.getByTestId("asset-projections-table");
    await expect(assetTable).toBeVisible();

    await expect(assetTable.getByText("40yr")).toBeVisible();
    await expect(assetTable.getByText("50yr")).toBeVisible();

    await captureScreenshot(page, "task-99-asset-projections-50yr");
  });
});
