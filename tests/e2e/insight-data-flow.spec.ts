import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Insight card — click-to-explain", () => {
  test("clicking insight card opens explainer modal", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    // No explainer modal initially
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible();

    // Find a surplus insight card (always present with mock data)
    const insightCard = page.locator('[data-insight-type="surplus"]').first();
    await expect(insightCard).toBeVisible();

    await insightCard.click();

    // Explainer modal should appear
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await captureScreenshot(page, "task-74-insight-surplus-explainer");
  });

  test("explainer modal shows source sections for surplus insight", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const surplusInsight = page.locator('[data-insight-type="surplus"]').first();
    await surplusInsight.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await expect(page.locator('[data-testid="explainer-source-section-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-section-expenses"]')).toBeVisible();
  });

  test("explainer modal closes on Escape from insight", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const insightCard = page.locator('[data-insight-type="surplus"]').first();
    await insightCard.click();
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible({ timeout: 3000 });
  });

  test("keyboard Enter activates explainer on insight card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const insightCard = page.locator('[data-insight-type="surplus"]').first();
    await insightCard.focus();
    await page.keyboard.press("Enter");

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
  });

  test("runway insight click shows explainer with assets and expenses", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const runwayInsight = page.locator('[data-insight-type="runway"]').first();
    await runwayInsight.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="explainer-source-section-assets"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-section-expenses"]')).toBeVisible();

    await captureScreenshot(page, "task-74-insight-runway-explainer");
  });

  test("net-worth insight click shows explainer with assets and debts", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const netWorthInsight = page.locator('[data-insight-type="net-worth"]').first();
    await netWorthInsight.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="explainer-source-section-assets"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-section-debts"]')).toBeVisible();

    await captureScreenshot(page, "task-74-insight-net-worth-explainer");
  });
});
