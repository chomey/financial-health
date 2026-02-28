import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Expense Breakdown Chart", () => {
  test("renders spending breakdown chart with expense data", async ({ page }) => {
    await page.goto("/");
    // Wait for the chart to render
    const chart = page.locator('[data-testid="expense-breakdown-chart"]');
    await expect(chart).toBeVisible();
    await expect(chart.locator("text=Spending Breakdown")).toBeVisible();
  });

  test("shows expense categories in the legend", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator('[data-testid="expense-breakdown-chart"]');
    // Scroll the chart into view so all legend items are rendered
    await chart.scrollIntoViewIfNeeded();
    await expect(chart).toBeVisible();

    // Wait for chart animations to complete
    await page.waitForTimeout(1000);

    // Default mock expenses should appear in the compact legend below the chart
    // The chart includes the legend text as visible HTML (not SVG)
    const chartText = await chart.textContent();
    expect(chartText).toContain("Rent/Mortgage Payment");
    expect(chartText).toContain("Groceries");
    expect(chartText).toContain("Subscriptions");
  });

  test("shows income vs expenses comparison bar", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator('[data-testid="expense-breakdown-chart"]');
    const comparison = chart.locator('[data-testid="income-vs-expenses"]');
    await expect(comparison).toBeVisible();
    // Should show expenses and income amounts
    await expect(comparison.locator("text=/Expenses:/")).toBeVisible();
    await expect(comparison.locator("text=/Income:/")).toBeVisible();
  });

  test("shows auto-generated tax categories with auto badge", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator('[data-testid="expense-breakdown-chart"]');
    await expect(chart).toBeVisible();

    // Default state has salary income, so taxes should appear
    // Look for the "auto" badge text within the chart
    const autoBadges = chart.locator("text=auto");
    const badgeCount = await autoBadges.count();
    expect(badgeCount).toBeGreaterThan(0);
  });

  test("chart is positioned between metrics and allocation chart in dashboard", async ({ page }) => {
    await page.goto("/");
    const dashboard = page.locator('[aria-label="Financial dashboard"]');
    await expect(dashboard).toBeVisible();

    const expenseChart = dashboard.locator('[data-testid="expense-breakdown-chart"]');
    const allocationChart = dashboard.locator('[data-testid="allocation-chart"]');
    await expect(expenseChart).toBeVisible();
    await expect(allocationChart).toBeVisible();

    // Expense chart should be above allocation chart
    const expenseBox = await expenseChart.boundingBox();
    const allocationBox = await allocationChart.boundingBox();
    expect(expenseBox!.y).toBeLessThan(allocationBox!.y);
  });

  test("captures screenshot of expense breakdown", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator('[data-testid="expense-breakdown-chart"]');
    await expect(chart).toBeVisible();
    // Wait a beat for chart animations
    await page.waitForTimeout(800);
    await captureScreenshot(page, "task-49-expense-breakdown-chart");
  });
});
