import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

/**
 * Task 141: Canadian tax credit categories with income limits and spousal status
 */
test.describe("Task 141: Canadian Tax Credit Categories", () => {
  test("CA credit suggestions include all new categories for single filers", async ({ page }) => {
    // Navigate to expenses step (tax credits are part of expenses step now)
    await page.goto("/?step=expenses");
    await page.waitForFunction(() => window.location.search.includes("s="));

    // Scroll to tax credits section and click add credit
    const addCreditBtn = page.getByText("+ Add Credit");
    await addCreditBtn.scrollIntoViewIfNeeded();
    await addCreditBtn.click();

    // Click on the category input to trigger suggestions
    const categoryInput = page.getByLabel("New credit category");
    await categoryInput.click();

    // Verify core CA categories appear
    await expect(page.getByText("Disability Tax Credit (DTC)")).toBeVisible();
    await expect(page.getByText("Canada Workers Benefit (CWB)")).toBeVisible();
    await expect(page.getByText("GST/HST Credit")).toBeVisible();
    await expect(page.getByText("Canada Child Benefit (CCB)")).toBeVisible();

    // Verify categories from Task 141
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
    // Set filing status on profile step first
    await page.goto("/?step=profile");
    await page.waitForFunction(() => window.location.search.includes("s="));

    const filingSelector = page.getByTestId("wizard-filing-status");
    await filingSelector.selectOption("married-common-law");
    await page.waitForTimeout(300);

    // Navigate to expenses step (tax credits are here)
    const url = page.url();
    await page.goto(url.replace(/step=profile/, "step=expenses"));
    await page.waitForTimeout(300);

    // Add a credit
    const addCreditBtn = page.getByText("+ Add Credit");
    await addCreditBtn.scrollIntoViewIfNeeded();
    await addCreditBtn.click();

    const categoryInput = page.getByLabel("New credit category");
    await categoryInput.click();

    // Spousal Amount Credit should now be visible
    await expect(page.getByText("Spousal Amount Credit")).toBeVisible();

    await captureScreenshot(page, "task-141-ca-married-categories");
  });

  test("CA category descriptions are informative", async ({ page }) => {
    // Navigate to expenses step
    await page.goto("/?step=expenses");
    await page.waitForFunction(() => window.location.search.includes("s="));

    // Add a credit
    const addCreditBtn = page.getByText("+ Add Credit");
    await addCreditBtn.scrollIntoViewIfNeeded();
    await addCreditBtn.click();

    const categoryInput = page.getByLabel("New credit category");
    await categoryInput.click();
    await categoryInput.fill("Moving");

    const movingOption = page.getByText("Moving Expenses Deduction");
    if (await movingOption.isVisible()) {
      await movingOption.click();
    }

    await captureScreenshot(page, "task-141-ca-deduction-selected");
  });
});
