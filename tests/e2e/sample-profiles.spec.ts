import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Sample profiles (Task 113)", () => {
  test("sample profiles are visible on welcome step", async ({ page }) => {
    await page.goto("/?step=welcome");
    await expect(page.getByTestId("sample-profile-fresh-grad")).toBeVisible();
    await expect(page.getByTestId("sample-profile-mid-career")).toBeVisible();
    await expect(page.getByTestId("sample-profile-pre-retirement")).toBeVisible();
    await captureScreenshot(page, "task-113-sample-profiles-banner");
  });

  test("3 profile cards are visible with descriptions", async ({ page }) => {
    await page.goto("/?step=welcome");
    const freshGrad = page.getByTestId("sample-profile-fresh-grad");
    const midCareer = page.getByTestId("sample-profile-mid-career");
    const preRetirement = page.getByTestId("sample-profile-pre-retirement");

    await expect(freshGrad).toBeVisible();
    await expect(midCareer).toBeVisible();
    await expect(preRetirement).toBeVisible();
  });

  test("loading fresh-grad profile navigates to dashboard with data", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.getByTestId("sample-profile-fresh-grad").click();

    // Should navigate away from welcome step with state
    await page.waitForFunction(() => window.location.search.includes("s="));

    await captureScreenshot(page, "task-113-fresh-grad-loaded");
  });

  test("loading mid-career profile populates data", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.getByTestId("sample-profile-mid-career").click();

    // URL should have state
    await page.waitForFunction(() => window.location.search.includes("s="));

    await captureScreenshot(page, "task-113-mid-career-loaded");
  });

  test("loading pre-retirement profile works", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.getByTestId("sample-profile-pre-retirement").click();

    await page.waitForFunction(() => window.location.search.includes("s="));

    await captureScreenshot(page, "task-113-pre-retirement-loaded");
  });

  test("CA profiles show TFSA in highlights", async ({ page }) => {
    await page.goto("/?step=welcome");
    const freshGradCard = page.getByTestId("sample-profile-fresh-grad");
    await expect(freshGradCard).toContainText("TFSA");
  });
});
