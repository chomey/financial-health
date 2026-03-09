import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

/** Navigate to "/" and get to the profile step with AU selected */
async function gotoAUProfileStep(page: import("@playwright/test").Page) {
  await page.goto("/");
  await page.waitForSelector("[data-testid='country-jurisdiction-selector']");
  await page.getByTestId("country-au").click();
  await page.waitForTimeout(200);
  await page.getByTestId("wizard-step-profile").click();
  await page.waitForTimeout(300);
}

test.describe("AU currency formatting", () => {
  test("AU user sees USD/AUD in FX rate display on profile step", async ({ page }) => {
    await gotoAUProfileStep(page);

    const fxDisplay = page.getByTestId("fx-rate-display");
    await expect(fxDisplay).toBeVisible();
    // AU home = AUD, foreign = USD → "1 USD = X AUD"
    await expect(fxDisplay).toContainText("USD");
    await expect(fxDisplay).toContainText("AUD");

    await captureScreenshot(page, "task-167-au-fx-display");
  });

  test("AU FX rate value button is clickable on profile step", async ({ page }) => {
    await gotoAUProfileStep(page);

    const rateValue = page.getByTestId("fx-rate-value");
    await expect(rateValue).toBeVisible();

    await captureScreenshot(page, "task-167-au-fx-rate-value");
  });

  test("AU FX rate manual override shows custom badge", async ({ page }) => {
    await gotoAUProfileStep(page);

    const rateValue = page.getByTestId("fx-rate-value");
    await rateValue.click();

    const input = page.getByTestId("fx-rate-input");
    await expect(input).toBeVisible();
    await input.fill("1.5900");
    await input.press("Enter");

    const customBadge = page.getByTestId("fx-badge-custom");
    await expect(customBadge).toBeVisible();
    await expect(customBadge).toContainText("custom");

    const updatedRate = page.getByTestId("fx-rate-value");
    await expect(updatedRate).toContainText("1.5900");

    await captureScreenshot(page, "task-167-au-fx-manual-override");
  });

  test("switching CA to AU updates FX display currencies", async ({ page }) => {
    // Start on CA profile step
    await page.goto("/");
    await page.waitForSelector("[data-testid='country-jurisdiction-selector']");
    await page.getByTestId("wizard-step-profile").click();
    await page.waitForTimeout(300);

    const fxDisplay = page.getByTestId("fx-rate-display");
    // CA: foreign = USD, home = CAD
    await expect(fxDisplay).toContainText("USD");
    await expect(fxDisplay).toContainText("CAD");

    // Switch to AU
    await page.getByTestId("country-au").click();
    await page.waitForTimeout(300);

    // AU: foreign = USD, home = AUD
    await expect(fxDisplay).toContainText("USD");
    await expect(fxDisplay).toContainText("AUD");

    await captureScreenshot(page, "task-167-ca-to-au-fx-switch");
  });

  test("AU currency badge shows AUD on assets step", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='country-jurisdiction-selector']");
    await page.getByTestId("country-au").click();
    await page.waitForTimeout(200);
    // Navigate to assets step — INITIAL_STATE has default CA assets
    await page.getByTestId("wizard-step-assets").click();
    await page.waitForTimeout(300);

    const firstBadge = page.getByTestId("currency-badge").first();
    await expect(firstBadge).toBeVisible();
    await expect(firstBadge).toContainText("AUD");

    await captureScreenshot(page, "task-167-au-currency-badge-assets");
  });
});
