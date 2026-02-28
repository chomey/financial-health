import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Country and Jurisdiction Selector", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for hydration
    await page.waitForSelector("[data-testid='country-jurisdiction-selector']");
  });

  test("selector is visible in the header", async ({ page }) => {
    const selector = page.getByTestId("country-jurisdiction-selector");
    await expect(selector).toBeVisible();
    await expect(page.getByTestId("country-ca")).toBeVisible();
    await expect(page.getByTestId("country-us")).toBeVisible();
    await expect(page.getByTestId("jurisdiction-select")).toBeVisible();
  });

  test("defaults to Canada / Ontario", async ({ page }) => {
    const caBtn = page.getByTestId("country-ca");
    await expect(caBtn).toHaveAttribute("aria-pressed", "true");

    const select = page.getByTestId("jurisdiction-select");
    await expect(select).toHaveValue("ON");
  });

  test("switching to US resets jurisdiction to CA (California)", async ({ page }) => {
    await page.getByTestId("country-us").click();

    const usBtn = page.getByTestId("country-us");
    await expect(usBtn).toHaveAttribute("aria-pressed", "true");

    const select = page.getByTestId("jurisdiction-select");
    await expect(select).toHaveValue("CA");

    // Should show US states
    const options = await select.locator("option").allTextContents();
    expect(options.some((o) => o.includes("New York"))).toBe(true);
    expect(options.some((o) => o.includes("Texas"))).toBe(true);
  });

  test("switching back to CA resets jurisdiction to ON", async ({ page }) => {
    // First switch to US
    await page.getByTestId("country-us").click();
    // Then switch back to CA
    await page.getByTestId("country-ca").click();

    const caBtn = page.getByTestId("country-ca");
    await expect(caBtn).toHaveAttribute("aria-pressed", "true");

    const select = page.getByTestId("jurisdiction-select");
    await expect(select).toHaveValue("ON");

    // Should show Canadian provinces
    const options = await select.locator("option").allTextContents();
    expect(options.some((o) => o.includes("Ontario"))).toBe(true);
    expect(options.some((o) => o.includes("British Columbia"))).toBe(true);
  });

  test("can select a different province/state", async ({ page }) => {
    const select = page.getByTestId("jurisdiction-select");
    await select.selectOption("BC");
    await expect(select).toHaveValue("BC");
  });

  test("country and jurisdiction persist in URL after reload", async ({ page }) => {
    // Switch to US / New York
    await page.getByTestId("country-us").click();
    await page.getByTestId("jurisdiction-select").selectOption("NY");

    // Wait for URL update
    await page.waitForTimeout(500);

    // Reload
    await page.reload();
    await page.waitForSelector("[data-testid='country-jurisdiction-selector']");

    const usBtn = page.getByTestId("country-us");
    await expect(usBtn).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("jurisdiction-select")).toHaveValue("NY");

    await captureScreenshot(page, "task-42-country-jurisdiction-selector");
  });
});
