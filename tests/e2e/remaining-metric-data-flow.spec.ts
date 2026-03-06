import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Estimated Tax metric card data-flow", () => {
  test("hovering Estimated Tax card shows spotlight and highlights income", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-estimated-tax"]');

    const card = page.locator('[data-testid="metric-card-estimated-tax"]');
    await card.hover();

    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");

    const incomeEl = page.locator('[data-dataflow-source="section-income"]');
    await expect(incomeEl).toHaveAttribute("data-dataflow-highlighted", "positive");

    await captureScreenshot(page, "task-73-estimated-tax-arrows");
  });

  test("spotlight clears when mouse leaves Estimated Tax card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-estimated-tax"]');

    const card = page.locator('[data-testid="metric-card-estimated-tax"]');
    await card.hover();
    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });

    await page.mouse.move(0, 0);
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0", { timeout: 3000 });
  });
});

test.describe("Financial Runway metric card data-flow", () => {
  test("hovering Financial Runway card shows spotlight with assets and expenses", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-financial-runway"]');

    const card = page.locator('[data-testid="metric-card-financial-runway"]');
    await card.hover();

    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");

    const assetsEl = page.locator('[data-dataflow-source="section-assets"]');
    await expect(assetsEl).toHaveAttribute("data-dataflow-highlighted", "positive");

    const expensesEl = page.locator('[data-dataflow-source="section-expenses"]');
    await expect(expensesEl).toHaveAttribute("data-dataflow-highlighted", "negative");

    await captureScreenshot(page, "task-73-financial-runway-arrows");
  });

  test("spotlight clears when mouse leaves Financial Runway card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-financial-runway"]');

    const card = page.locator('[data-testid="metric-card-financial-runway"]');
    await card.hover();
    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });

    await page.mouse.move(0, 0);
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0", { timeout: 3000 });
  });
});

test.describe("Debt-to-Asset Ratio metric card data-flow", () => {
  test("hovering Debt-to-Asset Ratio card shows spotlight with assets and debts", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-debt-to-asset-ratio"]');

    const card = page.locator('[data-testid="metric-card-debt-to-asset-ratio"]');
    await card.hover();

    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");

    const assetsEl = page.locator('[data-dataflow-source="section-assets"]');
    await expect(assetsEl).toHaveAttribute("data-dataflow-highlighted", "positive");

    const debtsEl = page.locator('[data-dataflow-source="section-debts"]');
    await expect(debtsEl).toHaveAttribute("data-dataflow-highlighted", "negative");

    await captureScreenshot(page, "task-73-debt-to-asset-ratio-arrows");
  });

  test("spotlight clears when mouse leaves Debt-to-Asset Ratio card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-debt-to-asset-ratio"]');

    const card = page.locator('[data-testid="metric-card-debt-to-asset-ratio"]');
    await card.hover();
    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });

    await page.mouse.move(0, 0);
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0", { timeout: 3000 });
  });
});
