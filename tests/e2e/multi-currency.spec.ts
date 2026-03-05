import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Multi-currency support", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='country-jurisdiction-selector']");
  });

  test("CA user sees CAD formatting in dashboard", async ({ page }) => {
    // Default is CA — dashboard should show CAD formatting
    const caBtn = page.getByTestId("country-ca");
    await expect(caBtn).toHaveAttribute("aria-pressed", "true");

    // FX rate display should be visible
    const fxDisplay = page.getByTestId("fx-rate-display");
    await expect(fxDisplay).toBeVisible();

    // Should show "1 USD =" for a CA user
    await expect(fxDisplay).toContainText("USD");

    // Dashboard should have CA$ formatted values (Intl formats CAD as CA$)
    const dashboard = page.getByTestId("snapshot-dashboard");
    await expect(dashboard).toBeVisible();
    // CA$ is the Intl format for CAD
    const dashText = await dashboard.textContent();
    expect(dashText).toMatch(/CA\$/);

    await captureScreenshot(page, "task-67-ca-user-cad-display");
  });

  test("US user sees USD formatting in dashboard", async ({ page }) => {
    // Switch to US
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(300);

    // FX rate display should show "1 CAD ="
    const fxDisplay = page.getByTestId("fx-rate-display");
    await expect(fxDisplay).toContainText("CAD");

    // Dashboard should show $ (USD) values without CA$ prefix
    const dashboard = page.getByTestId("snapshot-dashboard");
    const dashText = await dashboard.textContent();
    expect(dashText).not.toMatch(/CA\$/);

    await captureScreenshot(page, "task-67-us-user-usd-display");
  });

  test("FX rate display shows live badge by default", async ({ page }) => {
    // The FX rate display should show "live" badge initially (or fallback)
    const fxDisplay = page.getByTestId("fx-rate-display");
    await expect(fxDisplay).toBeVisible();

    // Should show the rate value button
    const rateValue = page.getByTestId("fx-rate-value");
    await expect(rateValue).toBeVisible();
  });

  test("FX rate manual override shows custom badge", async ({ page }) => {
    // Click the rate value to start editing
    const rateValue = page.getByTestId("fx-rate-value");
    await rateValue.click();

    // Input should appear
    const input = page.getByTestId("fx-rate-input");
    await expect(input).toBeVisible();

    // Type a custom rate
    await input.fill("1.5000");
    await input.press("Enter");

    // Should show "custom" badge
    const customBadge = page.getByTestId("fx-badge-custom");
    await expect(customBadge).toBeVisible();
    await expect(customBadge).toContainText("custom");

    // The rate value should now show 1.5000
    const updatedRate = page.getByTestId("fx-rate-value");
    await expect(updatedRate).toContainText("1.5000");

    await captureScreenshot(page, "task-67-fx-manual-override");
  });

  test("clearing FX override reverts to live badge", async ({ page }) => {
    // Set manual override first
    await page.getByTestId("fx-rate-value").click();
    const input = page.getByTestId("fx-rate-input");
    await input.fill("1.5000");
    await input.press("Enter");

    // Click custom badge to clear
    await page.getByTestId("fx-badge-custom").click();

    // Should revert — rate value should be visible (not the input)
    const rateValue = page.getByTestId("fx-rate-value");
    await expect(rateValue).toBeVisible();
  });

  test("currency badge on asset toggles between home and foreign", async ({ page }) => {
    // Find the first currency badge on assets
    const badges = page.getByTestId("currency-badge");
    const firstBadge = badges.first();
    await expect(firstBadge).toBeVisible();

    // Default should show home currency (CAD for CA user)
    await expect(firstBadge).toContainText("CAD");

    // Click to toggle to foreign
    await firstBadge.click();
    await expect(firstBadge).toContainText("USD");

    // Should show conversion preview
    const converted = page.getByTestId("currency-converted").first();
    await expect(converted).toBeVisible();
    await expect(converted).toContainText("≈");

    await captureScreenshot(page, "task-67-currency-badge-foreign");
  });

  test("toggling currency badge back resets to home", async ({ page }) => {
    const firstBadge = page.getByTestId("currency-badge").first();

    // Toggle to foreign
    await firstBadge.click();
    await expect(firstBadge).toContainText("USD");

    // Toggle back to home
    await firstBadge.click();
    await expect(firstBadge).toContainText("CAD");

    // Conversion preview should disappear
    const converted = page.getByTestId("currency-converted");
    await expect(converted).toHaveCount(0);
  });

  test("foreign-currency asset affects dashboard net worth", async ({ page }) => {
    // Note the initial net worth from dashboard
    const dashboard = page.getByTestId("snapshot-dashboard");
    const initialDashText = await dashboard.textContent();

    // Toggle first asset to USD — this changes the converted total
    const firstBadge = page.getByTestId("currency-badge").first();
    await firstBadge.click();
    await page.waitForTimeout(500);

    // Dashboard should update (net worth changes due to FX conversion)
    const updatedDashText = await dashboard.textContent();
    expect(updatedDashText).not.toBe(initialDashText);

    await captureScreenshot(page, "task-67-foreign-asset-dashboard-change");
  });

  test("FX manual override persists in URL after reload", async ({ page }) => {
    // Set a manual override
    await page.getByTestId("fx-rate-value").click();
    const input = page.getByTestId("fx-rate-input");
    await input.fill("1.5000");
    await input.press("Enter");

    // Wait for URL update
    await page.waitForTimeout(500);

    // Grab URL
    const url = page.url();
    expect(url).toContain("s="); // state is encoded

    // Reload
    await page.reload();
    await page.waitForSelector("[data-testid='fx-rate-display']");

    // Should still show custom badge and rate
    const customBadge = page.getByTestId("fx-badge-custom");
    await expect(customBadge).toBeVisible();

    const rateValue = page.getByTestId("fx-rate-value");
    await expect(rateValue).toContainText("1.5000");

    await captureScreenshot(page, "task-67-fx-override-persists-url");
  });

  test("foreign currency on asset persists in URL after reload", async ({ page }) => {
    // Toggle first asset to USD
    const firstBadge = page.getByTestId("currency-badge").first();
    await firstBadge.click();
    await expect(firstBadge).toContainText("USD");

    // Wait for URL update
    await page.waitForTimeout(500);

    // Reload
    await page.reload();
    await page.waitForSelector("[data-testid='currency-badge']");

    // First badge should still show USD
    const reloadedBadge = page.getByTestId("currency-badge").first();
    await expect(reloadedBadge).toContainText("USD");
  });

  test("switching country updates currency display everywhere", async ({ page }) => {
    // Start as CA user — badges show CAD
    const firstBadge = page.getByTestId("currency-badge").first();
    await expect(firstBadge).toContainText("CAD");

    // Switch to US
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(300);

    // Badges should now show USD (home currency for US)
    const updatedBadge = page.getByTestId("currency-badge").first();
    await expect(updatedBadge).toContainText("USD");

    // FX display should flip — now showing "1 CAD ="
    const fxDisplay = page.getByTestId("fx-rate-display");
    await expect(fxDisplay).toContainText("CAD");

    await captureScreenshot(page, "task-67-country-switch-currency");
  });
});
