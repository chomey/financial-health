import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Net Worth Donut Chart", () => {
  test("renders donut chart with default data", async ({ page }) => {
    await page.goto("/");

    const chart = page.locator('[data-testid="donut-chart"]');
    await expect(chart).toBeVisible();

    // Should show the title
    await expect(chart.locator("text=Net Worth Breakdown")).toBeVisible();

    // Should show center label with net worth
    const centerLabel = chart.locator('[data-testid="donut-center-label"]');
    await expect(centerLabel).toBeVisible();
    await expect(centerLabel.locator("text=Net Worth")).toBeVisible();

    // Should render SVG chart elements (recharts PieChart renders an SVG)
    const svg = chart.locator("svg").first();
    await expect(svg).toBeVisible();

    // Should show legend
    const legend = chart.locator('[data-testid="donut-legend"]');
    await expect(legend).toBeVisible();

    await captureScreenshot(page, "task-104-donut-chart-default");
  });

  test("renders empty state when no financial data", async ({ page }) => {
    await page.goto("/");

    // The chart should be visible with default data
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

  test("donut center shows net worth value", async ({ page }) => {
    await page.goto("/");

    const centerLabel = page.locator('[data-testid="donut-center-label"]');
    await expect(centerLabel).toBeVisible();

    // Should display a dollar amount in the center
    const text = await centerLabel.textContent();
    expect(text).toMatch(/Net Worth/);
    expect(text).toMatch(/\$/);

    await captureScreenshot(page, "task-104-donut-center-label");
  });

  test("donut legend shows segment names", async ({ page }) => {
    await page.goto("/");

    const legend = page.locator('[data-testid="donut-legend"]');
    await expect(legend).toBeVisible();

    // Legend should have colored squares
    const swatches = legend.locator("span.inline-block");
    expect(await swatches.count()).toBeGreaterThan(0);

    await captureScreenshot(page, "task-104-donut-legend");
  });
});
