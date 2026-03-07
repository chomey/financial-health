import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Net worth milestone and percentile insights", () => {
  async function setAge(page: import("@playwright/test").Page, age: string) {
    const addAgeBtn = page.getByTestId("add-age-button").first();
    if (await addAgeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addAgeBtn.click();
      await page.waitForTimeout(300);
    } else {
      const ageDisplay = page.getByTestId("age-display").first();
      if (await ageDisplay.isVisible({ timeout: 1000 }).catch(() => false)) {
        await ageDisplay.click();
        await page.waitForTimeout(300);
      }
    }
    const ageInput = page.getByTestId("age-input").first();
    await expect(ageInput).toBeVisible({ timeout: 3000 });
    await ageInput.fill(age);
    await ageInput.press("Enter");
    await page.waitForTimeout(500);
  }

  async function addAsset(page: import("@playwright/test").Page, name: string, amount: string) {
    await page.click('text="+ Add Asset"');
    await page.fill('[aria-label="New asset category"]', name);
    await page.fill('[aria-label="New asset amount"]', amount);
    await page.click('[aria-label="Confirm add asset"]');
    await page.waitForTimeout(500);
  }

  test("shows net-worth-milestone insight for positive net worth", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    // Add asset to get a $150k net worth → $100k milestone
    await addAsset(page, "Savings", "150000");

    const milestone = page.locator('[data-insight-type="net-worth-milestone"]');
    await expect(milestone).toBeVisible({ timeout: 5000 });
    const text = await milestone.textContent();
    expect(text).toContain("$100k");

    await captureScreenshot(page, "task-138-net-worth-milestone");
  });

  test("shows $1M milestone for millionaire net worth", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    await addAsset(page, "Portfolio", "1200000");

    const milestone = page.locator('[data-insight-type="net-worth-milestone"]');
    await expect(milestone).toBeVisible({ timeout: 5000 });
    const text = await milestone.textContent();
    expect(text).toContain("Millionaire");
  });

  test("shows net-worth-percentile insight when age is set", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    await addAsset(page, "Investments", "150000");
    await setAge(page, "30");

    const percentile = page.locator('[data-insight-type="net-worth-percentile"]');
    await expect(percentile).toBeVisible({ timeout: 5000 });
    const text = await percentile.textContent();
    // $150k is above Under 35 median of $39k
    expect(text).toContain("above the median");
    expect(text).toContain("Under 35");

    await captureScreenshot(page, "task-138-net-worth-percentile-above");
  });

  test("shows below-median percentile insight for lower net worth", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    // Set age 50, 45-54 median = $247k — don't add extra assets
    await setAge(page, "50");

    const percentile = page.locator('[data-insight-type="net-worth-percentile"]');
    await expect(percentile).toBeVisible({ timeout: 5000 });
    const text = await percentile.textContent();
    expect(text).toContain("45–54");

    await captureScreenshot(page, "task-138-net-worth-percentile-below");
  });

  test("percentile insight not shown without age", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const percentile = page.locator('[data-insight-type="net-worth-percentile"]');
    await expect(percentile).not.toBeVisible({ timeout: 2000 });
  });

  test("milestone and percentile icons are correct", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    await addAsset(page, "Savings", "50000");
    await setAge(page, "35");

    const milestone = page.locator('[data-insight-type="net-worth-milestone"]');
    await expect(milestone).toBeVisible({ timeout: 5000 });
    await expect(milestone).toContainText("🏆");

    const percentile = page.locator('[data-insight-type="net-worth-percentile"]');
    await expect(percentile).toBeVisible({ timeout: 5000 });
    await expect(percentile).toContainText("📊");
  });
});
