import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("HelpTip contextual tooltips (Task 169)", () => {
  test("Profile step shows help tips for Tax Year, Filing Status, Exchange Rate", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='wizard-step-profile']");
    await page.getByTestId("wizard-step-profile").click();
    await page.waitForTimeout(200);

    // Check that help-tip buttons are present in profile step
    const helpButtons = await page.locator("[data-testid='help-tip-button']").all();
    expect(helpButtons.length).toBeGreaterThanOrEqual(3);

    await captureScreenshot(page, "task-169-profile-help-tips");
  });

  test("Clicking a help tip in Profile step shows popover", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='wizard-step-profile']");
    await page.getByTestId("wizard-step-profile").click();
    await page.waitForTimeout(200);

    // Click the first help tip button
    const firstHelpBtn = page.locator("[data-testid='help-tip-button']").first();
    await firstHelpBtn.click();

    const popover = page.locator("[data-testid='help-tip-popover']").first();
    await expect(popover).toBeVisible();

    await captureScreenshot(page, "task-169-profile-help-tip-open");
  });

  test("Income step shows help tips for Frequency and Income Type in add-new form", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='wizard-step-income']");
    await page.getByTestId("wizard-step-income").click();
    await page.waitForTimeout(200);

    // Open the add-new income form
    await page.getByText("+ Add Income").click();
    await page.waitForTimeout(100);

    // Check help tip buttons are present (for frequency and income type)
    const helpButtons = await page.locator("[data-testid='help-tip-button']").all();
    expect(helpButtons.length).toBeGreaterThanOrEqual(2);

    await captureScreenshot(page, "task-169-income-add-form-help-tips");
  });

  test("Assets step shows help tips for ROI, Tax Treatment, etc.", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='wizard-step-assets']");
    await page.getByTestId("wizard-step-assets").click();
    await page.waitForTimeout(200);

    // Check that help tip buttons are present (assets have inline help tips)
    const helpButtons = await page.locator("[data-testid='help-tip-button']").all();
    expect(helpButtons.length).toBeGreaterThan(0);

    await captureScreenshot(page, "task-169-assets-help-tips");
  });

  test("Debts step shows help tip for Interest Rate", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='wizard-step-debts']");
    await page.getByTestId("wizard-step-debts").click();
    await page.waitForTimeout(200);

    // Debts step with the default mock data should show an interest badge help tip
    const helpButtons = await page.locator("[data-testid='help-tip-button']").all();
    expect(helpButtons.length).toBeGreaterThan(0);

    await captureScreenshot(page, "task-169-debts-help-tips");
  });

  test("Property step renders and debts step has help tips for interest rate", async ({ page }) => {
    // The default state has no properties, so test via the debts step (which has a Car Loan)
    await page.goto("/");
    await page.waitForSelector("[data-testid='wizard-step-debts']");
    await page.getByTestId("wizard-step-debts").click();
    await page.waitForTimeout(200);

    // Car Loan in initial state should show interest badge with HelpTip
    const helpButtons = await page.locator("[data-testid='help-tip-button']").all();
    expect(helpButtons.length).toBeGreaterThan(0);

    await captureScreenshot(page, "task-169-debts-interest-help-tip");

    // Also verify property step loads without errors
    await page.getByTestId("wizard-step-property").click();
    await page.waitForTimeout(200);
    await captureScreenshot(page, "task-169-property-step");
  });

  test("Help tip popover disappears on second click", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='wizard-step-profile']");
    await page.getByTestId("wizard-step-profile").click();
    await page.waitForTimeout(200);

    const firstHelpBtn = page.locator("[data-testid='help-tip-button']").first();

    // First click — opens
    await firstHelpBtn.click();
    await expect(page.locator("[data-testid='help-tip-popover']").first()).toBeVisible();

    // Second click — closes
    await firstHelpBtn.click();
    await expect(page.locator("[data-testid='help-tip-popover']").first()).not.toBeVisible();
  });
});
