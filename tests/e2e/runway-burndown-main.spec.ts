import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Runway Burndown Chart on Main Page", () => {
  test("renders simplified burndown chart with summary, legend, and starting balances", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The burndown chart should be visible on the main page
    const burndownChart = page.locator('[data-testid="runway-burndown-main"]');
    await expect(burndownChart).toBeVisible({ timeout: 5000 });

    // Should show "Runway Burndown" title
    await expect(burndownChart.getByText("Runway Burndown")).toBeVisible();

    // Should show plain-English summary
    const summary = burndownChart.locator('[data-testid="burndown-summary"]');
    await expect(summary).toBeVisible();
    const summaryText = await summary.textContent();
    expect(summaryText).toContain("Your savings could last");

    // Should show clean legend with line descriptions
    const legend = burndownChart.locator('[data-testid="burndown-legend"]');
    await expect(legend).toBeVisible();
    await expect(legend.getByText("With investment growth")).toBeVisible();
    await expect(legend.getByText("Without growth")).toBeVisible();

    // Should show starting balances
    const balances = burndownChart.locator('[data-testid="burndown-starting-balances"]');
    await expect(balances).toBeVisible();
    const balancesText = await balances.textContent();
    expect(balancesText).toContain("Starting:");

    // Should be inside the projections section
    const projections = page.locator('section#projections');
    await expect(projections).toBeVisible();
    const burndownInProjections = projections.locator('[data-testid="runway-burndown-main"]');
    await expect(burndownInProjections).toBeVisible();

    await captureScreenshot(page, "task-92-runway-burndown-simplified");
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

    await captureScreenshot(page, "task-92-withdrawal-order");
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
