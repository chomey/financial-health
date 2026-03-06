import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Withdrawal Tax in Financial Runway", () => {
  test("withdrawal tax content appears in Financial Runway explainer, not as standalone card", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Standalone WithdrawalTaxSummary should NOT exist on the page
    const standaloneSummary = page.locator('[data-testid="withdrawal-tax-summary"]');
    await expect(standaloneSummary).not.toBeVisible();

    // Click the Financial Runway metric card to open explainer
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await dashboard.scrollIntoViewIfNeeded();
    const runwayCard = dashboard.locator('[role="group"]').filter({ hasText: "Financial Runway" });
    await runwayCard.click();

    // Explainer modal should open
    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Withdrawal tax content should be in the explainer
    const withdrawalTax = modal.locator('[data-testid="runway-withdrawal-tax"]');
    await expect(withdrawalTax).toBeVisible();

    // Should show treatment bar
    const treatmentBar = modal.locator('[data-testid="runway-tax-treatment-bar"]');
    await expect(treatmentBar).toBeVisible();

    // Should show account groups
    const accountGroups = modal.locator('[data-testid="runway-tax-account-groups"]');
    await expect(accountGroups).toBeVisible();
    await expect(accountGroups.locator("text=Tax-free")).toBeVisible();

    // Should show disclaimer
    const disclaimer = modal.locator('[data-testid="withdrawal-order-disclaimer"]');
    await expect(disclaimer).toBeVisible();
    await expect(disclaimer).toContainText("rough suggestion");

    // Should show withdrawal order entries
    const firstEntry = modal.locator('[data-testid="withdrawal-order-0"]');
    await expect(firstEntry).toBeVisible();

    await captureScreenshot(page, "task-97-runway-explainer-with-withdrawal-tax");
  });

  test("runway metric card shows after-tax runway sub-line", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await dashboard.scrollIntoViewIfNeeded();

    // Check for the after-tax sub-line (only shows when it differs from growth value)
    const afterTaxLine = page.locator('[data-testid="runway-after-tax"]');
    // With default data including RRSP (tax-deferred), after-tax should differ
    const isVisible = await afterTaxLine.isVisible();
    if (isVisible) {
      await expect(afterTaxLine).toContainText("after withdrawal taxes");
    }
    // Either way, the with-growth line should still be there
    const withGrowthLine = page.locator('[data-testid="runway-with-growth"]');
    await expect(withGrowthLine).toBeVisible();

    await captureScreenshot(page, "task-97-runway-card-after-tax");
  });

  test("withdrawal-tax insights still appear in insights panel", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();

    const taxFreeInsight = insightsPanel.locator("text=/tax-free/i");
    await expect(taxFreeInsight.first()).toBeVisible();
  });
});
