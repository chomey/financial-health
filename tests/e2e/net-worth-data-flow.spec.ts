import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Net Worth metric card data-flow arrows", () => {
  test("hovering Net Worth card shows spotlight overlay", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    // Spotlight overlay inactive initially
    const overlay = page.locator('[data-testid="spotlight-overlay"]');
    await expect(overlay).toHaveCSS("opacity", "0");

    // Hover the Net Worth card
    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();

    // Wait for spotlight to activate
    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });
    await expect(overlay).toHaveCSS("opacity", "1");

    await captureScreenshot(page, "task-71-net-worth-arrows");
  });

  test("source sections get highlighted when Net Worth card is hovered", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();

    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });

    const assetsEl = page.locator('[data-dataflow-source="section-assets"]');
    await expect(assetsEl).toHaveAttribute("data-dataflow-highlighted", "positive");

    const debtsEl = page.locator('[data-dataflow-source="section-debts"]');
    await expect(debtsEl).toHaveAttribute("data-dataflow-highlighted", "negative");

    await captureScreenshot(page, "task-71-source-highlights");
  });

  test("spotlight clears when mouse leaves the Net Worth card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();
    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });

    await page.mouse.move(0, 0);

    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0", { timeout: 3000 });

    const highlighted = page.locator('[data-dataflow-highlighted]');
    await expect(highlighted).toHaveCount(0);
  });

  test("Net Worth breakdown text is shown on hover", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.hover();

    const breakdown = netWorthCard.locator('[data-testid="metric-breakdown"]');
    await expect(breakdown).toBeVisible();
  });

  test("keyboard focus activates spotlight on Net Worth card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-net-worth"]');

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.focus();

    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");

    await captureScreenshot(page, "task-71-keyboard-focus-arrows");
  });
});
