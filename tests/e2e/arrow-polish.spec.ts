import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Spotlight visual polish — formula bar, responsive, accessibility", () => {
  test("hovering metric card shows formula bar with computation terms", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();

    await page.waitForSelector('[data-testid="formula-bar"]', { timeout: 3000 });

    // Formula bar should have terms and a result
    const formulaBar = page.locator('[data-testid="formula-bar"]');
    await expect(formulaBar).toBeVisible();

    const result = page.locator('[data-testid="formula-result"]');
    await expect(result).toBeVisible();

    await captureScreenshot(page, "task-75-formula-bar");
  });

  test("spotlight overlay has aria-hidden for accessibility", async ({ page }) => {
    await page.goto("/");

    const overlay = page.locator('[data-testid="spotlight-overlay"]');
    await expect(overlay).toHaveAttribute("aria-hidden", "true");
  });

  test("metric card has aria-live region for screen reader announcements", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const ariaLive = page.locator('[data-testid="metric-card-net-worth"] [data-testid="dataflow-aria-live"]');
    await expect(ariaLive).toBeAttached();
    await expect(ariaLive).toHaveAttribute("aria-live", "polite");

    await expect(ariaLive).toHaveText("");

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();
    await page.waitForTimeout(500);

    const text = await ariaLive.textContent();
    expect(text).toContain("Net Worth is calculated from:");
  });

  test("mobile viewport shows highlight-only mode with formula bar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.focus();

    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });

    // Source sections should be highlighted
    const highlighted = page.locator('[data-dataflow-highlighted]');
    const count = await highlighted.count();
    expect(count).toBeGreaterThanOrEqual(1);

    await captureScreenshot(page, "task-75-mobile-highlight-only");
  });

  test("spotlight and highlights clear on mouse leave", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();
    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });

    await page.mouse.move(0, 0);

    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0", { timeout: 3000 });
    await expect(page.locator('[data-dataflow-highlighted]')).toHaveCount(0);

    const ariaLive = page.locator('[data-testid="metric-card-net-worth"] [data-testid="dataflow-aria-live"]');
    await expect(ariaLive).toHaveText("");
  });

  test("data-dataflow-active-target attribute set on hovered metric card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();

    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });
    await expect(netWorthCard).toHaveAttribute("data-dataflow-active-target", "true");
  });
});
