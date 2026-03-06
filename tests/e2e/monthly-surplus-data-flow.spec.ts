import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Monthly Surplus metric card data-flow arrows", () => {
  test("hovering Monthly Surplus card shows data-flow overlay with arrows", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-surplus"]');

    // No overlay initially
    const overlayBefore = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlayBefore).not.toBeAttached();

    // Hover the Monthly Surplus card
    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.hover();

    // Wait for arrows to appear
    await page.waitForSelector('[data-testid="data-flow-overlay"]', { timeout: 3000 });
    const overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).toBeAttached();

    // Verify SVG paths are drawn (at least 2 arrows: income + expenses = 4 paths with glow)
    const paths = overlay.locator("path");
    const pathCount = await paths.count();
    expect(pathCount).toBeGreaterThanOrEqual(4);

    await captureScreenshot(page, "task-72-monthly-surplus-arrows");
  });

  test("income section highlighted positive, expenses highlighted negative", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-surplus"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.hover();

    // Wait for highlight attributes to be set
    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });

    // Income section should be highlighted positive (green)
    const incomeEl = page.locator('[data-dataflow-source="section-income"]');
    await expect(incomeEl).toHaveAttribute("data-dataflow-highlighted", "positive");

    // Expenses section should be highlighted negative (red)
    const expensesEl = page.locator('[data-dataflow-source="section-expenses"]');
    await expect(expensesEl).toHaveAttribute("data-dataflow-highlighted", "negative");

    await captureScreenshot(page, "task-72-surplus-source-highlights");
  });

  test("arrows disappear when mouse leaves Monthly Surplus card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-surplus"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.hover();
    await page.waitForSelector('[data-testid="data-flow-overlay"]', { timeout: 3000 });

    // Move mouse away
    await page.mouse.move(0, 0);

    // Overlay should disappear
    await expect(page.locator('[data-testid="data-flow-overlay"]')).not.toBeAttached({ timeout: 3000 });

    // Highlights should be removed
    const highlighted = page.locator('[data-dataflow-highlighted]');
    await expect(highlighted).toHaveCount(0);
  });

  test("Monthly Surplus breakdown text shown on hover", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-surplus"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.hover();

    const breakdown = surplusCard.locator('[data-testid="metric-breakdown"]');
    await expect(breakdown).toBeVisible();
  });

  test("keyboard focus activates arrows on Monthly Surplus card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-surplus"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.focus();

    // Arrows should appear
    await page.waitForSelector('[data-testid="data-flow-overlay"]', { timeout: 3000 });
    await expect(page.locator('[data-testid="data-flow-overlay"]')).toBeAttached();

    await captureScreenshot(page, "task-72-keyboard-focus-arrows");
  });
});
