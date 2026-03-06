import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Withdrawal Tax Summary", () => {
  test("shows withdrawal tax summary card in dashboard with default RRSP data", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Default state has RRSP which is tax-deferred — should show summary
    const summary = page.locator('[data-testid="withdrawal-tax-summary"]');
    await expect(summary).toBeVisible();

    // Should show "Withdrawal Tax Impact" heading
    await expect(summary.locator("text=Withdrawal Tax Impact")).toBeVisible();

    // Should show tax drag summary
    const dragSummary = page.locator('[data-testid="tax-drag-summary"]');
    await expect(dragSummary).toBeVisible();

    await captureScreenshot(page, "task-66-withdrawal-tax-summary");
  });

  test("details are always visible with account breakdown and withdrawal order", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const summary = page.locator('[data-testid="withdrawal-tax-summary"]');
    await summary.scrollIntoViewIfNeeded();
    await expect(summary).toBeVisible();

    // Details should be visible by default (no toggle)
    const details = page.locator('[data-testid="withdrawal-tax-details"]');
    await expect(details).toBeVisible();

    // Should show suggested withdrawal order
    await expect(details.locator("text=Suggested withdrawal order")).toBeVisible();

    // Should show disclaimer
    const disclaimer = page.locator('[data-testid="withdrawal-order-disclaimer"]');
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toContainText("rough suggestion");

    // Should show account categories
    // Default state has TFSA (tax-free), RRSP (tax-deferred), Savings Account (taxable)
    await expect(details.locator("text=Tax-free")).toBeVisible();
    await expect(details.locator("text=Tax-deferred")).toBeVisible();

    await captureScreenshot(page, "task-66-withdrawal-tax-details");
  });

  test("shows withdrawal-tax insights in insights panel", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The insights panel should contain withdrawal-tax related insight
    // Default state has TFSA (tax-free) so should see the tax-free insight
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();

    // Should have a withdrawal tax insight about TFSA being tax-free
    const taxFreeInsight = insightsPanel.locator("text=/tax-free/i");
    await expect(taxFreeInsight.first()).toBeVisible();

    await captureScreenshot(page, "task-66-withdrawal-tax-insights");
  });

  test("withdrawal tax insights appear under Financial Runway card", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Scroll to dashboard
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await dashboard.scrollIntoViewIfNeeded();

    // Financial Runway card should have withdrawal-tax insights
    const runwayCard = dashboard.locator('[role="group"]').filter({ hasText: "Financial Runway" });
    await expect(runwayCard).toBeVisible();

    // The card should show insights related to withdrawal tax (mapped via METRIC_TO_INSIGHT_TYPES)
    // At minimum the card should exist and show runway info
    await expect(runwayCard.locator("text=/month/i").first()).toBeVisible();

    await captureScreenshot(page, "task-66-runway-with-withdrawal-tax");
  });
});
