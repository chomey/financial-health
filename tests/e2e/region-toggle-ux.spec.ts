import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Region toggle UX improvements (Task 21)", () => {
  test("toggle has tooltip explaining its purpose", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("radiogroup", { name: /Filter account types by region/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("title", "Filter account types by region");
  });

  test("shows toast message when region changes", async ({ page }) => {
    await page.goto("/");

    // No toast initially
    await expect(page.getByTestId("region-toast")).not.toBeVisible();

    // Click US
    await page.getByRole("radio", { name: /US/i }).click();
    const toast = page.getByTestId("region-toast");
    await expect(toast).toBeVisible();
    await expect(toast).toHaveText("Showing US account types");

    await captureScreenshot(page, "task-21-region-toast-us");

    // Click CA
    await page.getByRole("radio", { name: /CA/i }).click();
    await expect(toast).toHaveText("Showing Canadian account types");

    await captureScreenshot(page, "task-21-region-toast-ca");

    // Click Both
    await page.getByRole("radio", { name: /Both/i }).click();
    await expect(toast).toHaveText("Showing all account types");
  });

  test("dims out-of-region assets when US is selected", async ({ page }) => {
    await page.goto("/");

    // Default mock has TFSA (CA-specific). Select US region.
    await page.getByRole("radio", { name: /US/i }).click();

    // TFSA row should be dimmed (opacity-50)
    const tfsaItem = page.getByRole("button", { name: /Edit category for TFSA/i }).locator("xpath=ancestor::div[@role='listitem']");
    await expect(tfsaItem).toHaveClass(/opacity-50/);

    // TFSA should show a "CA" badge
    const tfsaCatButton = page.getByRole("button", { name: /Edit category for TFSA/i });
    await expect(tfsaCatButton).toContainText("CA");

    // Savings Account should NOT be dimmed
    const savingsItem = page.getByRole("button", { name: /Edit category for Savings Account/i }).locator("xpath=ancestor::div[@role='listitem']");
    await expect(savingsItem).not.toHaveClass(/opacity-50/);

    await captureScreenshot(page, "task-21-dimmed-assets-us");
  });

  test("does not dim any items when Both is selected", async ({ page }) => {
    await page.goto("/");

    // Make sure Both is selected (default)
    await page.getByRole("radio", { name: /Both/i }).click();

    // TFSA should NOT be dimmed
    const tfsaItem = page.getByRole("button", { name: /Edit category for TFSA/i }).locator("xpath=ancestor::div[@role='listitem']");
    await expect(tfsaItem).not.toHaveClass(/opacity-50/);
  });

  test("grouped suggestion headers appear in asset dropdown", async ({ page }) => {
    await page.goto("/");

    // Select Both to see all groups
    await page.getByRole("radio", { name: /Both/i }).click();

    // Open add asset form
    await page.getByRole("button", { name: /Add Asset/i }).click();
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();

    // Check for section headers
    const headers = page.locator("[data-testid='suggestion-group-header']");
    await expect(headers).toHaveCount(3);
    await expect(headers.nth(0)).toContainText("Canadian");
    await expect(headers.nth(1)).toContainText("US");
    await expect(headers.nth(2)).toContainText("General");

    await captureScreenshot(page, "task-21-grouped-asset-suggestions");
  });

  test("grouped suggestion headers appear in debt dropdown", async ({ page }) => {
    await page.goto("/");

    // Select Both to see all groups
    await page.getByRole("radio", { name: /Both/i }).click();

    // Open add debt form
    await page.getByRole("button", { name: /Add Debt/i }).click();
    const categoryInput = page.getByLabel("New debt category");
    await categoryInput.click();

    // Check for section headers
    const headers = page.locator("[data-testid='suggestion-group-header']");
    await expect(headers).toHaveCount(3);

    await captureScreenshot(page, "task-21-grouped-debt-suggestions");
  });

  test("CA region only shows CA + General groups in suggestions", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("radio", { name: /CA/i }).click();

    // Open add asset form
    await page.getByRole("button", { name: /Add Asset/i }).click();
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();

    // Should have 2 groups: Canadian and General (no US)
    const headers = page.locator("[data-testid='suggestion-group-header']");
    await expect(headers).toHaveCount(2);
    await expect(headers.nth(0)).toContainText("Canadian");
    await expect(headers.nth(1)).toContainText("General");

    await captureScreenshot(page, "task-21-ca-grouped-suggestions");
  });
});
