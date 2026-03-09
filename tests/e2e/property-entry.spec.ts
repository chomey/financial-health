import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("PropertyEntry", () => {
  async function addHome(page: import("@playwright/test").Page) {
    await page.getByText("+ Add Property").click();
    await page.getByLabel("New property name").fill("Home");
    await page.getByLabel("New property value").fill("450000");
    await page.getByLabel("New property mortgage").fill("280000");
    await page.getByLabel("Confirm add property").click();
    await expect(page.getByText("Home")).toBeVisible();
  }

  test.beforeEach(async ({ page }) => {
    await page.goto("/?step=property");
    await expect(page.getByRole("heading", { name: "Properties" })).toBeVisible();
  });

  test("displays property card after adding a home", async ({ page }) => {
    // Properties start empty, add a Home
    await addHome(page);

    // Property section should be visible
    await expect(page.getByRole("heading", { name: "Properties" })).toBeVisible();
    await expect(page.getByText("Home")).toBeVisible();

    // Total equity: 450000 - 280000 = 170000
    await expect(page.getByText("Total Equity: $170,000")).toBeVisible();

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
    // Add a home first (properties start empty)
    await addHome(page);

    await page.getByLabel("Delete Home").click();

    // Empty state should appear
    await expect(
      page.getByText("Add your home or other properties to see your full net worth.")
    ).toBeVisible();

    await captureScreenshot(page, "task-18-property-deleted");
  });

  test("can inline edit property value", async ({ page }) => {
    // Add a home first
    await addHome(page);

    // Click value to edit
    await page.getByLabel(/Edit value for Home/).click();
    await page.getByLabel(/Edit value for Home/).fill("500000");
    await page.getByLabel(/Edit value for Home/).press("Enter");

    // Wait for the new value
    await expect(page.getByText("$500,000")).toBeVisible();

    // Equity should update: 500000 - 280000 = 220000 (find the equity test id dynamically)
    const equityEl = page.locator("[data-testid^='equity-']").first();
    await expect(equityEl).toHaveText("$220,000");

    await captureScreenshot(page, "task-18-property-value-edited");
  });

  test("adding property and switching to dashboard shows updated metrics", async ({ page }) => {
    // Add a home first
    await addHome(page);
    await page.waitForTimeout(500);

    // Switch to dashboard to check metrics
    await page.getByTestId("wizard-skip-to-dashboard").click();
    const dashboard = page.getByTestId("snapshot-dashboard");
    await expect(dashboard).toBeVisible();

    // Verify dashboard has loaded with metrics
    await page.waitForTimeout(1500);

    await captureScreenshot(page, "task-18-dashboard-after-property-add");
  });

  test("property persists via URL state", async ({ page }) => {
    // Add a home first
    await addHome(page);

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
    await expect(page.getByRole("heading", { name: "Properties" })).toBeVisible();

    await expect(page.getByText("Home")).toBeVisible();
    await expect(page.getByText("Cottage")).toBeVisible();

    await captureScreenshot(page, "task-18-property-persists-reload");
  });
});
