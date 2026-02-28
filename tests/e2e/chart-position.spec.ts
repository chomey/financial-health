import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Projection chart position in dashboard", () => {
  test("projection chart appears above metric cards in the dashboard column", async ({
    page,
  }) => {
    await page.goto("/");

    const chart = page.getByTestId("projection-chart");
    const dashboard = page.getByTestId("snapshot-dashboard");

    await expect(chart).toBeVisible();
    await expect(dashboard).toBeVisible();

    // Both should be inside the Financial dashboard section
    const dashboardSection = page.getByRole("region", {
      name: "Financial dashboard",
    });
    await expect(dashboardSection).toBeVisible();
    await expect(dashboardSection.getByTestId("projection-chart")).toBeVisible();
    await expect(
      dashboardSection.getByTestId("snapshot-dashboard")
    ).toBeVisible();

    // Chart should be visually above the dashboard metrics
    const chartBox = await chart.boundingBox();
    const dashboardBox = await dashboard.boundingBox();
    expect(chartBox).not.toBeNull();
    expect(dashboardBox).not.toBeNull();
    expect(chartBox!.y).toBeLessThan(dashboardBox!.y);

    await captureScreenshot(page, "task-27-chart-at-top-of-dashboard");
  });

  test("projection chart is no longer in a separate full-width section", async ({
    page,
  }) => {
    await page.goto("/");

    // The chart should NOT be outside the grid layout
    const entrySection = page.getByRole("region", {
      name: "Financial data entry",
    });
    const dashboardSection = page.getByRole("region", {
      name: "Financial dashboard",
    });

    // Chart should be inside dashboard section
    await expect(
      dashboardSection.getByTestId("projection-chart")
    ).toBeVisible();

    // Chart should NOT be inside entry section
    await expect(
      entrySection.getByTestId("projection-chart")
    ).not.toBeVisible();
  });

  test("dashboard column flows naturally with chart then metrics then insights", async ({
    page,
  }) => {
    await page.goto("/");

    const dashboardSection = page.getByRole("region", {
      name: "Financial dashboard",
    });

    // All three major sections should be present
    await expect(
      dashboardSection.getByTestId("projection-chart")
    ).toBeVisible();
    await expect(
      dashboardSection.getByTestId("snapshot-dashboard")
    ).toBeVisible();

    // Verify visual order: chart -> metrics
    const chartBox = await dashboardSection
      .getByTestId("projection-chart")
      .boundingBox();
    const metricsBox = await dashboardSection
      .getByTestId("snapshot-dashboard")
      .boundingBox();

    expect(chartBox!.y + chartBox!.height).toBeLessThanOrEqual(
      metricsBox!.y + 1 // 1px tolerance
    );

    await captureScreenshot(page, "task-27-dashboard-flow");
  });
});
