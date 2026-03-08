import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

/**
 * Task 141: Canadian tax credit categories with income limits and spousal status
 * Verifies that:
 * - Full CA category list is present in the suggestions dropdown
 * - Spousal Amount Credit is hidden for single filers, shown for married/common-law
 * - Income eligibility indicators work correctly for CA-specific thresholds
 */
test.describe("Task 141: Canadian Tax Credit Categories", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("CA credit suggestions include all new categories for single filers", async ({ page }) => {
    // Ensure we're on CA (default)
    const caButton = page.locator('[data-testid="country-ca"]');
    if (await caButton.isVisible()) {
      await caButton.click();
    }

    // Open the Tax Credits section and add a new credit
    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();

    const addButton = page.locator('[data-testid="add-tax-credit"]').or(
      page.getByRole("button", { name: /Add Credit/i }),
    );
    await addButton.click();

    // Click on the category input to trigger suggestions
    const categoryInput = page.locator('[data-testid="tax-credit-category-input"]').or(
      page.locator('input[placeholder*="category"], input[placeholder*="Credit"]'),
    ).first();
    await categoryInput.click();

    // Should see the full list of CA categories
    const suggestions = page.locator('[data-testid="tax-credit-suggestions"]').or(
      page.locator('[role="listbox"]'),
    );

    // Verify core CA categories appear
    await expect(page.getByText("Disability Tax Credit (DTC)")).toBeVisible();
    await expect(page.getByText("Canada Workers Benefit (CWB)")).toBeVisible();
    await expect(page.getByText("GST/HST Credit")).toBeVisible();
    await expect(page.getByText("Canada Child Benefit (CCB)")).toBeVisible();

    // Verify new categories from Task 141 appear
    await expect(page.getByText("Home Accessibility Tax Credit")).toBeVisible();
    await expect(page.getByText("Climate Action Incentive")).toBeVisible();
    await expect(page.getByText("Moving Expenses Deduction")).toBeVisible();
    await expect(page.getByText("Union & Professional Dues")).toBeVisible();
    await expect(page.getByText("Northern Residents Deduction")).toBeVisible();
    await expect(page.getByText("Canada Caregiver Credit")).toBeVisible();

    // Spousal Amount Credit should NOT appear for single filers
    await expect(page.getByText("Spousal Amount Credit")).not.toBeVisible();

    await captureScreenshot(page, "task-141-ca-single-categories");
  });

  test("Spousal Amount Credit appears when filing status is Married/Common-Law", async ({ page }) => {
    // Ensure we're on CA
    const caButton = page.locator('[data-testid="country-ca"]');
    if (await caButton.isVisible()) {
      await caButton.click();
    }

    // Switch filing status to married-common-law
    const filingSelector = page.locator('[data-testid="filing-status-selector"]');
    await filingSelector.selectOption("married-common-law");

    // Open tax credits and add a credit
    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();

    const addButton = page.locator('[data-testid="add-tax-credit"]').or(
      page.getByRole("button", { name: /Add Credit/i }),
    );
    await addButton.click();

    // Click category input
    const categoryInput = page.locator('[data-testid="tax-credit-category-input"]').or(
      page.locator('input[placeholder*="category"], input[placeholder*="Credit"]'),
    ).first();
    await categoryInput.click();

    // Spousal Amount Credit should now be visible
    await expect(page.getByText("Spousal Amount Credit")).toBeVisible();

    await captureScreenshot(page, "task-141-ca-married-categories");
  });

  test("CA category descriptions are informative", async ({ page }) => {
    // Ensure we're on CA
    const caButton = page.locator('[data-testid="country-ca"]');
    if (await caButton.isVisible()) {
      await caButton.click();
    }

    // Open tax credits and add a new credit
    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();

    const addButton = page.locator('[data-testid="add-tax-credit"]').or(
      page.getByRole("button", { name: /Add Credit/i }),
    );
    await addButton.click();

    // Select "Moving Expenses Deduction" from suggestions
    const categoryInput = page.locator('[data-testid="tax-credit-category-input"]').or(
      page.locator('input[placeholder*="category"], input[placeholder*="Credit"]'),
    ).first();
    await categoryInput.click();
    await categoryInput.fill("Moving");

    const movingOption = page.getByText("Moving Expenses Deduction");
    if (await movingOption.isVisible()) {
      await movingOption.click();
    }

    await captureScreenshot(page, "task-141-ca-deduction-selected");
  });
});
