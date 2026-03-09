import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("App shell layout", () => {
  test("renders header and dashboard navigation", async ({ page }) => {
    await page.goto("/");

    // Header — h1 contains "Financial Health" on desktop
    const title = page.getByRole("heading", { level: 1 });
    await expect(title).toBeVisible();

    // Dashboard section navigation tabs
    await expect(page.getByRole("button", { name: "Projections" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Insights" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Metrics" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Money Steps" })).toBeVisible();

    // Dashboard metric cards
    await expect(page.locator('[aria-label="Net Worth"] h3')).toBeVisible();
    await expect(page.locator('[aria-label="Monthly Cash Flow"] h3')).toBeVisible();
    await expect(page.locator('[aria-label="Financial Runway"] h3')).toBeVisible();
    await expect(page.locator('[aria-label="Debt-to-Asset Ratio"] h3')).toBeVisible();

    await captureScreenshot(page, "task-3-app-shell-desktop");
  });

  test("inputs toggle switches to wizard view", async ({ page }) => {
    await page.goto("/");

    // Click Inputs toggle to switch to wizard/inputs view
    await page.getByRole("button", { name: "📝 Inputs" }).click();

    // Should show wizard navigation (e.g. Profile, Income, Assets steps)
    await expect(page.getByRole("button", { name: "Profile" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Assets" })).toBeVisible();

    // Switch back to dashboard
    await page.getByRole("button", { name: "📊 Dashboard" }).click();
    await expect(page.getByRole("button", { name: "Projections" })).toBeVisible();

    await captureScreenshot(page, "task-3-inputs-toggle");
  });

  test("responsive layout works on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Header still visible (abbreviated on mobile as "FH")
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Metric cards still visible
    await expect(page.locator('[aria-label="Net Worth"] h3')).toBeVisible();

    await captureScreenshot(page, "task-3-mobile-layout");
  });
});
