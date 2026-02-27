import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Smoke test", () => {
  test("homepage loads with app title and tagline", async ({ page }) => {
    await page.goto("/");

    // Verify the page has the app title
    const title = page.getByRole("heading", {
      name: "Financial Health Snapshot",
    });
    await expect(title).toBeVisible();

    // Verify the tagline is present
    const tagline = page.getByText(
      "Your finances at a glance — no judgment, just clarity"
    );
    await expect(tagline).toBeVisible();

    // Verify both panels are present
    await expect(
      page.getByRole("region", { name: "Financial data entry" })
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Financial dashboard" })
    ).toBeVisible();

    // Capture screenshot
    await captureScreenshot(page, "task-2-home-loaded");
  });
});
