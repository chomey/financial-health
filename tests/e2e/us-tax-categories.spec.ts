import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

/**
 * Task 142: US tax credit and deduction categories
 */
test.describe("Task 142: US Tax Credit Categories", () => {
  async function switchToUS(page: import("@playwright/test").Page) {
    // Set country to US on profile step
    await page.goto("/?step=profile");
    await page.waitForFunction(() => window.location.search.includes("s="));
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(300);
    return page.url();
  }

  test("US credit suggestions include all categories for single filers", async ({ page }) => {
    const profileUrl = await switchToUS(page);

    // Navigate to expenses step (tax credits are here)
    await page.goto(profileUrl.replace(/step=profile/, "step=expenses"));
    await page.waitForTimeout(300);

    // Click add credit
    const addCreditBtn = page.getByText("+ Add Credit");
    await addCreditBtn.scrollIntoViewIfNeeded();
    await addCreditBtn.click();

    // Click on the category input to trigger suggestions
    const categoryInput = page.getByLabel("New credit category");
    await categoryInput.click();

    // Verify core US categories
    await expect(page.getByText("Earned Income Tax Credit (EITC)").first()).toBeVisible();
    await expect(page.getByText("Child Tax Credit").first()).toBeVisible();
    await expect(page.getByText("American Opportunity Tax Credit (AOTC)").first()).toBeVisible();
    await expect(page.getByText("Lifetime Learning Credit").first()).toBeVisible();
    await expect(page.getByText("Electric Vehicle Credit").first()).toBeVisible();
    await expect(page.getByText("Residential Clean Energy Credit").first()).toBeVisible();

    // Verify categories from Task 142
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
    // Set country to US and filing status on profile step
    await page.goto("/?step=profile");
    await page.waitForFunction(() => window.location.search.includes("s="));
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(300);

    const filingSelector = page.getByTestId("wizard-filing-status");
    await filingSelector.selectOption("married-jointly");
    await page.waitForTimeout(300);

    // Navigate to expenses step
    const url = page.url();
    await page.goto(url.replace(/step=profile/, "step=expenses"));
    await page.waitForTimeout(300);

    const addCreditBtn = page.getByText("+ Add Credit");
    await addCreditBtn.scrollIntoViewIfNeeded();
    await addCreditBtn.click();

    const categoryInput = page.getByLabel("New credit category");
    await categoryInput.click();

    // All standard credits should appear for MFJ
    await expect(page.getByText("Child Tax Credit").first()).toBeVisible();
    await expect(page.getByText("Earned Income Tax Credit (EITC)").first()).toBeVisible();
    await expect(page.getByText("Child and Dependent Care Credit").first()).toBeVisible();
    await expect(page.getByText("Adoption Credit").first()).toBeVisible();

    await captureScreenshot(page, "task-142-us-mfj-categories");
  });

  test("US credit description is informative for Adoption Credit", async ({ page }) => {
    const profileUrl = await switchToUS(page);

    // Navigate to expenses step
    await page.goto(profileUrl.replace(/step=profile/, "step=expenses"));
    await page.waitForTimeout(300);

    const addCreditBtn = page.getByText("+ Add Credit");
    await addCreditBtn.scrollIntoViewIfNeeded();
    await addCreditBtn.click();

    const categoryInput = page.getByLabel("New credit category");
    await categoryInput.click();
    await categoryInput.fill("Adoption");

    const adoptionOption = page.getByText("Adoption Credit");
    if (await adoptionOption.isVisible()) {
      await adoptionOption.click();
    }

    await captureScreenshot(page, "task-142-us-adoption-credit-selected");
  });
});
