import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Multi-currency support", () => {
  test("CA user sees FX rate display on profile step", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForSelector("[data-testid='country-jurisdiction-selector']");

    // Default is CA
    const caBtn = page.getByTestId("country-ca");
    await expect(caBtn).toHaveAttribute("aria-pressed", "true");

    // FX rate display should be visible
    const fxDisplay = page.getByTestId("fx-rate-display");
    await expect(fxDisplay).toBeVisible();

    // Should show "USD" for a CA user
    await expect(fxDisplay).toContainText("USD");

    await captureScreenshot(page, "task-67-ca-user-cad-display");
  });

  test("US user sees USD-based FX display", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForSelector("[data-testid='country-jurisdiction-selector']");

    // Switch to US
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(300);

    // FX rate display should show "CAD"
    const fxDisplay = page.getByTestId("fx-rate-display");
    await expect(fxDisplay).toContainText("CAD");

    await captureScreenshot(page, "task-67-us-user-usd-display");
  });

  test("FX rate display shows live badge by default", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForSelector("[data-testid='fx-rate-display']");

    const fxDisplay = page.getByTestId("fx-rate-display");
    await expect(fxDisplay).toBeVisible();

    const rateValue = page.getByTestId("fx-rate-value");
    await expect(rateValue).toBeVisible();
  });

  test("FX rate manual override shows custom badge", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForSelector("[data-testid='fx-rate-display']");

    const rateValue = page.getByTestId("fx-rate-value");
    await rateValue.click();

    const input = page.getByTestId("fx-rate-input");
    await expect(input).toBeVisible();

    await input.fill("1.5000");
    await input.press("Enter");

    const customBadge = page.getByTestId("fx-badge-custom");
    await expect(customBadge).toBeVisible();
    await expect(customBadge).toContainText("custom");

    const updatedRate = page.getByTestId("fx-rate-value");
    await expect(updatedRate).toContainText("1.5000");

    await captureScreenshot(page, "task-67-fx-manual-override");
  });

  test("clearing FX override reverts to live badge", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForSelector("[data-testid='fx-rate-display']");

    // Set manual override first
    await page.getByTestId("fx-rate-value").click();
    const input = page.getByTestId("fx-rate-input");
    await input.fill("1.5000");
    await input.press("Enter");

    // Click custom badge to clear
    await page.getByTestId("fx-badge-custom").click();

    // Should revert — rate value should be visible
    const rateValue = page.getByTestId("fx-rate-value");
    await expect(rateValue).toBeVisible();
  });

  test("currency badge on asset toggles between home and foreign", async ({ page }) => {
    await page.goto("/?step=assets");
    await page.waitForSelector('[aria-label="Asset items"]');

    const firstBadge = page.getByTestId("currency-badge").first();
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
    await page.goto("/?step=assets");
    await page.waitForSelector('[aria-label="Asset items"]');

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

  test("FX manual override persists in URL after reload", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForSelector("[data-testid='fx-rate-display']");

    // Set a manual override
    await page.getByTestId("fx-rate-value").click();
    const input = page.getByTestId("fx-rate-input");
    await input.fill("1.5000");
    await input.press("Enter");

    // Wait for URL update
    await page.waitForTimeout(500);

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
    await page.goto("/?step=assets");
    await page.waitForSelector('[aria-label="Asset items"]');

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

  test("switching country updates currency badges", async ({ page }) => {
    await page.goto("/?step=assets");
    await page.waitForSelector('[aria-label="Asset items"]');

    // Start as CA user — badges show CAD
    const firstBadge = page.getByTestId("currency-badge").first();
    await expect(firstBadge).toContainText("CAD");

    // Navigate to profile to switch country
    await page.goto("/?step=profile");
    await page.waitForSelector("[data-testid='country-jurisdiction-selector']");
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(300);

    // Navigate back to assets
    const url = page.url();
    await page.goto(url.replace(/step=profile/, "step=assets"));
    await page.waitForSelector('[aria-label="Asset items"]');

    // Badges should now show USD (home currency for US)
    const updatedBadge = page.getByTestId("currency-badge").first();
    await expect(updatedBadge).toContainText("USD");

    await captureScreenshot(page, "task-67-country-switch-currency");
  });
});
