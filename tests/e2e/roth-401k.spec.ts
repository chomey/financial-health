import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Roth 401k category", () => {
  test("Roth 401k appears in category suggestions when adding an asset", async ({ page }) => {
    await page.goto("/?step=assets");

    // Open add asset form
    await page.getByText("+ Add Asset").click();

    // Type "Roth 4" to filter suggestions
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.fill("Roth 4");

    // Should see Roth 401k in suggestions
    await expect(page.getByRole("button", { name: /Roth 401k/ })).toBeVisible();

    await captureScreenshot(page, "task-93-roth-401k-suggestion");
  });

  test("can add a Roth 401k asset and it shows US flag", async ({ page }) => {
    await page.goto("/?step=assets");

    await page.getByText("+ Add Asset").click();

    // Select Roth 401k from suggestions
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.fill("Roth 4");
    await page.getByRole("button", { name: /Roth 401k/ }).click();

    // Fill amount and add
    const amountInput = page.getByLabel("New asset amount");
    await amountInput.fill("25000");
    await page.getByLabel("Confirm add asset").click();

    // Verify the asset was added — use specific locator to avoid multiple matches
    await expect(page.getByRole("button", { name: "Edit category for Roth 401k" })).toBeVisible();

    await captureScreenshot(page, "task-93-roth-401k-added");
  });

  test("Roth 401k shows 7% suggested ROI and hides tax treatment toggle", async ({ page }) => {
    await page.goto("/?step=assets");

    // Add a Roth 401k asset
    await page.getByText("+ Add Asset").click();
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.fill("Roth 4");
    await page.getByRole("button", { name: /Roth 401k/ }).click();
    await page.getByLabel("New asset amount").fill("25000");
    await page.getByLabel("Confirm add asset").click();

    // Should show 7% ROI (suggested)
    await expect(page.getByText("7% ROI (suggested)").last()).toBeVisible();

    // Should NOT show ROI tax treatment toggle (it's tax-sheltered)
    // Find the Roth 401k asset's details section via the edit category button's ancestor
    const roth401kButton = page.getByRole("button", { name: "Edit category for Roth 401k" });
    const assetRow = roth401kButton.locator("xpath=ancestor::div[@role='listitem']");
    await expect(assetRow.locator('[data-testid^="roi-tax-treatment-"]')).toHaveCount(0);

    await captureScreenshot(page, "task-93-roth-401k-roi-no-tax-toggle");
  });
});
