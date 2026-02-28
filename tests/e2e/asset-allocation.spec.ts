import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Asset Allocation Chart", () => {
  test("renders allocation chart with default data", async ({ page }) => {
    await page.goto("/");

    const chart = page.locator('[data-testid="allocation-chart"]');
    await expect(chart).toBeVisible();

    // Should show "Asset Allocation" heading
    await expect(chart.locator("text=Asset Allocation")).toBeVisible();

    // Should have view toggle buttons
    await expect(chart.locator("button", { hasText: "By Type" })).toBeVisible();
    await expect(chart.locator("button", { hasText: "By Liquidity" })).toBeVisible();

    await captureScreenshot(page, "task-48-allocation-chart-category");
  });

  test("shows category breakdown with default assets", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator('[data-testid="allocation-chart"]');
    await expect(chart).toBeVisible();

    // Default data has TFSA + RRSP (retirement) and Savings Account (savings & checking)
    // These appear in the compact legend below the doughnut
    // Use first() to avoid matching both recharts Legend and compact legend
    await expect(chart.getByText("Retirement Accounts").first()).toBeVisible();
    await expect(chart.getByText("Savings & Checking").first()).toBeVisible();
  });

  test("toggles between category and liquidity views", async ({ page }) => {
    await page.goto("/");
    const chart = page.locator('[data-testid="allocation-chart"]');
    await expect(chart).toBeVisible();

    // Click "By Liquidity" toggle
    const liquidityBtn = chart.locator("button", { hasText: "By Liquidity" });
    await liquidityBtn.click();
    // Wait for the button to become active
    await expect(liquidityBtn).toHaveAttribute("aria-pressed", "true");

    // Retirement Accounts should be gone, replaced with Liquid
    await expect(chart.getByText("Retirement Accounts")).not.toBeVisible();

    await captureScreenshot(page, "task-48-allocation-chart-liquidity");

    // Toggle back to category
    await chart.locator("button", { hasText: "By Type" }).click();
    await expect(chart.getByText("Retirement Accounts").first()).toBeVisible();
  });

  test("chart is positioned in the dashboard section", async ({ page }) => {
    await page.goto("/");
    const dashboard = page.locator('[aria-label="Financial dashboard"]');
    const chart = dashboard.locator('[data-testid="allocation-chart"]');
    await expect(chart).toBeVisible();
  });
});
