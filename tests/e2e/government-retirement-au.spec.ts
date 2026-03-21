import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Government Retirement Income (AU)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("fhs-wizard-done", "1");
      localStorage.setItem("fhs-default-mode", "advanced");
    });
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');
    // Switch to AU
    await page.getByTestId("country-au").click();
    await page.waitForTimeout(300);
  });

  test("renders Age Pension inputs for AU country", async ({ page }) => {
    const govInput = page.getByTestId("government-retirement-input");
    await expect(govInput).toBeVisible();
    await expect(page.getByTestId("ap-preset-none")).toBeVisible();
    await expect(page.getByTestId("ap-preset-full-single")).toBeVisible();
    await expect(page.getByTestId("ap-preset-full-couple")).toBeVisible();
    await captureScreenshot(page, "task-189-au-pension-default");
  });

  test("selecting full single pension shows summary", async ({ page }) => {
    await page.getByTestId("ap-preset-full-single").click();
    const summary = page.getByTestId("gov-income-summary");
    await expect(summary).toBeVisible();
    await expect(summary).toContainText("Expected government income");
    await expect(summary).toContainText("fortnightly");
    await captureScreenshot(page, "task-189-au-pension-single");
  });

  test("Age Pension persists in URL", async ({ page }) => {
    await page.getByTestId("ap-preset-full-single").click();
    await page.waitForTimeout(500);

    const url = page.url();
    await page.goto(url);
    await page.waitForSelector('[data-testid="government-retirement-input"]');

    const summary = page.getByTestId("gov-income-summary");
    await expect(summary).toBeVisible();
  });
});
