import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Grouped category dropdowns (no region toggle)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');
  });

  test("region toggle is not present in the header", async ({ page }) => {
    // The radiogroup for region filtering should not exist
    const regionToggle = page.getByRole("radiogroup", {
      name: /Filter account types/i,
    });
    await expect(regionToggle).toHaveCount(0);
  });

  test("asset dropdown shows Canada, USA, and General groups", async ({ page }) => {
    // Open add asset form
    await page.getByText("+ Add Asset").click();
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();

    // Verify three group headers appear
    const headers = page.locator("[data-testid='suggestion-group-header']");
    await expect(headers).toHaveCount(3);
    await expect(headers.nth(0)).toContainText("Canada");
    await expect(headers.nth(1)).toContainText("USA");
    await expect(headers.nth(2)).toContainText("General");

    // Verify CA types are present
    const suggestions = page.locator(".animate-in");
    await expect(suggestions.getByRole("button", { name: /TFSA/ })).toBeVisible();
    await expect(suggestions.getByRole("button", { name: /RRSP/ })).toBeVisible();

    // Verify US types are present (no filtering)
    await expect(suggestions.getByRole("button", { name: /401k/ })).toBeVisible();
    await expect(suggestions.getByRole("button", { name: /Roth IRA/ })).toBeVisible();

    // Verify universal types are present
    await expect(suggestions.getByRole("button", { name: /Savings/ })).toBeVisible();

    await captureScreenshot(page, "task-31-asset-grouped-dropdown");
  });

  test("debt dropdown shows Canada, USA, and General groups", async ({ page }) => {
    // Open add debt form
    await page.getByText("+ Add Debt").click();
    const categoryInput = page.getByLabel("New debt category");
    await categoryInput.click();

    // Verify three group headers appear
    const headers = page.locator("[data-testid='suggestion-group-header']");
    await expect(headers).toHaveCount(3);
    await expect(headers.nth(0)).toContainText("Canada");
    await expect(headers.nth(1)).toContainText("USA");
    await expect(headers.nth(2)).toContainText("General");

    // Verify CA debt types present
    const suggestions = page.locator(".animate-in");
    await expect(suggestions.getByRole("button", { name: /HELOC/ })).toBeVisible();

    // Verify US debt types present
    await expect(suggestions.getByRole("button", { name: /Medical Debt/ })).toBeVisible();

    // Verify universal debt types present
    await expect(suggestions.getByRole("button", { name: /Credit Card/ })).toBeVisible();
    await expect(suggestions.getByRole("button", { name: /Car Loan/ })).toBeVisible();

    await captureScreenshot(page, "task-31-debt-grouped-dropdown");
  });

  test("selecting a category from grouped dropdown works", async ({ page }) => {
    // Open add asset form
    await page.getByText("+ Add Asset").click();
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();

    // Click a suggestion from the Canada group
    const suggestions = page.locator(".animate-in");
    await suggestions.getByRole("button", { name: /RESP/ }).click();

    // The category input should now have "RESP"
    await expect(categoryInput).toHaveValue("RESP");

    await captureScreenshot(page, "task-31-category-selected");
  });

  test("no out-of-region dimming or badges on items", async ({ page }) => {
    // TFSA is a Canadian account type — it should NOT be dimmed or have a badge
    const assetList = page.getByRole("list", { name: "Asset items" });
    const tfsaItem = assetList
      .getByRole("listitem")
      .filter({ hasText: "TFSA" });
    await expect(tfsaItem).toBeVisible();
    // Should not have opacity-50 class
    await expect(tfsaItem).not.toHaveClass(/opacity-50/);
    // Should not have region badge
    const regionBadge = tfsaItem.locator("[data-testid^='region-badge-']");
    await expect(regionBadge).toHaveCount(0);

    await captureScreenshot(page, "task-31-no-dimming");
  });
});
