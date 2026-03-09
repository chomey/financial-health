import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Smoke test", () => {
  test("homepage loads with app title and dashboard", async ({ page }) => {
    await page.goto("/?step=dashboard");

    // Verify the page has the app title (h1 with "Financial Health" visible on desktop)
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("h1")).toContainText("Financial Health");

    // Verify the dashboard description is present
    await expect(page.getByText("Your financial snapshot at a glance")).toBeVisible();

    // Verify dashboard metrics panel is present
    await expect(page.getByTestId("snapshot-dashboard")).toBeVisible();

    // Capture screenshot
    await captureScreenshot(page, "task-2-home-loaded");
  });
});
