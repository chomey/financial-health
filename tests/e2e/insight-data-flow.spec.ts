import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Insight card data-flow arrows", () => {
  test("hovering insight card shows spotlight overlay", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    // Spotlight overlay inactive initially
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0");

    // Find a surplus insight card (always present with mock data)
    const insightCard = page.locator('[data-insight-type="surplus"]').first();
    await expect(insightCard).toBeVisible();

    await insightCard.hover();

    // Wait for spotlight to activate
    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");

    await captureScreenshot(page, "task-74-insight-surplus-arrows");
  });

  test("source sections get highlighted when insight card is hovered", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    // Hover a surplus insight (references income + expenses)
    const surplusInsight = page.locator('[data-insight-type="surplus"]').first();
    await surplusInsight.hover();

    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });

    const incomeEl = page.locator('[data-dataflow-source="section-income"]');
    await expect(incomeEl).toHaveAttribute("data-dataflow-highlighted", "positive");

    const expensesEl = page.locator('[data-dataflow-source="section-expenses"]');
    await expect(expensesEl).toHaveAttribute("data-dataflow-highlighted", "negative");
  });

  test("spotlight clears when mouse leaves insight card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const insightCard = page.locator('[data-insight-type="surplus"]').first();
    await insightCard.hover();
    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });

    await page.mouse.move(0, 0);

    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0", { timeout: 3000 });

    await expect(page.locator('[data-dataflow-highlighted]')).toHaveCount(0);
  });

  test("keyboard focus activates spotlight on insight card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const insightCard = page.locator('[data-insight-type="surplus"]').first();
    await insightCard.focus();

    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");
  });

  test("runway insight highlights assets and expenses", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const runwayInsight = page.locator('[data-insight-type="runway"]').first();
    await runwayInsight.hover();

    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });

    const assetsEl = page.locator('[data-dataflow-source="section-assets"]');
    await expect(assetsEl).toHaveAttribute("data-dataflow-highlighted", "positive");

    const expensesEl = page.locator('[data-dataflow-source="section-expenses"]');
    await expect(expensesEl).toHaveAttribute("data-dataflow-highlighted", "negative");

    await captureScreenshot(page, "task-74-insight-runway-arrows");
  });

  test("net-worth insight highlights assets and debts", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const netWorthInsight = page.locator('[data-insight-type="net-worth"]').first();
    await netWorthInsight.hover();

    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });

    const assetsEl = page.locator('[data-dataflow-source="section-assets"]');
    await expect(assetsEl).toHaveAttribute("data-dataflow-highlighted", "positive");

    const debtsEl = page.locator('[data-dataflow-source="section-debts"]');
    await expect(debtsEl).toHaveAttribute("data-dataflow-highlighted", "negative");

    await captureScreenshot(page, "task-74-insight-net-worth-arrows");
  });
});
