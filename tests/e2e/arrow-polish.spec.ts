import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Arrow visual polish — particles, responsive, accessibility", () => {
  test("hovering metric card shows flowing particles along arrow paths", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();

    await page.waitForSelector('[data-testid="data-flow-overlay"]', { timeout: 3000 });

    // SVG should contain circle elements (particles) with animateMotion
    const particles = page.locator('[data-testid="data-flow-overlay"] circle');
    const particleCount = await particles.count();
    expect(particleCount).toBeGreaterThanOrEqual(3); // at least 3 particles per arrow

    // Each particle should have animateMotion child
    const animateMotions = page.locator('[data-testid="data-flow-overlay"] circle animateMotion');
    const animCount = await animateMotions.count();
    expect(animCount).toBeGreaterThanOrEqual(3);

    await captureScreenshot(page, "task-75-flowing-particles");
  });

  test("arrow label pills have rounded pill style", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();

    await page.waitForSelector('[data-testid="data-flow-overlay"]', { timeout: 3000 });

    // Check that label pill rects exist with rx=10 (rounded)
    const pillRects = page.locator('[data-testid="data-flow-overlay"] rect[rx="10"]');
    const pillCount = await pillRects.count();
    expect(pillCount).toBeGreaterThanOrEqual(1);

    await captureScreenshot(page, "task-75-label-pills");
  });

  test("SVG overlay has aria-hidden and will-change for performance", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();

    await page.waitForSelector('[data-testid="data-flow-overlay"]', { timeout: 3000 });

    const overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).toHaveAttribute("aria-hidden", "true");

    const willChange = await overlay.evaluate((el) => (el as SVGElement).style.willChange);
    expect(willChange).toBe("transform");
  });

  test("metric card has aria-live region for screen reader announcements", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    // Check aria-live region exists
    const ariaLive = page.locator('[data-testid="metric-card-net-worth"] [data-testid="dataflow-aria-live"]');
    await expect(ariaLive).toBeAttached();
    await expect(ariaLive).toHaveAttribute("aria-live", "polite");

    // Before hover, should be empty
    await expect(ariaLive).toHaveText("");

    // Hover to activate
    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();
    await page.waitForTimeout(500);

    // After hover, should announce data sources
    const text = await ariaLive.textContent();
    expect(text).toContain("Net Worth is calculated from:");
  });

  test("mobile viewport shows highlight-only mode without SVG arrows", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    // Use focus instead of hover — hover doesn't reliably fire on mobile viewports
    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.focus();

    // Wait for highlights to be applied
    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });

    // SVG overlay should NOT be present on mobile
    const overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).not.toBeAttached();

    // Source sections should be highlighted via CSS border pulse
    const highlighted = page.locator('[data-dataflow-highlighted]');
    const count = await highlighted.count();
    expect(count).toBeGreaterThanOrEqual(1);

    await captureScreenshot(page, "task-75-mobile-highlight-only");
  });

  test("arrows disappear and highlights clear on mouse leave", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();
    await page.waitForSelector('[data-testid="data-flow-overlay"]', { timeout: 3000 });

    // Move mouse away
    await page.mouse.move(0, 0);

    // Overlay and highlights should clear
    await expect(page.locator('[data-testid="data-flow-overlay"]')).not.toBeAttached({ timeout: 3000 });
    await expect(page.locator('[data-dataflow-highlighted]')).toHaveCount(0);

    // aria-live should be cleared too
    const ariaLive = page.locator('[data-testid="metric-card-net-worth"] [data-testid="dataflow-aria-live"]');
    await expect(ariaLive).toHaveText("");
  });
});
