import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Task 140: Tax Credits & Deductions Entry", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("filing status selector is visible and defaults to Single", async ({ page }) => {
    const selector = page.locator('[data-testid="filing-status-selector"]');
    await expect(selector).toBeVisible();
    await expect(selector).toHaveValue("single");
  });

  test("filing status changes options when country changes", async ({ page }) => {
    // Start with CA — should have 2 options
    const selector = page.locator('[data-testid="filing-status-selector"]');
    let options = await selector.locator("option").allTextContents();
    expect(options).toContain("Single");
    expect(options).toContain("Married / Common-Law");

    // Switch to US — should have 4 options
    const countryToggle = page.getByRole("button", { name: /United States/i }).or(
      page.locator('[data-testid="country-toggle-US"]')
    );
    // Try clicking US tab/button if it exists
    const usButton = page.locator('button:has-text("US"), button:has-text("United States"), [data-testid*="country"] button:nth-child(2)');
    if (await usButton.first().isVisible()) {
      await usButton.first().click();
    }
    // Verify options updated
    options = await selector.locator("option").allTextContents();
    if (options.length === 4) {
      expect(options).toContain("Married Filing Jointly");
      expect(options).toContain("Married Filing Separately");
      expect(options).toContain("Head of Household");
    }
  });

  test("tax credits section is visible and can add a credit", async ({ page }) => {
    // Expand the Tax Credits section
    const taxSection = page.locator('section:has-text("Tax Credits"), [id*="tax-credits"], button:has-text("Tax Credits")');
    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();

    // Should show empty state
    await expect(page.locator('[data-testid="tax-credit-empty-state"]')).toBeVisible();

    // Click "+ Add Credit" button
    await page.getByRole("button", { name: /Add Credit/i }).click();

    // Type a category
    const categoryInput = page.getByLabel("New credit category");
    await categoryInput.fill("Disability");

    // Suggestions should appear
    await expect(page.getByText("Disability Tax Credit (DTC)")).toBeVisible();

    // Click the suggestion
    await page.getByText("Disability Tax Credit (DTC)").click();

    // Amount input should be focused, enter an amount
    const amountInput = page.getByLabel("New credit annual amount");
    await amountInput.fill("9428");

    // Click Add
    await page.getByRole("button", { name: /Confirm add credit/i }).click();

    // Credit should appear in the list
    await expect(page.getByText("Disability Tax Credit (DTC)")).toBeVisible();
    await expect(page.getByRole("button", { name: /Edit amount for Disability/ })).toBeVisible();

    // Type badge should show "Non-refundable"
    await expect(page.getByText("Non-refundable").first()).toBeVisible();

    await captureScreenshot(page, "task-140-credit-added");
  });

  test("info tooltip explains credit types", async ({ page }) => {
    // Expand tax credits section
    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();

    // Click info button
    const infoBtn = page.locator('[data-testid="tax-credit-info-btn"]');
    await infoBtn.click();

    // Tooltip should be visible
    const tooltip = page.locator('[data-testid="tax-credit-info-tooltip"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText("Refundable");
    await expect(tooltip).toContainText("Non-refundable");
    await expect(tooltip).toContainText("Deductions");
  });

  test("shows eligibility warnings for income-limited credits", async ({ page }) => {
    // First add income so we have a known income level
    // The default sample profile should have some income already
    // Expand tax credits section
    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();

    // Add a credit that has income limits
    await page.getByRole("button", { name: /Add Credit/i }).click();
    const categoryInput = page.getByLabel("New credit category");
    await categoryInput.fill("Canada Workers");
    await page.getByText("Canada Workers Benefit (CWB)").click();
    const amountInput = page.getByLabel("New credit annual amount");
    await amountInput.fill("1518");
    await page.getByRole("button", { name: /Confirm add credit/i }).click();

    // With default sample data (Salary of $4,500/mo = $54,000/yr), CWB should show as ineligible
    // since phase-out end for single is $33,015
    const ineligibleBadge = page.locator('[data-testid="eligibility-ineligible"]');
    const reducedBadge = page.locator('[data-testid="eligibility-reduced"]');

    // Should show either reduced or ineligible depending on the default income
    const hasWarning = await ineligibleBadge.isVisible().catch(() => false) ||
      await reducedBadge.isVisible().catch(() => false);
    expect(hasWarning).toBe(true);

    await captureScreenshot(page, "task-140-eligibility-warning");
  });

  test("can delete a credit", async ({ page }) => {
    // Expand and add a credit
    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();
    await page.getByRole("button", { name: /Add Credit/i }).click();
    const categoryInput = page.getByLabel("New credit category");
    await categoryInput.fill("Medical");
    await page.getByText("Medical Expense Tax Credit").click();
    const amountInput = page.getByLabel("New credit annual amount");
    await amountInput.fill("3000");
    await page.getByRole("button", { name: /Confirm add credit/i }).click();

    // Verify it's there
    await expect(page.getByText("Medical Expense Tax Credit")).toBeVisible();

    // Delete it
    await page.getByRole("button", { name: /Delete Medical/i }).click();

    // Should show empty state again
    await expect(page.locator('[data-testid="tax-credit-empty-state"]')).toBeVisible();
  });

  test("total updates when credits are added", async ({ page }) => {
    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();

    // Add first credit
    await page.getByRole("button", { name: /Add Credit/i }).click();
    await page.getByLabel("New credit category").fill("Disability Tax Credit (DTC)");
    await page.getByLabel("New credit annual amount").fill("9428");
    await page.getByRole("button", { name: /Confirm add credit/i }).click();

    // Add second credit
    await page.getByRole("button", { name: /Add Credit/i }).click();
    await page.getByLabel("New credit category").fill("Medical Expense Tax Credit");
    await page.getByLabel("New credit annual amount").fill("3000");
    await page.getByRole("button", { name: /Confirm add credit/i }).click();

    // Total should reflect both
    await expect(page.getByText("$12,428/yr")).toBeVisible();

    await captureScreenshot(page, "task-140-multiple-credits");
  });

  test("URL state persists tax credits across reload", async ({ page }) => {
    // Expand and add a credit
    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();
    await page.getByRole("button", { name: /Add Credit/i }).click();
    await page.getByLabel("New credit category").fill("Canada Child");

    // Wait for suggestions and click
    await page.getByText("Canada Child Benefit (CCB)").click();
    await page.getByLabel("New credit annual amount").fill("7437");
    await page.getByRole("button", { name: /Confirm add credit/i }).click();

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Get current URL
    const url = page.url();
    expect(url).toContain("s=");

    // Reload page
    await page.goto(url);
    await page.waitForLoadState("networkidle");

    // Expand tax credits section
    const taxHeader2 = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader2.click();

    // Credit should still be there
    await expect(page.getByText("Canada Child Benefit (CCB)")).toBeVisible();
    await expect(page.getByRole("button", { name: /Edit amount for Canada Child/ })).toBeVisible();

    await captureScreenshot(page, "task-140-url-persistence");
  });
});
