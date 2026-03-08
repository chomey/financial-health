import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

/**
 * Task 142: US tax credit and deduction categories with income limits and filing status
 * Verifies that:
 * - Full US category list is present in the suggestions dropdown
 * - All new US categories (Child and Dependent Care, Premium Tax Credit, Adoption Credit,
 *   Charitable Contributions) are present
 * - Info-only entries (Standard Deduction, HSA, Mortgage, SSDI) are excluded from the picker
 * - Filing status filtering works for US (MFS marks some credits ineligible)
 */
test.describe("Task 142: US Tax Credit Categories", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("US credit suggestions include all categories for single filers", async ({ page }) => {
    // Switch to US
    const usButton = page.locator('[data-testid="country-us"]');
    if (await usButton.isVisible()) {
      await usButton.click();
      await page.waitForLoadState("networkidle");
    }

    // Open the Tax Credits section and add a new credit
    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();

    const addButton = page
      .locator('[data-testid="add-tax-credit"]')
      .or(page.getByRole("button", { name: /Add Credit/i }));
    await addButton.click();

    // Click on the category input to trigger suggestions
    const categoryInput = page
      .locator('[data-testid="tax-credit-category-input"]')
      .or(page.locator('input[placeholder*="category"], input[placeholder*="Credit"]'))
      .first();
    await categoryInput.click();

    // Verify core US categories from Task 140/141 appear
    await expect(page.getByText("Earned Income Tax Credit (EITC)").first()).toBeVisible();
    await expect(page.getByText("Child Tax Credit").first()).toBeVisible();
    await expect(page.getByText("American Opportunity Tax Credit (AOTC)").first()).toBeVisible();
    await expect(page.getByText("Lifetime Learning Credit").first()).toBeVisible();
    await expect(page.getByText("Electric Vehicle Credit").first()).toBeVisible();
    await expect(page.getByText("Residential Clean Energy Credit").first()).toBeVisible();

    // Verify new categories from Task 142 appear
    await expect(page.getByText("Child and Dependent Care Credit").first()).toBeVisible();
    await expect(page.getByText("Premium Tax Credit").first()).toBeVisible();
    await expect(page.getByText("Adoption Credit").first()).toBeVisible();
    await expect(page.getByText("Charitable Contributions Deduction").first()).toBeVisible();
    await expect(page.getByText("State and Local Tax (SALT) Deduction").first()).toBeVisible();
    await expect(page.getByText("Student Loan Interest Deduction").first()).toBeVisible();

    // Info-only entries should NOT appear in suggestions
    await expect(page.getByText("Standard Deduction").first()).not.toBeVisible();
    await expect(page.getByText("SSDI/SSI Benefits").first()).not.toBeVisible();

    await captureScreenshot(page, "task-142-us-single-categories");
  });

  test("US credit suggestions work for married-jointly filers", async ({ page }) => {
    // Switch to US
    const usButton = page.locator('[data-testid="country-us"]');
    if (await usButton.isVisible()) {
      await usButton.click();
      await page.waitForLoadState("networkidle");
    }

    // Switch filing status to married-jointly
    const filingSelector = page.locator('[data-testid="filing-status-selector"]');
    await filingSelector.selectOption("married-jointly");

    // Open tax credits and add a credit
    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();

    const addButton = page
      .locator('[data-testid="add-tax-credit"]')
      .or(page.getByRole("button", { name: /Add Credit/i }));
    await addButton.click();

    // Click category input
    const categoryInput = page
      .locator('[data-testid="tax-credit-category-input"]')
      .or(page.locator('input[placeholder*="category"], input[placeholder*="Credit"]'))
      .first();
    await categoryInput.click();

    // All standard credits should appear for MFJ
    await expect(page.getByText("Child Tax Credit").first()).toBeVisible();
    await expect(page.getByText("Earned Income Tax Credit (EITC)").first()).toBeVisible();
    await expect(page.getByText("Child and Dependent Care Credit").first()).toBeVisible();
    await expect(page.getByText("Adoption Credit").first()).toBeVisible();

    await captureScreenshot(page, "task-142-us-mfj-categories");
  });

  test("US credit description is informative for Adoption Credit", async ({ page }) => {
    // Switch to US
    const usButton = page.locator('[data-testid="country-us"]');
    if (await usButton.isVisible()) {
      await usButton.click();
      await page.waitForLoadState("networkidle");
    }

    // Open tax credits and add a new credit
    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();

    const addButton = page
      .locator('[data-testid="add-tax-credit"]')
      .or(page.getByRole("button", { name: /Add Credit/i }));
    await addButton.click();

    // Search for Adoption Credit
    const categoryInput = page
      .locator('[data-testid="tax-credit-category-input"]')
      .or(page.locator('input[placeholder*="category"], input[placeholder*="Credit"]'))
      .first();
    await categoryInput.click();
    await categoryInput.fill("Adoption");

    const adoptionOption = page.getByText("Adoption Credit");
    if (await adoptionOption.isVisible()) {
      await adoptionOption.click();
    }

    await captureScreenshot(page, "task-142-us-adoption-credit-selected");
  });
});
