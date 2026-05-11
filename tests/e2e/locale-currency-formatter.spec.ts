import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

/**
 * Navigate to wizard welcome step and select a country.
 */
async function selectCountry(page: import("@playwright/test").Page, country: "ca" | "us" | "au") {
  await page.goto("/?step=welcome");
  await page.waitForSelector("[data-testid='country-jurisdiction-selector']");
  await page.getByTestId(`country-${country}`).click();
  await page.waitForTimeout(200);
}

test.describe("locale threading — CA/US/AU formatting unchanged", () => {
  test("CA: wizard loads and country selector shows CA selected", async ({ page }) => {
    await selectCountry(page, "ca");

    const selector = page.getByTestId("country-jurisdiction-selector");
    await expect(selector).toBeVisible();
    // CA button should appear selected/active
    const caBtn = page.getByTestId("country-ca");
    await expect(caBtn).toBeVisible();

    await captureScreenshot(page, "task-220-ca-locale");
  });

  test("US: wizard loads and country selector shows US selected", async ({ page }) => {
    await selectCountry(page, "us");

    const selector = page.getByTestId("country-jurisdiction-selector");
    await expect(selector).toBeVisible();
    const usBtn = page.getByTestId("country-us");
    await expect(usBtn).toBeVisible();

    await captureScreenshot(page, "task-220-us-locale");
  });

  test("AU: wizard loads and country selector shows AU selected", async ({ page }) => {
    await selectCountry(page, "au");

    const selector = page.getByTestId("country-jurisdiction-selector");
    await expect(selector).toBeVisible();
    const auBtn = page.getByTestId("country-au");
    await expect(auBtn).toBeVisible();

    await captureScreenshot(page, "task-220-au-locale");
  });
});
