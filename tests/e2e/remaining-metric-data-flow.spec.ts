import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Estimated Tax metric card data-flow arrows", () => {
  test("hovering Estimated Tax card shows arrow from income section", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-estimated-tax"]');

    const card = page.locator('[data-testid="metric-card-estimated-tax"]');
    await card.hover();

    // Wait for arrows to appear
    await page.waitForSelector('[data-testid="data-flow-overlay"]', { timeout: 3000 });
    const overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).toBeAttached();

    // Income section should be highlighted positive (green)
    const incomeEl = page.locator('[data-dataflow-source="section-income"]');
    await expect(incomeEl).toHaveAttribute("data-dataflow-highlighted", "positive");

    await captureScreenshot(page, "task-73-estimated-tax-arrows");
  });

  test("arrows disappear when mouse leaves Estimated Tax card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-estimated-tax"]');

    const card = page.locator('[data-testid="metric-card-estimated-tax"]');
    await card.hover();
    await page.waitForSelector('[data-testid="data-flow-overlay"]', { timeout: 3000 });

    await page.mouse.move(0, 0);
    await expect(page.locator('[data-testid="data-flow-overlay"]')).not.toBeAttached({ timeout: 3000 });
  });
});

test.describe("Financial Runway metric card data-flow arrows", () => {
  test("hovering Financial Runway card shows arrows from assets and expenses", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-financial-runway"]');

    const card = page.locator('[data-testid="metric-card-financial-runway"]');
    await card.hover();

    await page.waitForSelector('[data-testid="data-flow-overlay"]', { timeout: 3000 });
    const overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).toBeAttached();

    // Assets should be highlighted positive
    const assetsEl = page.locator('[data-dataflow-source="section-assets"]');
    await expect(assetsEl).toHaveAttribute("data-dataflow-highlighted", "positive");

    // Expenses should be highlighted negative
    const expensesEl = page.locator('[data-dataflow-source="section-expenses"]');
    await expect(expensesEl).toHaveAttribute("data-dataflow-highlighted", "negative");

    await captureScreenshot(page, "task-73-financial-runway-arrows");
  });

  test("arrows disappear when mouse leaves Financial Runway card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-financial-runway"]');

    const card = page.locator('[data-testid="metric-card-financial-runway"]');
    await card.hover();
    await page.waitForSelector('[data-testid="data-flow-overlay"]', { timeout: 3000 });

    await page.mouse.move(0, 0);
    await expect(page.locator('[data-testid="data-flow-overlay"]')).not.toBeAttached({ timeout: 3000 });
  });
});

test.describe("Debt-to-Asset Ratio metric card data-flow arrows", () => {
  test("hovering Debt-to-Asset Ratio card shows arrows from assets and debts", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-debt-to-asset-ratio"]');

    const card = page.locator('[data-testid="metric-card-debt-to-asset-ratio"]');
    await card.hover();

    await page.waitForSelector('[data-testid="data-flow-overlay"]', { timeout: 3000 });
    const overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).toBeAttached();

    // Assets should be highlighted positive
    const assetsEl = page.locator('[data-dataflow-source="section-assets"]');
    await expect(assetsEl).toHaveAttribute("data-dataflow-highlighted", "positive");

    // Debts should be highlighted negative
    const debtsEl = page.locator('[data-dataflow-source="section-debts"]');
    await expect(debtsEl).toHaveAttribute("data-dataflow-highlighted", "negative");

    await captureScreenshot(page, "task-73-debt-to-asset-ratio-arrows");
  });

  test("arrows disappear when mouse leaves Debt-to-Asset Ratio card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-debt-to-asset-ratio"]');

    const card = page.locator('[data-testid="metric-card-debt-to-asset-ratio"]');
    await card.hover();
    await page.waitForSelector('[data-testid="data-flow-overlay"]', { timeout: 3000 });

    await page.mouse.move(0, 0);
    await expect(page.locator('[data-testid="data-flow-overlay"]')).not.toBeAttached({ timeout: 3000 });
  });
});
