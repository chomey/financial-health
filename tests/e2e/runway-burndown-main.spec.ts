import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Runway Burndown in Unified Projection Chart", () => {
  test("renders burndown view when Income Stops tab is clicked", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The projection chart should be visible
    const chart = page.locator('[data-testid="projection-chart"]');
    await expect(chart).toBeVisible({ timeout: 5000 });

    // Mode tabs should be visible
    const modeTabs = chart.locator('[data-testid="chart-mode-tabs"]');
    await expect(modeTabs).toBeVisible();

    // Click "Income Stops" tab
    await chart.locator('[data-testid="mode-income-stops"]').click();

    // Should show plain-English summary
    const summary = chart.locator('[data-testid="burndown-summary"]');
    await expect(summary).toBeVisible();
    const summaryText = await summary.textContent();
    expect(summaryText).toContain("Your savings could last");

    // Should show clean legend with line descriptions
    const legend = chart.locator('[data-testid="burndown-legend"]');
    await expect(legend).toBeVisible();
    await expect(legend.getByText("With investment growth")).toBeVisible();
    await expect(legend.getByText("Without growth")).toBeVisible();

    // Should show starting balances
    const balances = chart.locator('[data-testid="burndown-starting-balances"]');
    await expect(balances).toBeVisible();
    const balancesText = await balances.textContent();
    expect(balancesText).toContain("Starting:");

    // Should be inside the projections section
    const projections = page.locator('section#projections');
    await expect(projections).toBeVisible();

    await captureScreenshot(page, "task-98-burndown-income-stops");
  });

  test("shows withdrawal order in Income Stops view", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const chart = page.locator('[data-testid="projection-chart"]');
    await chart.locator('[data-testid="mode-income-stops"]').click();

    // Should show suggested withdrawal order
    const withdrawalOrder = chart.locator('[data-testid="burndown-withdrawal-order"]');
    await expect(withdrawalOrder).toBeVisible();
    await expect(withdrawalOrder.getByText("Suggested Withdrawal Order")).toBeVisible();

    // Should have at least one entry (TFSA from default state)
    const firstEntry = chart.locator('[data-testid="burndown-withdrawal-0"]');
    await expect(firstEntry).toBeVisible();

    await captureScreenshot(page, "task-98-withdrawal-order");
  });

  test("runway explainer modal references Income Stops mode", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Open the runway explainer modal
    const runwayCard = page.locator('[aria-label="Financial Runway"]');
    await expect(runwayCard).toBeVisible();
    await runwayCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Should show the note pointing to Income Stops mode
    const chartNote = modal.locator('[data-testid="runway-chart-note"]');
    await expect(chartNote).toBeVisible();
    const noteText = await chartNote.textContent();
    expect(noteText).toContain("Income Stops");

    // Should still show monthly obligations
    const obligations = modal.locator('[data-testid="runway-monthly-obligations"]');
    await expect(obligations).toBeVisible();

    // Should still show withdrawal order in the explainer
    const withdrawalEntry = modal.locator('[data-testid="withdrawal-order-0"]');
    await expect(withdrawalEntry).toBeVisible();
  });

  test("mode tabs switch between Keep Earning and Income Stops views", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const chart = page.locator('[data-testid="projection-chart"]');
    await expect(chart).toBeVisible({ timeout: 5000 });

    // Default mode is Keep Earning — projection summary table should be visible
    await expect(chart.locator('[data-testid="projection-summary-table"]')).toBeVisible();
    await expect(chart.locator('[data-testid="burndown-summary"]')).not.toBeVisible();

    // Switch to Income Stops
    await chart.locator('[data-testid="mode-income-stops"]').click();
    await expect(chart.locator('[data-testid="burndown-summary"]')).toBeVisible();
    await expect(chart.locator('[data-testid="projection-summary-table"]')).not.toBeVisible();

    // Switch back to Keep Earning
    await chart.locator('[data-testid="mode-keep-earning"]').click();
    await expect(chart.locator('[data-testid="projection-summary-table"]')).toBeVisible();
    await expect(chart.locator('[data-testid="burndown-summary"]')).not.toBeVisible();
  });
});
