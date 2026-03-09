import { expect } from "@playwright/test";
import { test, captureScreenshot, gotoDashboard } from "./helpers";

test.describe("Simple mode dashboard", () => {
  test("simple mode shows only 4 nav sections in header stepper", async ({ page }) => {
    await gotoDashboard(page);
    await page.waitForLoadState("networkidle");

    // Should be in simple mode by default — stepper shows 4 sections
    const stepper = page.getByRole("navigation", { name: "Dashboard sections" });
    await expect(stepper).toBeVisible();
    const buttons = stepper.getByRole("button");
    await expect(buttons).toHaveCount(4);

    await captureScreenshot(page, "task-182-simple-mode-dashboard-stepper");
  });

  test("advanced mode shows 8 nav sections in header stepper", async ({ page }) => {
    await gotoDashboard(page);
    await page.waitForLoadState("networkidle");

    // Switch to advanced mode
    await page.getByTestId("mode-toggle-advanced").click();
    await page.waitForTimeout(100);

    const stepper = page.getByRole("navigation", { name: "Dashboard sections" });
    const buttons = stepper.getByRole("button");
    await expect(buttons).toHaveCount(8);

    await captureScreenshot(page, "task-182-advanced-mode-dashboard-stepper");
  });

  test("simple mode hides Cash Flow, Breakdowns, Compare, What If sections", async ({ page }) => {
    await gotoDashboard(page);
    await page.waitForLoadState("networkidle");

    // These sections should not be in the DOM in simple mode
    await expect(page.locator("#section-dash-cashflow")).not.toBeAttached();
    await expect(page.locator("#section-dash-breakdowns")).not.toBeAttached();
    await expect(page.locator("#section-dash-compare")).not.toBeAttached();
    await expect(page.locator("#section-dash-scenarios")).not.toBeAttached();
  });

  test("simple mode shows the 3-metric overview", async ({ page }) => {
    await gotoDashboard(page);
    await page.waitForLoadState("networkidle");

    const dashboard = page.getByTestId("snapshot-dashboard");
    await expect(dashboard).toBeVisible();

    // Only 3 metric cards visible
    const metricCards = dashboard.locator("[data-testid^='metric-card-']");
    await expect(metricCards).toHaveCount(3);

    await captureScreenshot(page, "task-182-simple-mode-overview-3-metrics");
  });

  test("simple mode shows upgrade banner", async ({ page }) => {
    await gotoDashboard(page);
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("simple-mode-upgrade-banner")).toBeVisible();
    await expect(page.getByText("Switch to Advanced mode")).toBeVisible();

    await captureScreenshot(page, "task-182-simple-mode-upgrade-banner");
  });

  test("upgrade banner switches to advanced mode", async ({ page }) => {
    await gotoDashboard(page);
    await page.waitForLoadState("networkidle");

    await page.getByTestId("simple-mode-upgrade-banner").getByRole("button").click();

    // Banner should be gone, all 8 sections should appear
    await expect(page.getByTestId("simple-mode-upgrade-banner")).not.toBeVisible();
    const stepper = page.getByRole("navigation", { name: "Dashboard sections" });
    const buttons = stepper.getByRole("button");
    await expect(buttons).toHaveCount(8);
  });
});
