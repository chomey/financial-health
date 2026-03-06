import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Net Worth metric card — click-to-explain", () => {
  test("clicking Net Worth card opens explainer modal", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    // No explainer modal initially
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible();

    // Click the Net Worth card
    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.click();

    // Explainer modal should appear
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await captureScreenshot(page, "task-71-net-worth-explainer");
  });

  test("explainer modal shows source sections for Net Worth", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    // Should show assets (positive) and debts (negative)
    await expect(page.locator('[data-testid="explainer-source-section-assets"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-section-debts"]')).toBeVisible();

    await captureScreenshot(page, "task-71-source-explainer");
  });

  test("explainer modal closes when clicking backdrop or Escape", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.click();
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    // Press Escape to close
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible({ timeout: 3000 });
  });

  test("Net Worth breakdown text is shown on hover", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();

    const breakdown = netWorthCard.locator('[data-testid="metric-breakdown"]');
    await expect(breakdown).toBeVisible();
  });

  test("keyboard Enter activates explainer modal on Net Worth card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.focus();
    await page.keyboard.press("Enter");

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await captureScreenshot(page, "task-71-keyboard-explainer");
  });
});
