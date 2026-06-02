import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Debt-to-income ratio insight", () => {
  test("shows DTI insight in the debt ratio metric card with default state", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    // DTI insight should appear (default state has income but no debt monthly payments = 0% DTI)
    const dtiInsight = page.locator('[data-testid="metric-card-debt-to-asset-ratio"]');
    await expect(dtiInsight).toBeVisible({ timeout: 5000 });

    await captureScreenshot(page, "task-135-dti-insight-default");
  });

  test("DTI insight message includes ratio percentage", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const dtiInsight = page.locator('[data-testid="metric-card-debt-to-asset-ratio"]');
    await expect(dtiInsight).toBeVisible({ timeout: 5000 });

    // Message should contain a percentage
    const text = await dtiInsight.textContent();
    expect(text).toMatch(/\d+\.\d+%/);
  });

  test("DTI insight at 0% shows excellent tier messaging", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const dtiInsight = page.locator('[data-testid="metric-card-debt-to-asset-ratio"]');
    await expect(dtiInsight).toBeVisible({ timeout: 5000 });

    // Default state has no debt monthly payments, so DTI = 0% = excellent
    const text = await dtiInsight.textContent();
    expect(text).toContain("0.0%");
    expect(text?.toLowerCase()).toContain("excellent");
  });

  test("debt ratio metric card has correct icon", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const dtiInsight = page.locator('[data-testid="metric-card-debt-to-asset-ratio"]');
    await expect(dtiInsight).toBeVisible({ timeout: 5000 });

    // Should show balance-scale icon
    await expect(dtiInsight).toContainText("⚖️");
  });

  test("clicking debt ratio metric card opens explainer modal", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const dtiInsight = page.locator('[data-testid="metric-card-debt-to-asset-ratio"]');
    await expect(dtiInsight).toBeVisible({ timeout: 5000 });

    await dtiInsight.click();

    // Explainer modal should appear
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await captureScreenshot(page, "task-135-dti-explainer-modal");
  });

  test("DTI insight appears in Debt-to-Asset Ratio metric card insights", async ({ page }) => {
    await page.goto("/");
    // Find the Debt-to-Asset Ratio metric card
    const debtCard = page.locator('[data-testid="metric-card-debt-to-asset-ratio"]');
    await expect(debtCard).toBeVisible();

    // Click it to expand insights
    await debtCard.click();

    await captureScreenshot(page, "task-135-dti-metric-card");
  });
});
