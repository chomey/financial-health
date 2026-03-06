import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Financial Runway Explainer", () => {
  test("clicking Financial Runway card opens burndown chart explainer", async ({ page }) => {
    await page.goto("/");

    // Click the Financial Runway metric card
    const runwayCard = page.locator('[aria-label="Financial Runway"]');
    await expect(runwayCard).toBeVisible();
    await runwayCard.click();

    // Verify explainer modal opens with runway-specific content
    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Should show the runway explainer (not generic source cards)
    const runwayExplainer = page.locator('[data-testid="runway-explainer"]');
    await expect(runwayExplainer).toBeVisible();

    // Should have a burndown chart
    const chart = page.locator('[data-testid="runway-burndown-chart"]');
    await expect(chart).toBeVisible();

    // Should show monthly obligations breakdown
    const obligations = page.locator('[data-testid="runway-monthly-obligations"]');
    await expect(obligations).toBeVisible();
    const obligationsText = await obligations.textContent();
    expect(obligationsText).toContain("expenses");
    expect(obligationsText).toContain("/mo");

    await captureScreenshot(page, "task-85-runway-explainer-chart");
  });

  test("shows withdrawal order with tax treatment labels", async ({ page }) => {
    await page.goto("/");

    // Click Financial Runway
    const runwayCard = page.locator('[aria-label="Financial Runway"]');
    await runwayCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Should show withdrawal order section
    const withdrawalOrder = page.locator('[data-testid="runway-withdrawal-order"]');
    await expect(withdrawalOrder).toBeVisible();

    // Default state has TFSA (tax-free), Savings Account (taxable), RRSP (tax-deferred)
    // TFSA should be first (tax-free first)
    const firstEntry = page.locator('[data-testid="withdrawal-order-0"]');
    await expect(firstEntry).toBeVisible();
    const firstText = await firstEntry.textContent();
    expect(firstText).toContain("TFSA");
    expect(firstText).toContain("tax-free");

    await captureScreenshot(page, "task-85-withdrawal-order");
  });

  test("explainer closes on Escape", async ({ page }) => {
    await page.goto("/");

    const runwayCard = page.locator('[aria-label="Financial Runway"]');
    await runwayCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible({ timeout: 1000 });
  });

  test("explainer closes on backdrop click", async ({ page }) => {
    await page.goto("/");

    const runwayCard = page.locator('[aria-label="Financial Runway"]');
    await runwayCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Click the backdrop
    const backdrop = page.locator('[data-testid="explainer-backdrop"]');
    await backdrop.click({ position: { x: 10, y: 10 } });
    await expect(modal).not.toBeVisible({ timeout: 1000 });
  });

  test("runwayAfterTax sub-line is removed from metric card", async ({ page }) => {
    await page.goto("/");

    // Increase RRSP to make tax impact significant
    await page.getByLabel(/Edit amount for RRSP/).click();
    const editInput = page.getByLabel("Edit amount for RRSP");
    await editInput.fill("200000");
    await editInput.press("Enter");
    await page.waitForTimeout(1500);

    // The runwayAfterTax sub-line should NOT be visible anymore
    const afterTaxElement = page.locator('[data-testid="runway-after-tax"]');
    await expect(afterTaxElement).not.toBeVisible();
  });

  test("shows tax drag annotation in chart when tax-deferred accounts exist", async ({ page }) => {
    await page.goto("/");

    // Increase RRSP to make tax impact significant
    await page.getByLabel(/Edit amount for RRSP/).click();
    const editInput = page.getByLabel("Edit amount for RRSP");
    await editInput.fill("200000");
    await editInput.press("Enter");
    await page.waitForTimeout(1500);

    // Open runway explainer
    const runwayCard = page.locator('[aria-label="Financial Runway"]');
    await runwayCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Tax drag annotation should show
    const taxDrag = page.locator('[data-testid="runway-tax-drag"]');
    await expect(taxDrag).toBeVisible({ timeout: 5000 });
    const taxDragText = await taxDrag.textContent();
    expect(taxDragText).toContain("Tax drag:");
    expect(taxDragText).toContain("months");

    await captureScreenshot(page, "task-85-runway-tax-drag");
  });
});
