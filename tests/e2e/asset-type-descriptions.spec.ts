import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Asset account type descriptions", () => {
  test("shows description in dropdown when typing a known category", async ({ page }) => {
    await page.goto("/?step=assets");

    // Open add asset form
    await page.getByText("+ Add Asset").click();
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();
    await categoryInput.fill("TFSA");

    // Description should appear in the dropdown
    await expect(page.getByText("Tax-free growth and withdrawals, $7,000/yr contribution room").first()).toBeVisible();

    await captureScreenshot(page, "task-174-tfsa-description-dropdown");
  });

  test("shows US account descriptions in dropdown", async ({ page }) => {
    await page.goto("/?step=assets");

    await page.getByText("+ Add Asset").click();
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();
    await categoryInput.fill("Roth");

    // Roth IRA description should appear
    await expect(page.getByText(/income limits apply/).first()).toBeVisible();

    await captureScreenshot(page, "task-174-roth-ira-description-dropdown");
  });

  test("shows description below category name in view mode for TFSA", async ({ page }) => {
    await page.goto("/?step=assets");

    // TFSA is in the mock data — check its description is shown in view mode
    await expect(page.getByText("Tax-free growth and withdrawals, $7,000/yr contribution room").first()).toBeVisible();

    await captureScreenshot(page, "task-174-tfsa-description-view-mode");
  });

  test("shows AU account description in dropdown", async ({ page }) => {
    await page.goto("/?step=assets");

    await page.getByText("+ Add Asset").click();
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();
    await categoryInput.fill("Super");

    // Super (Accumulation) description
    await expect(page.getByText(/salary sacrifice/).first()).toBeVisible();

    await captureScreenshot(page, "task-174-super-description-dropdown");
  });
});
