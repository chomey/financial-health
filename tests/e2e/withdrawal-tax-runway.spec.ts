import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Withdrawal Tax Runway", () => {
  test("shows tax drag in runway explainer with large RRSP balance", async ({ page }) => {
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

    // Click Financial Runway card to open explainer
    const runwayCard = page.locator('[aria-label="Financial Runway"]');
    await expect(runwayCard).toBeVisible();
    await runwayCard.click();

    // Tax drag is now shown in the explainer modal, not as a sub-line
    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    const taxDrag = page.locator('[data-testid="runway-tax-drag"]');
    await expect(taxDrag).toBeVisible({ timeout: 5000 });
    const taxDragText = await taxDrag.textContent();
    expect(taxDragText).toContain("Tax drag:");

    await captureScreenshot(page, "task-64-withdrawal-tax-runway");
  });

  test("no tax drag in runway explainer when only tax-free accounts", async ({ page }) => {
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

    // Open runway explainer
    const runwayCard = page.locator('[aria-label="Financial Runway"]');
    await runwayCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Only TFSA (tax-free) remains — no tax drag annotation
    const taxDrag = page.locator('[data-testid="runway-tax-drag"]');
    await expect(taxDrag).not.toBeVisible();
  });
});
