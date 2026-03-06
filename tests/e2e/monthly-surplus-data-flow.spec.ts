import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Monthly Surplus metric card data-flow arrows", () => {
  test("hovering Monthly Surplus card shows spotlight overlay", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-surplus"]');

    const overlay = page.locator('[data-testid="spotlight-overlay"]');
    await expect(overlay).toHaveCSS("opacity", "0");

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.hover();

    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });
    await expect(overlay).toHaveCSS("opacity", "1");

    await captureScreenshot(page, "task-72-monthly-surplus-arrows");
  });

  test("income section highlighted positive, expenses highlighted negative", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-surplus"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.hover();

    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });

    const incomeEl = page.locator('[data-dataflow-source="section-income"]');
    await expect(incomeEl).toHaveAttribute("data-dataflow-highlighted", "positive");

    const expensesEl = page.locator('[data-dataflow-source="section-expenses"]');
    await expect(expensesEl).toHaveAttribute("data-dataflow-highlighted", "negative");

    await captureScreenshot(page, "task-72-surplus-source-highlights");
  });

  test("spotlight clears when mouse leaves Monthly Surplus card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-surplus"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.hover();
    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });

    await page.mouse.move(0, 0);

    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0", { timeout: 3000 });

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

  test("keyboard focus activates spotlight on Monthly Surplus card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-surplus"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.focus();

    await page.waitForSelector('[data-dataflow-highlighted]', { timeout: 3000 });
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");

    await captureScreenshot(page, "task-72-keyboard-focus-arrows");
  });
});
