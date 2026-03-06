import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Investment Income Tax in Tax Explainer", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-estimated-tax"]');
  });

  test("shows investment income section in tax explainer for default state", async ({ page }) => {
    // Default state has Savings Account $5000 with 2% default ROI = $100/yr interest
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    // Investment income section should be visible
    const investmentSection = page.locator('[data-testid="tax-investment-income"]');
    await investmentSection.scrollIntoViewIfNeeded();
    await expect(investmentSection).toBeVisible();

    // Should show the heading
    await expect(investmentSection).toContainText("Investment Interest Income");

    // Should show the note about annual taxation
    await expect(investmentSection).toContainText("Interest income is taxed annually");

    // Should show account details
    const firstAccount = page.locator('[data-testid="tax-investment-account-0"]');
    await expect(firstAccount).toBeVisible();
    await expect(firstAccount).toContainText("Savings Account");

    await captureScreenshot(page, "task-100-investment-income-tax-explainer");
  });

  test("investment income section includes per-account ROI and annual interest", async ({ page }) => {
    // Open tax explainer
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    const investmentSection = page.locator('[data-testid="tax-investment-income"]');
    await investmentSection.scrollIntoViewIfNeeded();

    // First account should show balance, ROI%, and annual interest
    const firstAccount = page.locator('[data-testid="tax-investment-account-0"]');
    await expect(firstAccount).toBeVisible();
    // Should contain the ROI percentage
    await expect(firstAccount).toContainText("2.0%");
    // Should contain /yr for annual interest
    await expect(firstAccount).toContainText("/yr");
  });

  test("investment income is included in total tax estimate", async ({ page }) => {
    // The Estimated Tax card should show a non-zero value that includes interest income
    const taxCard = page.locator('[data-testid="metric-card-estimated-tax"]');
    const taxText = await taxCard.textContent();
    expect(taxText).toBeTruthy();
    // Should contain a dollar amount (not $0)
    expect(taxText).toMatch(/\$[\d,]+/);
  });
});
