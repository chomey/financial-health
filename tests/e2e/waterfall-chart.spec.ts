import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

// Waterfall chart was replaced by donut chart in Task 104
test.describe("Net Worth Chart (Donut)", () => {
  test("renders donut chart with default data", async ({ page }) => {
    await page.goto("/");

    const chart = page.locator('[data-testid="donut-chart"]');
    await expect(chart).toBeVisible();

    // Should show the title
    await expect(chart.locator("text=Net Worth Breakdown")).toBeVisible();

    // Should render SVG chart elements
    const svg = chart.locator("svg").first();
    await expect(svg).toBeVisible();

    await captureScreenshot(page, "task-50-waterfall-chart-default");
  });

  test("renders with default data present", async ({ page }) => {
    await page.goto("/");

    const chart = page.locator('[data-testid="donut-chart"]');
    await expect(chart).toBeVisible();
  });

  test("chart shows in dashboard column", async ({ page }) => {
    await page.goto("/");

    const dashboard = page.locator('section[aria-label="Financial dashboard"]');
    await expect(dashboard).toBeVisible();

    const chartInDashboard = dashboard.locator('[data-testid="donut-chart"]');
    await expect(chartInDashboard).toBeVisible();
  });

  test("chart appears after allocation chart", async ({ page }) => {
    await page.goto("/");

    const allocationChart = page.locator('[data-testid="allocation-chart"]');
    const donutChart = page.locator('[data-testid="donut-chart"]');

    await expect(allocationChart).toBeVisible();
    await expect(donutChart).toBeVisible();

    const allocationBox = await allocationChart.boundingBox();
    const donutBox = await donutChart.boundingBox();

    expect(allocationBox).toBeTruthy();
    expect(donutBox).toBeTruthy();
    expect(donutBox!.y).toBeGreaterThan(allocationBox!.y);
  });
});
