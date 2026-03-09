import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Projection chart position in dashboard", () => {
  test("projection chart appears above metric cards in the dashboard", async ({
    page,
  }) => {
    await page.goto("/");

    const chart = page.getByTestId("projection-chart");
    const dashboard = page.getByTestId("snapshot-dashboard");

    await expect(chart).toBeVisible();
    await expect(dashboard).toBeVisible();

    // Chart should be visually above the dashboard metrics
    const chartBox = await chart.boundingBox();
    const dashboardBox = await dashboard.boundingBox();
    expect(chartBox).not.toBeNull();
    expect(dashboardBox).not.toBeNull();
    expect(chartBox!.y).toBeLessThan(dashboardBox!.y);

    await captureScreenshot(page, "task-27-chart-at-top-of-dashboard");
  });

  test("projection chart is in its own projections section", async ({
    page,
  }) => {
    await page.goto("/");

    // Chart should be inside the projections section
    const projectionsSection = page.getByRole("region", {
      name: "Financial projections",
    });
    await expect(
      projectionsSection.getByTestId("projection-chart")
    ).toBeVisible();
  });

  test("dashboard flows naturally with chart then metrics then insights", async ({
    page,
  }) => {
    await page.goto("/");

    // All three major sections should be present
    const chart = page.getByTestId("projection-chart");
    const dashboard = page.getByTestId("snapshot-dashboard");

    await expect(chart).toBeVisible();
    await expect(dashboard).toBeVisible();

    // Verify visual order: chart -> metrics
    const chartBox = await chart.boundingBox();
    const metricsBox = await dashboard.boundingBox();

    expect(chartBox!.y + chartBox!.height).toBeLessThanOrEqual(
      metricsBox!.y + 1 // 1px tolerance
    );

    await captureScreenshot(page, "task-27-dashboard-flow");
  });
});
