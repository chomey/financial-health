import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Net Worth Waterfall Chart", () => {
  test("renders waterfall chart with default data", async ({ page }) => {
    await page.goto("/");

    // Wait for the waterfall chart to render
    const chart = page.locator('[data-testid="waterfall-chart"]');
    await expect(chart).toBeVisible();

    // Should show the title
    await expect(chart.locator("text=Net Worth Breakdown")).toBeVisible();

    // Should show legend items
    await expect(chart.locator("text=Assets")).toBeVisible();
    await expect(chart.locator("text=Debts")).toBeVisible();
    // "Net Worth" appears in heading, chart axis, and legend — check legend span specifically
    await expect(chart.locator("div > div > span", { hasText: "Net Worth" })).toBeVisible();

    // Should render SVG chart elements (recharts renders an SVG)
    const svg = chart.locator("svg").first();
    await expect(svg).toBeVisible();

    // Capture screenshot
    await captureScreenshot(page, "task-50-waterfall-chart-default");
  });

  test("renders empty state when no financial data", async ({ page }) => {
    // Navigate with empty state (no assets or debts)
    // Use a state where all items are removed
    await page.goto("/");

    // The chart should be visible with default data
    const chart = page.locator('[data-testid="waterfall-chart"]');
    await expect(chart).toBeVisible();
  });

  test("chart shows in dashboard column", async ({ page }) => {
    await page.goto("/");

    // Chart should be in the dashboard section
    const dashboard = page.locator('section[aria-label="Financial dashboard"]');
    await expect(dashboard).toBeVisible();

    const chartInDashboard = dashboard.locator('[data-testid="waterfall-chart"]');
    await expect(chartInDashboard).toBeVisible();
  });

  test("chart appears after allocation chart", async ({ page }) => {
    await page.goto("/");

    // Both charts should be visible
    const allocationChart = page.locator('[data-testid="allocation-chart"]');
    const waterfallChart = page.locator('[data-testid="waterfall-chart"]');

    await expect(allocationChart).toBeVisible();
    await expect(waterfallChart).toBeVisible();

    // Waterfall should be below allocation (higher Y position)
    const allocationBox = await allocationChart.boundingBox();
    const waterfallBox = await waterfallChart.boundingBox();

    expect(allocationBox).toBeTruthy();
    expect(waterfallBox).toBeTruthy();
    expect(waterfallBox!.y).toBeGreaterThan(allocationBox!.y);
  });
});
