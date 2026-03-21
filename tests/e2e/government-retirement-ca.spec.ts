import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Government Retirement Income (CA)", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("fhs-wizard-done", "1");
      localStorage.setItem("fhs-default-mode", "advanced");
    });
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');
  });

  test("renders CPP and OAS inputs for CA country", async ({ page }) => {
    const govInput = page.getByTestId("government-retirement-input");
    await expect(govInput).toBeVisible();
    await expect(page.getByTestId("cpp-preset-none")).toBeVisible();
    await expect(page.getByTestId("oas-preset-none")).toBeVisible();
    await captureScreenshot(page, "task-187-gov-income-default");
  });

  test("selecting CPP average preset shows summary", async ({ page }) => {
    await page.getByTestId("cpp-preset-average").click();
    const summary = page.getByTestId("gov-income-summary");
    await expect(summary).toBeVisible();
    await expect(summary).toContainText("Expected government income");
    await captureScreenshot(page, "task-187-cpp-average");
  });

  test("selecting both CPP and OAS shows combined total", async ({ page }) => {
    await page.getByTestId("cpp-preset-average").click();
    await page.getByTestId("oas-preset-full").click();
    const summary = page.getByTestId("gov-income-summary");
    await expect(summary).toContainText("CPP");
    await expect(summary).toContainText("OAS");
    await captureScreenshot(page, "task-187-cpp-oas-combined");
  });

  test("government income persists in URL", async ({ page }) => {
    await page.getByTestId("cpp-preset-max").click();
    await page.getByTestId("oas-preset-full").click();
    await page.waitForTimeout(500);

    const url = page.url();
    await page.goto(url);
    await page.waitForSelector('[data-testid="government-retirement-input"]');

    // Summary should still be visible after reload
    const summary = page.getByTestId("gov-income-summary");
    await expect(summary).toBeVisible();
    await expect(summary).toContainText("Expected government income");
  });
});
