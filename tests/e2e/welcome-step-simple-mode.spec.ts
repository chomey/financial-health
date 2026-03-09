import { expect } from "@playwright/test";
import { test, captureScreenshot } from "./helpers";

test.describe("WelcomeStep — simple mode", () => {
  test("simple mode shows quick snapshot tagline", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    // Default is simple mode
    const tagline = page.getByTestId("welcome-tagline");
    await expect(tagline).toBeVisible();
    await expect(tagline).toContainText("Get a quick snapshot of your financial health in under 2 minutes.");

    await captureScreenshot(page, "task-183-welcome-simple-mode-tagline");
  });

  test("advanced mode shows standard tagline", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    // Switch to advanced mode via header toggle
    await page.getByTestId("mode-toggle-advanced").click();

    const tagline = page.getByTestId("welcome-tagline");
    await expect(tagline).toContainText("Choose your country and region");

    await captureScreenshot(page, "task-183-welcome-advanced-mode-tagline");
  });

  test("simple mode shows ca-renter and ca-homeowner quick-start profiles", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("sample-profile-ca-renter")).toBeVisible();
    await expect(page.getByTestId("sample-profile-ca-homeowner")).toBeVisible();

    // Advanced profiles should NOT be visible
    await expect(page.getByTestId("sample-profile-fresh-grad")).not.toBeAttached();

    await captureScreenshot(page, "task-183-welcome-simple-quick-start-profiles");
  });

  test("advanced mode shows advanced sample profiles", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    // Switch to advanced
    await page.getByTestId("mode-toggle-advanced").click();

    await expect(page.getByTestId("sample-profile-fresh-grad")).toBeVisible();
    await expect(page.getByTestId("sample-profile-mid-career")).toBeVisible();
    await expect(page.getByTestId("sample-profile-pre-retirement")).toBeVisible();

    // Quick-start profiles should NOT be visible
    await expect(page.getByTestId("sample-profile-ca-renter")).not.toBeAttached();
  });

  test("clicking ca-renter quick-start profile loads data and navigates forward", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("sample-profile-ca-renter").click();
    await page.waitForLoadState("networkidle");

    // Should navigate away from welcome step (to dashboard or next step)
    // The URL should now have state encoded
    expect(page.url()).toContain("s=");

    await captureScreenshot(page, "task-183-welcome-ca-renter-loaded");
  });

  test("clicking ca-homeowner quick-start profile loads data", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("sample-profile-ca-homeowner").click();
    await page.waitForLoadState("networkidle");

    // URL should contain state
    expect(page.url()).toContain("s=");

    await captureScreenshot(page, "task-183-welcome-ca-homeowner-loaded");
  });
});
