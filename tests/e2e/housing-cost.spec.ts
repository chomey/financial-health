import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Housing cost ratio insight", () => {
  test("shows housing-cost insight in the insights panel with default state", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    // Housing cost insight should appear — default state has a Rent/Mortgage Payment expense
    const housingInsight = page.locator('[data-insight-type="housing-cost"]');
    await expect(housingInsight).toBeVisible({ timeout: 5000 });

    await captureScreenshot(page, "task-136-housing-cost-insight-default");
  });

  test("housing-cost insight message includes ratio percentage", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const housingInsight = page.locator('[data-insight-type="housing-cost"]');
    await expect(housingInsight).toBeVisible({ timeout: 5000 });

    // Message should contain a percentage
    const text = await housingInsight.textContent();
    expect(text).toMatch(/\d+\.\d+%/);
  });

  test("housing-cost insight has house icon", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const housingInsight = page.locator('[data-insight-type="housing-cost"]');
    await expect(housingInsight).toBeVisible({ timeout: 5000 });

    await expect(housingInsight).toContainText("🏠");
  });

  test("clicking housing-cost insight opens explainer modal", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const housingInsight = page.locator('[data-insight-type="housing-cost"]');
    await expect(housingInsight).toBeVisible({ timeout: 5000 });

    await housingInsight.click();

    // Explainer modal should appear
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await captureScreenshot(page, "task-136-housing-cost-explainer-modal");
  });

  test("housing-cost insight references 30% guideline", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const housingInsight = page.locator('[data-insight-type="housing-cost"]');
    await expect(housingInsight).toBeVisible({ timeout: 5000 });

    // Message should reference the 30% rule
    const text = await housingInsight.textContent();
    expect(text).toContain("30%");
  });
});
