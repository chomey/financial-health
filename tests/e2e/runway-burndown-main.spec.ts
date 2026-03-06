import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Runway Burndown Chart on Main Page", () => {
  test("renders burndown chart in projections section", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The burndown chart should be visible on the main page
    const burndownChart = page.locator('[data-testid="runway-burndown-main"]');
    await expect(burndownChart).toBeVisible({ timeout: 5000 });

    // Should show "Runway Burndown" title
    await expect(burndownChart.getByText("Runway Burndown")).toBeVisible();

    // Should be inside the projections section
    const projections = page.locator('section#projections');
    await expect(projections).toBeVisible();
    const burndownInProjections = projections.locator('[data-testid="runway-burndown-main"]');
    await expect(burndownInProjections).toBeVisible();

    await captureScreenshot(page, "task-90-runway-burndown-main");
  });

  test("shows withdrawal order on main page chart", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const burndownChart = page.locator('[data-testid="runway-burndown-main"]');
    await expect(burndownChart).toBeVisible({ timeout: 5000 });

    // Should show suggested withdrawal order
    const withdrawalOrder = burndownChart.locator('[data-testid="burndown-withdrawal-order"]');
    await expect(withdrawalOrder).toBeVisible();
    await expect(withdrawalOrder.getByText("Suggested Withdrawal Order")).toBeVisible();

    // Should have at least one entry (TFSA from default state)
    const firstEntry = burndownChart.locator('[data-testid="burndown-withdrawal-0"]');
    await expect(firstEntry).toBeVisible();

    await captureScreenshot(page, "task-90-withdrawal-order-main");
  });

  test("runway explainer modal shows condensed content with chart note", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open the runway explainer modal
    const runwayCard = page.locator('[aria-label="Financial Runway"]');
    await expect(runwayCard).toBeVisible();
    await runwayCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Should show the note pointing to main page chart
    const chartNote = modal.locator('[data-testid="runway-chart-note"]');
    await expect(chartNote).toBeVisible();
    const noteText = await chartNote.textContent();
    expect(noteText).toContain("burndown chart above");

    // Should still show monthly obligations
    const obligations = modal.locator('[data-testid="runway-monthly-obligations"]');
    await expect(obligations).toBeVisible();

    // Should still show withdrawal order
    const withdrawalOrder = modal.locator('[data-testid="runway-withdrawal-order"]');
    await expect(withdrawalOrder).toBeVisible();

    await captureScreenshot(page, "task-90-runway-explainer-condensed");
  });

  test("burndown chart is wrapped in ZoomableCard", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const burndownChart = page.locator('[data-testid="runway-burndown-main"]');
    await expect(burndownChart).toBeVisible({ timeout: 5000 });

    // The chart's parent should be a ZoomableCard (has zoom-in icon on hover)
    const zoomableParent = burndownChart.locator("..");
    await zoomableParent.hover();

    // Check the zoom icon becomes visible on hover
    const zoomIcon = zoomableParent.locator('svg');
    await expect(zoomIcon.first()).toBeVisible({ timeout: 2000 });
  });
});
