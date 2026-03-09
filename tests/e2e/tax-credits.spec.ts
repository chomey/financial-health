import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Tax Credits & Deductions Entry", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?step=tax-credits");
  });

  test("tax credits section is visible and can add a credit", async ({ page }) => {
    // Should show empty state
    await expect(page.locator('[data-testid="tax-credit-empty-state"]')).toBeVisible();

    // Click "+ Add Credit" button
    await page.getByRole("button", { name: /Add Credit/i }).click();

    // Type a category — use Medical Expense which has free-form amount input
    const categoryInput = page.getByLabel("New credit category");
    await categoryInput.fill("Medical");

    // Click the suggestion
    await page.getByText("Medical Expense Tax Credit").click();

    // Amount input should be visible (free-form, not fixedAmount)
    const amountInput = page.getByLabel("New credit annual amount");
    await amountInput.fill("3000");

    // Click Add
    await page.getByRole("button", { name: /Confirm add credit/i }).click();

    // Credit should appear in the list
    await expect(page.getByText("Medical Expense Tax Credit")).toBeVisible();
    await expect(page.getByRole("button", { name: /Edit amount for Medical/ })).toBeVisible();

    // Type badge should show "Non-refundable"
    await expect(page.getByText("Non-refundable").first()).toBeVisible();

    await captureScreenshot(page, "task-140-credit-added");
  });

  test("info tooltip explains credit types", async ({ page }) => {
    const infoBtn = page.locator('[data-testid="tax-credit-info-btn"]');
    await infoBtn.click();

    const tooltip = page.locator('[data-testid="tax-credit-info-tooltip"]');
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText("Refundable");
    await expect(tooltip).toContainText("Non-refundable");
    await expect(tooltip).toContainText("Deductions");
  });

  test("can delete a credit", async ({ page }) => {
    // Add a credit (Medical Expense — free-form amount)
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
    // Add first credit (Medical Expense — free-form)
    await page.getByRole("button", { name: /Add Credit/i }).click();
    await page.getByLabel("New credit category").fill("Medical");
    await page.getByText("Medical Expense Tax Credit").click();
    await page.getByLabel("New credit annual amount").fill("5000");
    await page.getByRole("button", { name: /Confirm add credit/i }).click();

    // Add second credit — type a custom category name
    await page.getByRole("button", { name: /Add Credit/i }).click();
    await page.getByLabel("New credit category").fill("Custom Deduction");
    await page.keyboard.press("Tab");
    await page.getByLabel("New credit annual amount").fill("2000");
    await page.getByRole("button", { name: /Confirm add credit/i }).click();

    // Total should reflect both
    await expect(page.getByText("$7,000/yr")).toBeVisible();

    await captureScreenshot(page, "task-140-multiple-credits");
  });

  test("URL state persists tax credits across reload", async ({ page }) => {
    // Add a credit (Medical Expense — free-form amount)
    await page.getByRole("button", { name: /Add Credit/i }).click();
    await page.getByLabel("New credit category").fill("Medical");
    await page.getByText("Medical Expense Tax Credit").click();
    await page.getByLabel("New credit annual amount").fill("4500");
    await page.getByRole("button", { name: /Confirm add credit/i }).click();

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();

    // Credit should still be there
    await expect(page.getByText("Medical Expense Tax Credit")).toBeVisible();
    await expect(page.getByRole("button", { name: /Edit amount for Medical/ })).toBeVisible();

    await captureScreenshot(page, "task-140-url-persistence");
  });

  test("can add a fixed-amount credit (DTC) via amount options dropdown", async ({ page }) => {
    await page.getByRole("button", { name: /Add Credit/i }).click();

    // Type to find DTC
    const categoryInput = page.getByLabel("New credit category");
    await categoryInput.fill("Disability");
    await page.getByText("Disability Tax Credit (DTC)").click();

    // DTC has fixedAmount with amountOptions — should show a select dropdown, not a text input
    const amountSelect = page.getByLabel("Select credit amount");
    await expect(amountSelect).toBeVisible();

    // Select the Adult option
    // Select the first option (Adult 18+)
    const options = await amountSelect.locator("option").allTextContents();
    expect(options.length).toBeGreaterThanOrEqual(2);
    // Just use the default first option which should be Adult

    // Click Add
    await page.getByRole("button", { name: /Confirm add credit/i }).click();

    // Credit should appear in the list
    await expect(page.getByText("Disability Tax Credit (DTC)")).toBeVisible();
    await expect(page.getByText("Non-refundable").first()).toBeVisible();

    await captureScreenshot(page, "task-140-dtc-fixed-amount-added");
  });

  test("filing status selector is visible on profile step", async ({ page }) => {
    await page.goto("/?step=profile");

    const selector = page.locator('[data-testid="wizard-filing-status"]');
    await expect(selector).toBeVisible();
    await expect(selector).toHaveValue("single");
  });
});
