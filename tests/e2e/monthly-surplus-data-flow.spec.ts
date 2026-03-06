import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Monthly Surplus metric card — click-to-explain", () => {
  test("clicking Monthly Surplus card opens explainer modal", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-surplus"]');

    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible();

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await captureScreenshot(page, "task-72-monthly-surplus-explainer");
  });

  test("explainer modal shows income (positive) and expenses (negative)", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-surplus"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await expect(page.locator('[data-testid="explainer-source-section-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-section-expenses"]')).toBeVisible();

    await captureScreenshot(page, "task-72-surplus-source-explainer");
  });

  test("explainer modal closes on Escape", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-surplus"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.click();
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible({ timeout: 3000 });
  });

  test("Monthly Surplus breakdown text shown on hover", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-surplus"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.hover();

    const breakdown = surplusCard.locator('[data-testid="metric-breakdown"]');
    await expect(breakdown).toBeVisible();
  });

  test("keyboard Enter activates explainer on Monthly Surplus card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-surplus"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.focus();
    await page.keyboard.press("Enter");

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await captureScreenshot(page, "task-72-keyboard-explainer");
  });
});
