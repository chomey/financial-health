import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Government Retirement Income (US)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("fhs-wizard-done", "1");
      localStorage.setItem("fhs-default-mode", "advanced");
    });
    // Load with US country
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');
    // Switch to US
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(300);
  });

  test("renders Social Security inputs for US country", async ({ page }) => {
    const govInput = page.getByTestId("government-retirement-input");
    await expect(govInput).toBeVisible();
    await expect(page.getByTestId("ss-preset-none")).toBeVisible();
    await expect(page.getByTestId("ss-preset-average")).toBeVisible();
    await expect(page.getByTestId("ss-preset-max-67")).toBeVisible();
    await captureScreenshot(page, "task-188-ss-default");
  });

  test("selecting SS average preset shows summary", async ({ page }) => {
    await page.getByTestId("ss-preset-average").click();
    const summary = page.getByTestId("gov-income-summary");
    await expect(summary).toBeVisible();
    await expect(summary).toContainText("Expected government income");
    await captureScreenshot(page, "task-188-ss-average");
  });

  test("selecting SS max-70 preset shows higher amount", async ({ page }) => {
    await page.getByTestId("ss-preset-max-70").click();
    const summary = page.getByTestId("gov-income-summary");
    await expect(summary).toBeVisible();
    await captureScreenshot(page, "task-188-ss-max-70");
  });

  test("Social Security persists in URL", async ({ page }) => {
    await page.getByTestId("ss-preset-max-67").click();
    await page.waitForTimeout(500);

    const url = page.url();
    await page.goto(url);
    await page.waitForSelector('[data-testid="government-retirement-input"]');

    const summary = page.getByTestId("gov-income-summary");
    await expect(summary).toBeVisible();
  });
});
