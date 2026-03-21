import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("ProjectionChart full-width layout", () => {
  test("projection chart spans full width above the two-column layout", async ({ page }) => {
    await page.goto("/");

    // The chart should be in its own section
    const projectionsSection = page.locator('section[aria-label="Financial projections"]');
    await expect(projectionsSection).toBeVisible();

    // The chart should be visible within that section
    const chart = page.getByTestId("projection-chart");
    await expect(chart).toBeVisible();

    // Verify the projections section appears before the dashboard section
    const projectionsBB = await projectionsSection.boundingBox();
    const dashboardSection = page.locator('section[aria-label="Financial dashboard"]');
    const dashBB = await dashboardSection.boundingBox();

    expect(projectionsBB).not.toBeNull();
    expect(dashBB).not.toBeNull();
    expect(projectionsBB!.y).toBeLessThan(dashBB!.y);

    await captureScreenshot(page, "task-33-chart-fullwidth");
  });

  test("projection chart spans full content width on desktop", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/");

    const projectionsSection = page.locator('section[aria-label="Financial projections"]');
    const projBB = await projectionsSection.boundingBox();

    expect(projBB).not.toBeNull();
    // Projections section should be reasonably wide (at least 700px on a 1280 viewport)
    expect(projBB!.width).toBeGreaterThan(700);

    await captureScreenshot(page, "task-33-chart-fullwidth-desktop");
  });

  test("projection chart is not inside the dashboard section", async ({ page }) => {
    await page.goto("/");

    const dashboardSection = page.locator('section[aria-label="Financial dashboard"]');
    // ProjectionChart should NOT be found inside the dashboard section
    const chartInDashboard = dashboardSection.getByTestId("projection-chart");
    await expect(chartInDashboard).toHaveCount(0);
  });

  test("chart is responsive on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const projectionsSection = page.locator('section[aria-label="Financial projections"]');
    await expect(projectionsSection).toBeVisible();

    const chart = page.getByTestId("projection-chart");
    await expect(chart).toBeVisible();

    await captureScreenshot(page, "task-33-chart-fullwidth-mobile");
  });
});
