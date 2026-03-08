import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Source Summary Cards in Explainer Modal", () => {
  test("clicking Net Worth shows source summary cards with item details", async ({ page }) => {
    await page.goto("/");

    // Click Net Worth metric card to open explainer
    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.click();

    // Modal should appear
    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Should have source summary cards (Assets section at minimum)
    const assetsSummary = page.locator('[data-testid="source-summary-section-assets"]');
    await expect(assetsSummary).toBeVisible();

    // Asset card should show title with icon
    const assetsTitle = page.locator('[data-testid="source-summary-title-section-assets"]');
    await expect(assetsTitle).toHaveText("Assets");

    // Asset card should have items list
    const assetsItems = page.locator('[data-testid="source-summary-items-section-assets"]');
    await expect(assetsItems).toBeVisible();
    // At least one item row (li) should exist
    const itemCount = await assetsItems.locator("li").count();
    expect(itemCount).toBeGreaterThan(0);

    // Total should be visible with oval annotation
    const assetsTotal = page.locator('[data-testid="source-summary-total-section-assets"]');
    await expect(assetsTotal).toBeVisible();
    const assetsOval = page.locator('[data-testid="source-summary-oval-section-assets"]');
    await expect(assetsOval).toBeVisible();

    // Modal should use max-w-xl
    const maxWidth = await modal.evaluate((el) => getComputedStyle(el).maxWidth);
    // Tailwind max-w-xl = 36rem = 576px
    expect(parseInt(maxWidth)).toBeGreaterThanOrEqual(576);

    await captureScreenshot(page, "task-87-scrollable-summary-cards");
  });

  test("source summary cards have colored left borders", async ({ page }) => {
    await page.goto("/");

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Assets card should have green left border
    const assetsCard = page.locator('[data-testid="source-summary-section-assets"]');
    const assetsBorderColor = await assetsCard.evaluate(
      (el) => getComputedStyle(el).borderLeftColor
    );
    // Green border — Tailwind v4 green-500 is rgb(16, 185, 129)
    expect(assetsBorderColor).toMatch(/rgb\(16,\s*185,\s*129\)/);
  });

  test("Monthly Cash Flow explainer shows income and expense cards", async ({ page }) => {
    await page.goto("/");

    const surplusCard = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await surplusCard.scrollIntoViewIfNeeded();
    await surplusCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Should have income source summary card
    const incomeSummary = page.locator('[data-testid="source-summary-section-income"]');
    await expect(incomeSummary).toBeVisible();

    // Income card should show items
    const incomeItems = page.locator('[data-testid="source-summary-items-section-income"]');
    await expect(incomeItems).toBeVisible();

    await captureScreenshot(page, "task-80-monthly-surplus-summary-cards");
  });

  test("source summary cards show all items in scrollable container with sticky total", async ({ page }) => {
    await page.goto("/");

    // Click Net Worth to open explainer
    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Items container should be scrollable (overflow-y-auto)
    const assetsItems = page.locator('[data-testid="source-summary-items-section-assets"]');
    await expect(assetsItems).toBeVisible();
    const overflowY = await assetsItems.evaluate((el) => getComputedStyle(el).overflowY);
    expect(overflowY).toBe("auto");

    // Total row should have sticky positioning
    const totalRow = page.locator('[data-testid="source-summary-total-row-section-assets"]');
    await expect(totalRow).toBeVisible();
    const position = await totalRow.evaluate((el) => getComputedStyle(el).position);
    expect(position).toBe("sticky");

    // No "+N more" text should exist anywhere
    await expect(page.locator('text=/\\+\\d+ more/')).not.toBeVisible();

    // Each source card should have a total
    const sources = page.locator('[data-testid="explainer-sources"]');
    await expect(sources).toBeVisible();
    const totals = sources.locator('[data-testid^="source-summary-total-"]');
    const totalCount = await totals.count();
    expect(totalCount).toBeGreaterThan(0);
  });

  test("explainer modal closes and reopens with different metric", async ({ page }) => {
    await page.goto("/");

    // Open Net Worth explainer
    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.click();

    let modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();
    await expect(page.locator('[data-testid="explainer-title"]')).toHaveText("Net Worth");

    // Close modal
    await page.locator('[data-testid="explainer-close"]').click();
    await expect(modal).not.toBeVisible();

    // Open Monthly Cash Flow explainer
    const surplusCard = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await surplusCard.scrollIntoViewIfNeeded();
    await surplusCard.click();

    modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();
    await expect(page.locator('[data-testid="explainer-title"]')).toHaveText("Monthly Cash Flow");

    // Should show income items, not asset items
    await expect(page.locator('[data-testid="source-summary-section-income"]')).toBeVisible();
  });

  test("hand-drawn oval SVGs render with valid paths", async ({ page }) => {
    await page.goto("/");

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Check that oval SVG paths have non-empty d attributes
    const ovals = page.locator('[data-testid^="source-summary-oval-"] path');
    const ovalCount = await ovals.count();
    expect(ovalCount).toBeGreaterThan(0);

    for (let i = 0; i < ovalCount; i++) {
      const d = await ovals.nth(i).getAttribute("d");
      expect(d).toBeTruthy();
      expect(d!.length).toBeGreaterThan(10);
    }
  });
});
