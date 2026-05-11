/**
 * Task 215: australianInsights provider — T2 Playwright verification
 *
 * Verifies that the AU profile flow renders the insights panel correctly
 * without errors. The australianInsights provider logic is verified
 * comprehensively in tests/unit/countries/australia/insights.test.ts.
 * Integration into the CountryProfile happens in task 217.
 */
import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

async function loadAUProfile(
  page: import("@playwright/test").Page,
  profileId = "au-young-professional"
) {
  await page.goto("/?step=welcome");
  await page.getByTestId("country-au").click();
  await page.getByTestId(`sample-profile-${profileId}`).click();
  await page.waitForFunction(() => window.location.search.includes("s="));
  await page.waitForSelector('[data-testid="snapshot-dashboard"]');
}

test.describe("AU insights panel — Task 215", () => {
  test("AU young professional profile: insights panel is visible and shows insights", async ({ page }) => {
    test.setTimeout(60000);
    await loadAUProfile(page, "au-young-professional");

    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible({ timeout: 10000 });

    const cards = insightsPanel.locator('[role="article"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);

    await captureScreenshot(page, "task-215-au-insights-panel-young-professional");
  });

  test("AU mid-career family profile: insights panel renders without errors", async ({ page }) => {
    test.setTimeout(60000);
    await loadAUProfile(page, "au-mid-career-family");

    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible({ timeout: 10000 });

    await captureScreenshot(page, "task-215-au-insights-panel-mid-career-family");
  });
});
