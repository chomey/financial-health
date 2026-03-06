import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Estimated Tax metric card — click-to-explain", () => {
  test("clicking Estimated Tax card opens explainer with income source", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-estimated-tax"]');

    const card = page.locator('[data-testid="metric-card-estimated-tax"]');
    await card.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="explainer-source-section-income"]')).toBeVisible();

    await captureScreenshot(page, "task-73-estimated-tax-explainer");
  });

  test("explainer modal closes on close button click", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-estimated-tax"]');

    const card = page.locator('[data-testid="metric-card-estimated-tax"]');
    await card.click();
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await page.locator('[data-testid="explainer-close"]').click();
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe("Financial Runway metric card — click-to-explain", () => {
  test("clicking Financial Runway card shows explainer with assets and expenses", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-financial-runway"]');

    const card = page.locator('[data-testid="metric-card-financial-runway"]');
    await card.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="explainer-source-section-assets"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-section-expenses"]')).toBeVisible();

    await captureScreenshot(page, "task-73-financial-runway-explainer");
  });

  test("explainer closes on Escape key", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-financial-runway"]');

    const card = page.locator('[data-testid="metric-card-financial-runway"]');
    await card.click();
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible({ timeout: 3000 });
  });
});

test.describe("Debt-to-Asset Ratio metric card — click-to-explain", () => {
  test("clicking Debt-to-Asset Ratio card shows explainer with assets and debts", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-debt-to-asset-ratio"]');

    const card = page.locator('[data-testid="metric-card-debt-to-asset-ratio"]');
    await card.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="explainer-source-section-assets"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-section-debts"]')).toBeVisible();

    await captureScreenshot(page, "task-73-debt-to-asset-ratio-explainer");
  });

  test("explainer closes on backdrop click", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-debt-to-asset-ratio"]');

    const card = page.locator('[data-testid="metric-card-debt-to-asset-ratio"]');
    await card.click();
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    // Click outside the modal (on the backdrop)
    await page.locator('[data-testid="explainer-backdrop"]').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible({ timeout: 3000 });
  });
});
