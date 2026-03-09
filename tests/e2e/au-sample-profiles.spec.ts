import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("AU Sample profiles (Task 165)", () => {
  test("switching to AU in wizard shows AU profile cards", async ({ page }) => {
    // Use /?step=welcome to force wizard mode (bypasses fhs-visited localStorage flag)
    await page.goto("/?step=welcome");

    // Click AU country button in wizard welcome step
    await page.getByTestId("country-au").click();

    // AU profile cards should now be visible
    await expect(page.getByTestId("sample-profile-au-young-professional")).toBeVisible();
    await expect(page.getByTestId("sample-profile-au-mid-career-family")).toBeVisible();
    await expect(page.getByTestId("sample-profile-au-pre-retiree")).toBeVisible();

    await captureScreenshot(page, "task-165-au-profiles-wizard");
  });

  test("loading AU young professional profile navigates to dashboard", async ({ page }) => {
    await page.goto("/?step=welcome");

    await page.getByTestId("country-au").click();
    await page.getByTestId("sample-profile-au-young-professional").click();

    // URL should have state and step=dashboard
    await page.waitForFunction(() => window.location.search.includes("s="));

    await captureScreenshot(page, "task-165-au-young-professional-dashboard");
  });

  test("loading AU mid-career family profile navigates to dashboard", async ({ page }) => {
    await page.goto("/?step=welcome");

    await page.getByTestId("country-au").click();
    await page.getByTestId("sample-profile-au-mid-career-family").click();

    await page.waitForFunction(() => window.location.search.includes("s="));

    await captureScreenshot(page, "task-165-au-mid-career-family-dashboard");
  });

  test("loading AU pre-retiree profile navigates to dashboard", async ({ page }) => {
    await page.goto("/?step=welcome");

    await page.getByTestId("country-au").click();
    await page.getByTestId("sample-profile-au-pre-retiree").click();

    await page.waitForFunction(() => window.location.search.includes("s="));

    await captureScreenshot(page, "task-165-au-pre-retiree-dashboard");
  });

  test("AU profiles show correct highlight text in cards", async ({ page }) => {
    await page.goto("/?step=welcome");

    await page.getByTestId("country-au").click();

    // Check young professional highlights
    const youngCard = page.getByTestId("sample-profile-au-young-professional");
    await expect(youngCard).toContainText("HECS-HELP");
    await expect(youngCard).toContainText("Super");

    // Check pre-retiree highlights
    const preRetireeCard = page.getByTestId("sample-profile-au-pre-retiree");
    await expect(preRetireeCard).toContainText("Franking");

    await captureScreenshot(page, "task-165-au-profile-cards");
  });

  test("CA profiles are shown by default, not AU", async ({ page }) => {
    await page.goto("/?step=welcome");

    // Default is CA — should see CA profile cards, not AU
    await expect(page.getByTestId("sample-profile-fresh-grad")).toBeVisible();
    await expect(page.getByTestId("sample-profile-au-young-professional")).not.toBeVisible();
  });
});
