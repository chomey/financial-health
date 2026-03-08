import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Monthly Cash Flow metric card — click-to-explain", () => {
  test("clicking Monthly Cash Flow card opens explainer modal", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-cash-flow"]');

    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible();

    const surplusCard = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await surplusCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await captureScreenshot(page, "task-72-monthly-surplus-explainer");
  });

  test("explainer modal shows income (positive) and expenses (negative)", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-cash-flow"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await surplusCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await expect(page.locator('[data-testid="explainer-source-section-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-section-expenses"]')).toBeVisible();

    await captureScreenshot(page, "task-72-surplus-source-explainer");
  });

  test("explainer modal closes on Escape", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-cash-flow"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await surplusCard.click();
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible({ timeout: 3000 });
  });

  test("Monthly Cash Flow breakdown text shown on hover", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-cash-flow"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await surplusCard.hover();

    const breakdown = surplusCard.locator('[data-testid="metric-breakdown"]');
    await expect(breakdown).toBeVisible();
  });

  test("keyboard Enter activates explainer on Monthly Cash Flow card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-cash-flow"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await surplusCard.focus();
    await page.keyboard.press("Enter");

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await captureScreenshot(page, "task-72-keyboard-explainer");
  });
});
