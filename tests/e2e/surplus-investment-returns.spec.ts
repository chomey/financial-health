import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Monthly Surplus — investment returns in explainer", () => {
  test("clicking Monthly Surplus card shows investment returns section", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-surplus"]');

    // Click the Monthly Surplus card to open explainer
    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    // The default state has TFSA, RRSP, Savings Account — all with default ROIs
    // Investment returns section should appear
    await expect(page.locator('[data-testid="investment-returns-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="investment-returns-list"]')).toBeVisible();

    // Should show individual asset returns
    const returnItems = page.locator('[data-testid="investment-returns-list"] li');
    await expect(returnItems).toHaveCount(3); // Savings Account, TFSA, RRSP

    // Should show total returns row (since there are multiple assets)
    await expect(page.locator('[data-testid="investment-returns-total"]')).toBeVisible();

    await captureScreenshot(page, "task-86-surplus-investment-returns");
  });

  test("investment returns section shows correct format per asset", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-surplus"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.click();

    await expect(page.locator('[data-testid="investment-returns-section"]')).toBeVisible({ timeout: 3000 });

    // Check format: "TFSA ($22k @ 5%)" → "+$92/mo" (approximately)
    const section = page.locator('[data-testid="investment-returns-section"]');
    const text = await section.textContent();
    expect(text).toContain("TFSA");
    expect(text).toContain("@ 5%");
    expect(text).toContain("RRSP");
    expect(text).toContain("Investment Returns");
    expect(text).toContain("(estimated)");
  });

  test("investment returns connection appears in assets source card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-monthly-surplus"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    // The assets source card should be visible (investment returns connection uses section-assets)
    const sources = page.locator('[data-testid="explainer-sources"]');
    const text = await sources.textContent();
    expect(text).toContain("returns");
  });
});
