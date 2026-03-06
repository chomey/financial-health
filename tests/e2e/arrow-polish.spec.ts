import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Explainer modal — click-to-explain polish, responsive, accessibility", () => {
  test("clicking metric card shows explainer modal with source cards and result", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="explainer-title"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-result-value"]')).toBeVisible();

    await captureScreenshot(page, "task-75-explainer-modal");
  });

  test("explainer modal has correct aria attributes for accessibility", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    const backdrop = page.locator('[data-testid="explainer-backdrop"]');
    await expect(backdrop).toHaveAttribute("aria-modal", "true");
    await expect(backdrop).toHaveAttribute("role", "dialog");
  });

  test("metric card has aria-live region for screen reader announcements", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const ariaLive = page.locator('[data-testid="metric-card-net-worth"] [data-testid="dataflow-aria-live"]');
    await expect(ariaLive).toBeAttached();
    await expect(ariaLive).toHaveAttribute("aria-live", "polite");
    await expect(ariaLive).toHaveText("");
  });

  test("mobile viewport shows explainer modal fullscreen-like", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await captureScreenshot(page, "task-75-mobile-explainer");
  });

  test("explainer modal closes when close button is clicked", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.click();
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await page.locator('[data-testid="explainer-close"]').click();
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible({ timeout: 3000 });

    // Aria-live should be clear
    const ariaLive = page.locator('[data-testid="metric-card-net-worth"] [data-testid="dataflow-aria-live"]');
    await expect(ariaLive).toHaveText("");
  });

  test("click-to-explain hint visible on hover", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();

    const hint = netWorthCard.locator('[data-testid="click-to-explain-hint"]');
    await expect(hint).toBeVisible();
    await expect(hint).toContainText("Click to explain");
  });
});
