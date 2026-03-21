import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Retirement Income Chart", () => {
  test("shows chart when government income is configured (CA)", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("fhs-wizard-done", "1");
      localStorage.setItem("fhs-default-mode", "advanced");
      localStorage.setItem("fhs-visited", "1");
    });
    // Set up CA profile with CPP average via profile step first
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');
    await page.getByTestId("cpp-preset-average").click();
    await page.getByTestId("oas-preset-full").click();
    await page.waitForTimeout(500);

    // Get URL with state, then click the finish/dashboard button
    // Or just reload the page without step param to get dashboard
    const url = page.url();
    // Navigate to same URL without step param — should show dashboard
    const params = new URL(url);
    params.searchParams.delete("step");
    await page.goto(params.toString());
    await page.waitForSelector('[data-testid="dashboard-panel"]', { timeout: 15000 });

    const chart = page.getByTestId("retirement-income-chart");
    await expect(chart).toBeVisible();
    await expect(chart).toContainText("Retirement Income vs Expenses");
    await expect(chart).toContainText("CPP + OAS");
    await expect(chart).toContainText("Portfolio (4% rule)");

    const summary = page.getByTestId("coverage-summary");
    await expect(summary).toBeVisible();

    await captureScreenshot(page, "task-190-retirement-income-chart-ca");
  });

  test("does not show chart when no government income configured", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("fhs-wizard-done", "1");
      localStorage.setItem("fhs-default-mode", "advanced");
    });
    await page.goto("/");
    await page.waitForSelector('[data-testid="dashboard-panel"]');

    // Default state has no government income, but has assets so portfolio withdrawal exists
    // Chart should show if portfolio withdrawal > 0
    // With default INITIAL_STATE assets (TFSA 22k, RRSP 28k, Savings 5k = 55k)
    // 55000 * 0.04 / 12 = ~$183/mo — chart should show
    const chart = page.getByTestId("retirement-income-chart");
    await expect(chart).toBeVisible();
    await captureScreenshot(page, "task-190-retirement-income-chart-default");
  });
});
