import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Monthly Cash Flow — explainer modal", () => {
  test("clicking Monthly Cash Flow card opens explainer modal", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-cash-flow"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await surplusCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    // Income and expenses source cards should be visible
    await expect(page.locator('[data-testid="explainer-source-section-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-section-expenses"]')).toBeVisible();

    await captureScreenshot(page, "task-86-surplus-explainer-modal");
  });

  test("Monthly Cash Flow explainer shows income source card with items", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-cash-flow"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await surplusCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    // Income source card should have the title
    const incomeTitle = page.locator('[data-testid="source-summary-title-section-income"]');
    await expect(incomeTitle).toBeVisible();
  });

  test("Monthly Cash Flow explainer shows expenses source card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-cash-flow"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await surplusCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    const expensesTitle = page.locator('[data-testid="source-summary-title-section-expenses"]');
    await expect(expensesTitle).toBeVisible();

    await captureScreenshot(page, "task-86-surplus-expenses-source");
  });
});
