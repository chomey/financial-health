import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Property Appreciation/Depreciation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=Property");
  });

  async function addProperty(page: import("@playwright/test").Page, name: string, value: string, mortgage: string) {
    await page.getByText("+ Add Property").click();
    await page.getByLabel("New property name").fill(name);
    await page.getByLabel("New property value").fill(value);
    await page.getByLabel("New property mortgage").fill(mortgage);
    await page.getByLabel("Confirm add property").click();
    await expect(page.getByRole("button", { name: new RegExp(`Edit name for ${name}`) })).toBeVisible();
  }

  test("shows default appreciation badge for Home", async ({ page }) => {
    // Add a home property
    await addProperty(page, "Home", "450000", "280000");

    // The "Home" property should get auto-suggested +3%/yr appreciation
    const appreciationEdit = page.locator("[data-testid^='appreciation-edit-']").first();
    await expect(appreciationEdit).toBeVisible();
    await expect(appreciationEdit).toContainText("+3%/yr");

    // Property name should show house icon
    const nameButton = page.getByRole("button", { name: /Edit name for Home/i });
    await expect(nameButton).toContainText("🏠");

    await captureScreenshot(page, "task-47-appreciation-default");
  });

  test("can edit appreciation rate", async ({ page }) => {
    await addProperty(page, "Home", "450000", "280000");

    // Click the appreciation badge to edit
    const appreciationEdit = page.locator("[data-testid^='appreciation-edit-']").first();
    await appreciationEdit.click();

    // Type a new value
    const input = page.getByLabel(/Edit appreciation rate for Home/i);
    await expect(input).toBeVisible();
    await input.fill("5");
    await input.press("Enter");

    // Should now show the explicit value
    await expect(page.locator("[data-testid^='appreciation-edit-']").first()).toContainText("+5%/yr");
    // Badge in name should also update
    await expect(page.locator("[data-testid^='appreciation-badge-']").first()).toContainText("+5%/yr");

    await captureScreenshot(page, "task-47-appreciation-edited");
  });

  test("adding a vehicle shows negative depreciation and car icon", async ({ page }) => {
    // Add a car property
    await addProperty(page, "Car", "30000", "0");

    // The car should have a car icon
    const carNameButton = page.getByRole("button", { name: /Edit name for Car/i });
    await expect(carNameButton).toContainText("🚗");

    // Should show -15%/yr badge (auto-populated for "Car")
    const carBadge = page.locator("[data-testid^='appreciation-badge-']").first();
    await expect(carBadge).toContainText("-15%/yr");

    await captureScreenshot(page, "task-47-appreciation-vehicle");
  });

  test("adding property with default appreciation sets it in URL", async ({ page }) => {
    // Add a home, which auto-sets appreciation=3
    await addProperty(page, "Home", "500000", "300000");

    // Wait for URL to update
    await page.waitForFunction(() => window.location.search.includes("s="));

    // Reload the page to verify URL state persistence
    const url = page.url();
    await page.goto(url);
    await page.waitForSelector("text=Property");

    // The "Home" property should still have its appreciation badge
    await expect(page.locator("[data-testid^='appreciation-badge-']").first()).toContainText("+3%/yr");
    await expect(page.locator("[data-testid^='appreciation-edit-']").first()).toContainText("+3%/yr");

    await captureScreenshot(page, "task-47-appreciation-persisted");
  });
});
