import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Withdrawal Tax Runway", () => {
  test("shows tax-adjusted runway with large RRSP balance", async ({ page }) => {
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

    // Verify Financial Runway card exists
    const runwayCard = page.locator('[aria-label="Financial Runway"]');
    await expect(runwayCard).toBeVisible();

    // The tax-adjusted runway annotation should appear
    const afterTaxElement = page.locator('[data-testid="runway-after-tax"]');
    await expect(afterTaxElement).toBeVisible({ timeout: 5000 });
    const afterTaxText = await afterTaxElement.textContent();
    expect(afterTaxText).toContain("after withdrawal tax");
    expect(afterTaxText).toContain("mo");

    await captureScreenshot(page, "task-64-withdrawal-tax-runway");
  });

  test("no tax-adjusted runway when only tax-free accounts", async ({ page }) => {
    await page.goto("/");

    // Delete RRSP (tax-deferred) and Savings Account (taxable)
    const rrspRow = page.getByRole("listitem").filter({ hasText: "RRSP" });
    await rrspRow.hover();
    await page.getByLabel("Delete RRSP").click();
    await page.waitForTimeout(300);

    const savingsRow = page.getByRole("listitem").filter({ hasText: "Savings Account" });
    await savingsRow.hover();
    await page.getByLabel("Delete Savings Account").click();
    await page.waitForTimeout(1500);

    // Only TFSA (tax-free) remains — no tax drag
    const afterTaxElement = page.locator('[data-testid="runway-after-tax"]');
    await expect(afterTaxElement).not.toBeVisible();
  });
});
