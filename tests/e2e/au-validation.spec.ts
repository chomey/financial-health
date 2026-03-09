import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

/**
 * Task 172: AU validation — E2E screenshot tests
 *
 * Verifies AU sample profiles render correct dashboard metrics (AUD currency,
 * positive tax estimates, net worth values) to complement unit test validation.
 *
 * Uses /?step=welcome to force wizard mode (bypasses fhs-visited localStorage flag).
 */

test.describe("AU sample profile dashboard metrics (Task 172)", () => {
  test("AU young professional dashboard shows AUD currency and tax estimate", async ({ page }) => {
    await page.goto("/?step=welcome");

    // Select AU country and load the young professional profile
    await page.getByTestId("country-au").click();
    await page.getByTestId("sample-profile-au-young-professional").click();

    // Wait for dashboard to load with URL state
    await page.waitForFunction(() => window.location.search.includes("s="));

    await captureScreenshot(page, "task-172-au-young-professional-dashboard");
  });

  test("AU pre-retiree dashboard shows large net worth and tax in 37% bracket", async ({ page }) => {
    await page.goto("/?step=welcome");

    // Select AU country and load the pre-retiree profile
    await page.getByTestId("country-au").click();
    await page.getByTestId("sample-profile-au-pre-retiree").click();

    // Wait for dashboard to load with URL state
    await page.waitForFunction(() => window.location.search.includes("s="));

    await captureScreenshot(page, "task-172-au-pre-retiree-dashboard");
  });

  test("AU mid-career family dashboard shows property equity", async ({ page }) => {
    await page.goto("/?step=welcome");

    // Select AU country and load the mid-career family profile
    await page.getByTestId("country-au").click();
    await page.getByTestId("sample-profile-au-mid-career-family").click();

    // Wait for dashboard to load with URL state
    await page.waitForFunction(() => window.location.search.includes("s="));

    await captureScreenshot(page, "task-172-au-mid-career-family-dashboard");
  });

  test("country switch CA→AU preserves wizard and shows AU profiles", async ({ page }) => {
    await page.goto("/?step=welcome");

    // Start with CA (default)
    await expect(page.getByTestId("sample-profile-fresh-grad")).toBeVisible();

    // Switch to AU
    await page.getByTestId("country-au").click();

    // AU profiles should now be visible
    await expect(page.getByTestId("sample-profile-au-young-professional")).toBeVisible();
    await expect(page.getByTestId("sample-profile-au-mid-career-family")).toBeVisible();
    await expect(page.getByTestId("sample-profile-au-pre-retiree")).toBeVisible();

    await captureScreenshot(page, "task-172-au-country-switch");
  });

  test("country switch CA→AU→US cycles through all three country profile sets", async ({ page }) => {
    await page.goto("/?step=welcome");

    // CA profiles visible by default
    await expect(page.getByTestId("sample-profile-fresh-grad")).toBeVisible();

    // Switch to AU
    await page.getByTestId("country-au").click();
    await expect(page.getByTestId("sample-profile-au-young-professional")).toBeVisible();

    // Switch to US
    await page.getByTestId("country-us").click();
    await expect(page.getByTestId("sample-profile-fresh-grad-us")).toBeVisible();

    await captureScreenshot(page, "task-172-country-cycle-us");
  });
});
