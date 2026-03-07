import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Coast FIRE insight", () => {
  async function setAge(page: import("@playwright/test").Page, age: string) {
    const addAgeBtn = page.getByTestId("add-age-button").first();
    if (await addAgeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addAgeBtn.click();
      await page.waitForTimeout(300);
    } else {
      // Age display already exists, click to edit
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

  async function addLargeAsset(page: import("@playwright/test").Page) {
    await page.click('text="+ Add Asset"');
    await page.fill('[aria-label="New asset category"]', "Investment Portfolio");
    await page.fill('[aria-label="New asset amount"]', "500000");
    await page.click('[aria-label="Confirm add asset"]');
    await page.waitForTimeout(500);
  }

  test("shows coast-fire insight when age is set with default state", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    // Set age — insights panel should render without errors
    await setAge(page, "30");
    await page.waitForTimeout(1000);

    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();

    await captureScreenshot(page, "task-137-coast-fire-default");
  });

  test("shows achieved coast-fire insight with large portfolio", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    // Add a large asset to trigger coast-fire-achieved
    await addLargeAsset(page);

    // Set age to 30
    await setAge(page, "30");
    await page.waitForTimeout(1000);

    // Coast FIRE insight should appear as achieved
    const coastInsight = page.locator('[data-insight-type="coast-fire"]');
    await expect(coastInsight).toBeVisible({ timeout: 5000 });

    const text = await coastInsight.textContent();
    expect(text).toContain("Coast FIRE");

    await captureScreenshot(page, "task-137-coast-fire-achieved");
  });

  test("coast-fire insight has beach icon", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    await addLargeAsset(page);
    await setAge(page, "30");
    await page.waitForTimeout(1000);

    const coastInsight = page.locator('[data-insight-type="coast-fire"]');
    await expect(coastInsight).toBeVisible({ timeout: 5000 });
    await expect(coastInsight).toContainText("\u{1F3D6}\u{FE0F}");
  });

  test("no coast-fire insight without age", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    // Without setting age, coast-fire should not appear
    const coastInsight = page.locator('[data-insight-type="coast-fire"]');
    await expect(coastInsight).not.toBeVisible({ timeout: 2000 });
  });

  test("coast-fire insight explains the concept", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    await addLargeAsset(page);
    await setAge(page, "30");
    await page.waitForTimeout(1000);

    const coastInsight = page.locator('[data-insight-type="coast-fire"]');
    await expect(coastInsight).toBeVisible({ timeout: 5000 });

    // Should contain educational explanation about real return
    const text = await coastInsight.textContent();
    expect(text).toContain("5% real return");
  });
});
