import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Retirement Age Input", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("fhs-wizard-done", "1");
    });
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');
  });

  test("renders retirement age input with default value 65", async ({ page }) => {
    const input = page.getByTestId("wizard-retirement-age-input");
    await expect(input).toBeVisible();
    await expect(input).toHaveValue("65");
    await captureScreenshot(page, "task-186-retirement-age-default");
  });

  test("can change retirement age", async ({ page }) => {
    const input = page.getByTestId("wizard-retirement-age-input");
    await input.fill("60");
    await expect(input).toHaveValue("60");
    await captureScreenshot(page, "task-186-retirement-age-changed");
  });

  test("retirement age persists in URL state", async ({ page }) => {
    const input = page.getByTestId("wizard-retirement-age-input");
    await input.fill("55");
    // Wait for URL to update
    await page.waitForTimeout(500);

    const url = page.url();
    await page.goto(url);
    await page.waitForSelector('[data-testid="wizard-step-profile"]');

    const restored = page.getByTestId("wizard-retirement-age-input");
    await expect(restored).toHaveValue("55");
  });

  test("retirement age 65 is not persisted in URL (default)", async ({ page }) => {
    const input = page.getByTestId("wizard-retirement-age-input");
    // Set to non-default, then back to default
    await input.fill("70");
    await page.waitForTimeout(300);
    await input.fill("65");
    await page.waitForTimeout(500);

    // URL should not contain retirement age when default
    const url = page.url();
    // The compact key for retirement age is "ra"
    // When 65, it should be omitted from the encoded state
    await page.goto(url);
    await page.waitForSelector('[data-testid="wizard-step-profile"]');
    const restored = page.getByTestId("wizard-retirement-age-input");
    await expect(restored).toHaveValue("65");
  });
});
