import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Net Worth metric card data-flow arrows", () => {
  test("hovering Net Worth card shows data-flow overlay with arrows", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    // No overlay initially
    const overlayBefore = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlayBefore).not.toBeAttached();

    // Hover the Net Worth card
    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();

    // Wait for arrows to appear
    await page.waitForSelector('[data-testid="data-flow-overlay"]', { timeout: 3000 });
    const overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).toBeAttached();

    // Verify SVG paths are drawn (at least 2 arrows: assets + debts)
    const paths = overlay.locator("path");
    const pathCount = await paths.count();
    expect(pathCount).toBeGreaterThanOrEqual(4); // 2 per arrow (glow + main)

    await captureScreenshot(page, "task-71-net-worth-arrows");
  });

  test("source sections get highlighted when Net Worth card is hovered", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();

    // Wait for highlight attributes to be set
    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });

    // Assets section should be highlighted positive (green)
    const assetsEl = page.locator('[data-dataflow-source="section-assets"]');
    await expect(assetsEl).toHaveAttribute("data-dataflow-highlighted", "positive");

    // Debts section should be highlighted negative (red)
    const debtsEl = page.locator('[data-dataflow-source="section-debts"]');
    await expect(debtsEl).toHaveAttribute("data-dataflow-highlighted", "negative");

    await captureScreenshot(page, "task-71-source-highlights");
  });

  test("arrows disappear when mouse leaves the Net Worth card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();
    await page.waitForSelector('[data-testid="data-flow-overlay"]', { timeout: 3000 });

    // Move mouse away
    await page.mouse.move(0, 0);

    // Overlay should disappear
    await expect(page.locator('[data-testid="data-flow-overlay"]')).not.toBeAttached({ timeout: 3000 });

    // Highlights should be removed
    const highlighted = page.locator('[data-dataflow-highlighted]');
    await expect(highlighted).toHaveCount(0);
  });

  test("Net Worth breakdown text is shown on hover", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();

    // Breakdown text should become visible
    const breakdown = netWorthCard.locator('[data-testid="metric-breakdown"]');
    await expect(breakdown).toBeVisible();
  });

  test("keyboard focus activates arrows on Net Worth card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    // Tab to the Net Worth card
    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.focus();

    // Arrows should appear
    await page.waitForSelector('[data-testid="data-flow-overlay"]', { timeout: 3000 });
    await expect(page.locator('[data-testid="data-flow-overlay"]')).toBeAttached();

    await captureScreenshot(page, "task-71-keyboard-focus-arrows");
  });
});
