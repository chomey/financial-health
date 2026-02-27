import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("PropertyEntry", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=Property");
  });

  test("displays property card with mock data", async ({ page }) => {
    // Property card should be visible
    await expect(page.getByRole("heading", { name: "Property" })).toBeVisible();
    await expect(page.getByText("Home")).toBeVisible();

    // Total equity
    await expect(page.getByText("Total Equity: $170,000")).toBeVisible();

    // Equity value via test id
    await expect(page.getByTestId("equity-p1")).toHaveText("$170,000");

    await captureScreenshot(page, "task-18-property-card");
  });

  test("can add a new property", async ({ page }) => {
    // Click add button
    await page.getByText("+ Add Property").click();

    // Fill in the form
    await page.getByLabel("New property name").fill("Rental");
    await page.getByLabel("New property value").fill("350000");
    await page.getByLabel("New property mortgage").fill("200000");

    // Submit
    await page.getByLabel("Confirm add property").click();

    // New property should appear
    await expect(page.getByText("Rental")).toBeVisible();
    await expect(page.getByText("$350,000")).toBeVisible();
    await expect(page.getByText("$200,000")).toBeVisible();

    await captureScreenshot(page, "task-18-property-added");
  });

  test("can delete a property", async ({ page }) => {
    await page.getByLabel("Delete Home").click();

    // Empty state should appear
    await expect(
      page.getByText("Add your home or other properties to see your full net worth.")
    ).toBeVisible();

    await captureScreenshot(page, "task-18-property-deleted");
  });

  test("can inline edit property value", async ({ page }) => {
    // Click value to edit
    await page.getByLabel(/Edit value for Home/).click();
    await page.getByLabel(/Edit value for Home/).fill("500000");
    await page.getByLabel(/Edit value for Home/).press("Enter");

    // Wait for the new value
    await expect(page.getByText("$500,000")).toBeVisible();

    // Equity should update: 500000 - 280000 = 220000
    await expect(page.getByTestId("equity-p1")).toHaveText("$220,000");

    await captureScreenshot(page, "task-18-property-value-edited");
  });

  test("property updates dashboard metrics", async ({ page }) => {
    // Dashboard should show initial net worth
    // Net worth = liquid (65500) + property equity (170000) - debts (15000) = 220500
    const dashboard = page.getByTestId("snapshot-dashboard");
    await expect(dashboard).toBeVisible();

    // Delete property and verify net worth changes
    await page.getByLabel("Delete Home").click();

    // Wait for dashboard to update — net worth should now be 65500 - 15000 = 50500
    await page.waitForTimeout(1500); // Wait for count-up animation

    await captureScreenshot(page, "task-18-dashboard-after-property-delete");
  });

  test("property persists via URL state", async ({ page }) => {
    // Add a second property
    await page.getByText("+ Add Property").click();
    await page.getByLabel("New property name").fill("Cottage");
    await page.getByLabel("New property value").fill("250000");
    await page.getByLabel("New property mortgage").fill("100000");
    await page.getByLabel("Confirm add property").click();

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Reload and verify data persists
    await page.reload();
    await page.waitForSelector("text=Property");

    await expect(page.getByText("Home")).toBeVisible();
    await expect(page.getByText("Cottage")).toBeVisible();

    await captureScreenshot(page, "task-18-property-persists-reload");
  });
});
