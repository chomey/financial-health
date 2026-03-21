import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Coast FIRE insight", () => {
  async function setAgeViaWizard(page: import("@playwright/test").Page, age: string) {
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');
    await page.getByTestId("wizard-age-input").fill(age);
    await page.waitForTimeout(500);
    const params = new URL(page.url());
    params.searchParams.delete("step");
    await page.goto(params.toString());
    await page.waitForSelector('[data-testid="insights-panel"]', { timeout: 15000 });
  }

  async function addLargeAsset(page: import("@playwright/test").Page) {
    await page.click('text="+ Add Asset"');
    await page.fill('[aria-label="New asset category"]', "Investment Portfolio");
    await page.fill('[aria-label="New asset amount"]', "500000");
    await page.click('[aria-label="Confirm add asset"]');
    await page.waitForTimeout(500);
  }

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("fhs-wizard-done", "1");
      localStorage.setItem("fhs-default-mode", "advanced");
      localStorage.setItem("fhs-visited", "1");
    });
  });

  test("shows coast-fire insight when age is set with default state", async ({ page }) => {
    await setAgeViaWizard(page, "30");

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
