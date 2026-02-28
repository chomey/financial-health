import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Projection Chart", () => {
  test("renders the projection chart section", async ({ page }) => {
    await page.goto("/");
    const chart = page.getByTestId("projection-chart");
    await expect(chart).toBeVisible();

    // Verify heading
    await expect(chart.getByText("Financial Projection")).toBeVisible();

    // Verify scenario buttons
    await expect(chart.getByTestId("scenario-conservative")).toBeVisible();
    await expect(chart.getByTestId("scenario-moderate")).toBeVisible();
    await expect(chart.getByTestId("scenario-optimistic")).toBeVisible();

    // Verify timeline slider
    await expect(chart.getByTestId("timeline-slider")).toBeVisible();

    // Verify chart container
    await expect(chart.getByTestId("projection-chart-container")).toBeVisible();

    await captureScreenshot(page, "task-25-projection-chart-loaded");
  });

  test("scenario buttons toggle active state", async ({ page }) => {
    await page.goto("/");
    const chart = page.getByTestId("projection-chart");

    // Moderate should be active by default (has colored background)
    const moderateBtn = chart.getByTestId("scenario-moderate");
    await expect(moderateBtn).toHaveCSS("background-color", "rgb(16, 185, 129)");

    // Click conservative
    const conservativeBtn = chart.getByTestId("scenario-conservative");
    await conservativeBtn.click();
    await expect(conservativeBtn).toHaveCSS("background-color", "rgb(245, 158, 11)");

    // Click optimistic
    const optimisticBtn = chart.getByTestId("scenario-optimistic");
    await optimisticBtn.click();
    await expect(optimisticBtn).toHaveCSS("background-color", "rgb(59, 130, 246)");

    await captureScreenshot(page, "task-25-scenario-optimistic");
  });

  test("timeline slider changes year label", async ({ page }) => {
    await page.goto("/");
    const chart = page.getByTestId("projection-chart");

    // Default is 10 years
    await expect(chart.getByText("10 years")).toBeVisible();

    // Drag slider to max (30)
    const slider = chart.getByTestId("timeline-slider");
    await slider.fill("30");
    await expect(chart.getByText("30 years")).toBeVisible();

    // Set to 1
    await slider.fill("1");
    await expect(chart.getByText("1 year", { exact: true })).toBeVisible();

    await captureScreenshot(page, "task-25-timeline-1-year");
  });

  test("displays milestone and goal information", async ({ page }) => {
    await page.goto("/");
    const chart = page.getByTestId("projection-chart");

    // Set a long enough timeline to hit some milestones
    const slider = chart.getByTestId("timeline-slider");
    await slider.fill("20");

    // Wait for chart to render
    await page.waitForTimeout(600);

    // Should show goal reached labels (from default mock data with goals)
    const goalLabels = chart.getByTestId("goal-reached-label");
    const goalCount = await goalLabels.count();
    // At least the "Vacation" goal ($6200/$6500) should be reached quickly
    expect(goalCount).toBeGreaterThanOrEqual(1);

    await captureScreenshot(page, "task-25-milestones-20yr");
  });

  test("chart legend is visible", async ({ page }) => {
    await page.goto("/");
    const chart = page.getByTestId("projection-chart");

    await expect(chart.getByText("Net Worth", { exact: true })).toBeVisible();
    await expect(chart.getByText("Assets", { exact: true })).toBeVisible();
    await expect(chart.getByText("Debts", { exact: true })).toBeVisible();
  });

  test("projection section has correct aria label", async ({ page }) => {
    await page.goto("/");
    const section = page.getByRole("region", { name: "Financial projection", exact: true });
    await expect(section).toBeVisible();
  });
});
