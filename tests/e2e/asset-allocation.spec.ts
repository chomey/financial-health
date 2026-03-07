import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

// Asset allocation was merged into the Net Worth Donut chart
test.describe("Asset Allocation (via Donut Chart)", () => {
  test("renders donut chart with default data", async ({ page }) => {
    await page.goto("/");

    const chart = page.locator('[data-testid="donut-chart"]');
    await expect(chart).toBeVisible();

    // Should show "Net Worth Breakdown" heading
    await expect(chart.locator("text=Net Worth Breakdown")).toBeVisible();

    // Should have view toggle buttons
    await expect(chart.locator("button", { hasText: "By Type" })).toBeVisible();
    await expect(chart.locator("button", { hasText: "By Liquidity" })).toBeVisible();

    await captureScreenshot(page, "task-48-allocation-chart-category");
  });

  test("shows category breakdown with default assets", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator('[data-testid="donut-chart"]');
    await expect(chart).toBeVisible();

    // Default data has TFSA, Savings Account, and Brokerage
    await expect(chart.getByText("TFSA").first()).toBeVisible();
    await expect(chart.getByText("Savings").first()).toBeVisible();
  });

  test("toggles between category and liquidity views", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator('[data-testid="donut-chart"]');
    await expect(chart).toBeVisible();

    // Click "By Liquidity" toggle
    const liquidityBtn = chart.locator("button", { hasText: "By Liquidity" });
    await liquidityBtn.click();
    await expect(liquidityBtn).toHaveAttribute("aria-pressed", "true");

    // Should show Liquid/Illiquid instead of individual categories
    const chartText = await chart.textContent();
    expect(chartText).toMatch(/liquid/i);

    await captureScreenshot(page, "task-48-allocation-chart-liquidity");

    // Toggle back to category
    await chart.locator("button", { hasText: "By Type" }).click();
    await expect(chart.getByText("TFSA").first()).toBeVisible();
  });

  test("chart is positioned in the dashboard section", async ({ page }) => {
    await page.goto("/");
    const dashboard = page.locator('[aria-label="Financial dashboard"]');
    const chart = dashboard.locator('[data-testid="donut-chart"]');
    await expect(chart).toBeVisible();
  });
});
