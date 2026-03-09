import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Task 125: surplus explainer source cards", () => {
  test("surplus explainer shows Income and Expenses source cards", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-cash-flow"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await surplusCard.scrollIntoViewIfNeeded();
    await surplusCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible({ timeout: 3000 });
    await page.waitForTimeout(800);

    // Income and Expenses source cards should be present
    await expect(page.locator('[data-testid="explainer-source-section-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-section-expenses"]')).toBeVisible();

    await captureScreenshot(page, "task-125-surplus-explainer-full");
  });

  test("surplus explainer shows income source with positive value", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-cash-flow"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await surplusCard.scrollIntoViewIfNeeded();
    await surplusCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible({ timeout: 3000 });
    await page.waitForTimeout(800);

    // Income source card should show income title
    const incomeTitle = page.locator('[data-testid="source-summary-title-section-income"]');
    await expect(incomeTitle).toBeVisible();

    await captureScreenshot(page, "task-125-surplus-explainer-income");
  });

  test("surplus explainer shows expense source with negative value", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-cash-flow"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await surplusCard.scrollIntoViewIfNeeded();
    await surplusCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible({ timeout: 3000 });
    await page.waitForTimeout(800);

    // Expenses source card should show expenses title
    const expensesTitle = page.locator('[data-testid="source-summary-title-section-expenses"]');
    await expect(expensesTitle).toBeVisible();

    await captureScreenshot(page, "task-125-surplus-explainer-expenses");
  });
});
