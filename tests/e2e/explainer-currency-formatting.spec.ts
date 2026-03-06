import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Explainer modal currency formatting", () => {
  test("explainer totals show full currency numbers, not abbreviated", async ({ page }) => {
    await page.goto("/");

    // Click Net Worth metric card to open explainer
    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // The source summary total should show full numbers (e.g., "$55,000" not "$55k")
    const assetsTotal = page.locator('[data-testid="source-summary-total-section-assets"]');
    await expect(assetsTotal).toBeVisible();
    const totalText = await assetsTotal.textContent();
    // Should NOT contain abbreviated suffixes like "k" or "M"
    expect(totalText).not.toMatch(/\d+k$/i);
    expect(totalText).not.toMatch(/\d+M$/i);
    // Should contain comma-separated full number
    expect(totalText).toMatch(/\$[\d,]+/);

    await captureScreenshot(page, "task-103-explainer-full-currency");
  });

  test("explainer item rows show proper currency symbol", async ({ page }) => {
    await page.goto("/");

    // Click Net Worth metric card
    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Check item rows use proper currency format ($ for USD, CA$ for CAD)
    const assetsItems = page.locator('[data-testid="source-summary-items-section-assets"]');
    await expect(assetsItems).toBeVisible();

    const items = assetsItems.locator("li");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);

    // Each item should have a properly formatted currency amount
    for (let i = 0; i < count; i++) {
      const itemText = await items.nth(i).textContent();
      // Should contain a currency-formatted number ($ or CA$)
      expect(itemText).toMatch(/(?:CA)?\$[\d,]+/);
    }
  });

  test("CAD users see CA$ prefix in explainer modals", async ({ page }) => {
    await page.goto("/");

    // Switch to Canada
    await page.locator('[data-testid="country-ca"]').click();

    // Click Net Worth metric card
    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // The totals should show CA$ prefix
    const assetsTotal = page.locator('[data-testid="source-summary-total-section-assets"]');
    await expect(assetsTotal).toBeVisible();
    const totalText = await assetsTotal.textContent();
    expect(totalText).toContain("CA$");

    await captureScreenshot(page, "task-103-explainer-cad-currency");
  });

  test("tax explainer uses full currency formatting", async ({ page }) => {
    await page.goto("/");

    // Click Estimated Tax metric card
    const taxCard = page.locator('[data-testid="metric-card-estimated-tax"]');
    await taxCard.scrollIntoViewIfNeeded();
    await taxCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Tax breakdown should show full currency values
    const federalAmount = page.locator('[data-testid="tax-federal-amount"]');
    await expect(federalAmount).toBeVisible();
    const federalText = await federalAmount.textContent();
    // Should be a full number, not abbreviated
    expect(federalText).toMatch(/(?:CA)?\$[\d,]+/);
    expect(federalText).not.toMatch(/\d+k$/i);

    await captureScreenshot(page, "task-103-tax-explainer-full-currency");
  });
});
