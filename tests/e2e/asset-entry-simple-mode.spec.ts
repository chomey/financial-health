import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("AssetEntry in simple mode", () => {
  test("hides advanced detail fields in simple mode (default)", async ({ page }) => {
    await page.goto("/?step=assets");
    await page.waitForLoadState("networkidle");

    const assetList = page.getByRole("list", { name: "Asset items" });

    // Should show categories and amounts
    await expect(assetList.getByText("Savings Account")).toBeVisible();
    await expect(assetList.getByText("TFSA")).toBeVisible();
    await expect(assetList.getByText("RRSP")).toBeVisible();

    // ROI badges should not be present
    await expect(page.locator("[data-testid^='roi-badge-']").first()).not.toBeVisible();

    // Tax treatment pills should not be present
    await expect(page.locator("[data-testid^='tax-treatment-pill-']").first()).not.toBeVisible();

    // Surplus target checkboxes should not be present
    await expect(page.locator("[data-testid^='surplus-target-']").first()).not.toBeVisible();

    // Monthly contribution badges should not be present
    await expect(page.locator("[data-testid^='contribution-badge-']").first()).not.toBeVisible();

    await captureScreenshot(page, "task-178-asset-entry-simple-mode");
  });

  test("shows all advanced fields after switching to advanced mode", async ({ page }) => {
    await page.goto("/?step=assets");
    await page.waitForLoadState("networkidle");

    // Switch to advanced mode via the header toggle (available on all pages)
    await page.getByTestId("mode-toggle-advanced").click();

    // ROI badges should now be visible
    await expect(page.locator("[data-testid^='roi-badge-']").first()).toBeVisible();

    // Tax treatment pills should be visible
    await expect(page.locator("[data-testid^='tax-treatment-pill-']").first()).toBeVisible();

    // Surplus target should be visible
    await expect(page.locator("[data-testid^='surplus-target-']").first()).toBeVisible();

    await captureScreenshot(page, "task-178-asset-entry-advanced-mode");
  });

  test("simple mode total and Add Asset still work", async ({ page }) => {
    await page.goto("/?step=assets");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/Total:/)).toBeVisible();
    await expect(page.getByText("+ Add Asset")).toBeVisible();

    // Add a new asset
    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Emergency Fund");
    await page.getByLabel("New asset amount").fill("3000");
    await page.getByLabel("Confirm add asset").click();

    await expect(page.getByText("Emergency Fund")).toBeVisible();

    await captureScreenshot(page, "task-178-asset-entry-simple-add");
  });
});
