import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Withdrawal Tax Runway", () => {
  test("shows tax drag in burndown summary with large RRSP balance", async ({ page }) => {
    await page.goto("/");

    // Default state has Savings ($5k), TFSA ($22k), RRSP ($28k)
    // Increase RRSP to $200k to make tax impact significant
    await page.getByLabel(/Edit amount for RRSP/).click();
    const editInput = page.getByLabel("Edit amount for RRSP");
    await expect(editInput).toBeVisible();
    await editInput.fill("200000");
    await editInput.press("Enter");

    // Wait for dashboard metrics to recalculate with animation
    await page.waitForTimeout(1500);

    // Switch to Income Stops mode to see burndown
    const chart = page.locator('[data-testid="projection-chart"]');
    await chart.locator('[data-testid="mode-income-stops"]').click();

    // Tax drag info should be in the burndown summary text
    const burndownSummary = chart.locator('[data-testid="burndown-summary"]');
    await expect(burndownSummary).toBeVisible({ timeout: 5000 });
    const summaryText = await burndownSummary.textContent();
    expect(summaryText).toContain("withdrawal taxes");

    await captureScreenshot(page, "task-64-withdrawal-tax-runway");
  });

  test("no tax drag in summary when only tax-free accounts", async ({ page }) => {
    await page.goto("/");

    // Delete RRSP (tax-deferred) and Savings Account (taxable)
    // Scope to the assets section to avoid matching chart legend items
    const assetsSection = page.locator('#assets');
    const rrspRow = assetsSection.getByRole("listitem").filter({ hasText: "RRSP" });
    await rrspRow.scrollIntoViewIfNeeded();
    await rrspRow.hover();
    await page.getByLabel("Delete RRSP").click();
    await page.waitForTimeout(500);

    const savingsRow = assetsSection.getByRole("listitem").filter({ hasText: "Savings Account" });
    await savingsRow.scrollIntoViewIfNeeded();
    await savingsRow.hover();
    await page.getByLabel("Delete Savings Account").click();
    await page.waitForTimeout(1500);

    // Switch to Income Stops mode
    const chart = page.locator('[data-testid="projection-chart"]');
    await chart.locator('[data-testid="mode-income-stops"]').click();

    // Only TFSA (tax-free) remains — summary should NOT mention withdrawal taxes
    const burndownSummary = chart.locator('[data-testid="burndown-summary"]');
    await expect(burndownSummary).toBeVisible({ timeout: 5000 });
    const summaryText = await burndownSummary.textContent();
    expect(summaryText).not.toContain("withdrawal taxes");
  });
});
