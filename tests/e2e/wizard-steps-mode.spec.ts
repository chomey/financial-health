import { test, expect } from "@playwright/test";
import { captureScreenshot, setSimpleMode } from "./helpers";

test.describe("Wizard steps — simple vs advanced mode", () => {
  test("simple mode shows 6 steps in wizard stepper", async ({ page }) => {
    // Default is simple mode
    await setSimpleMode(page);
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    // In simple mode these steps should be visible
    await expect(page.getByTestId("wizard-step-welcome")).toBeVisible();
    await expect(page.getByTestId("wizard-step-profile")).toBeVisible();
    await expect(page.getByTestId("wizard-step-income")).toBeVisible();
    await expect(page.getByTestId("wizard-step-expenses")).toBeVisible();
    await expect(page.getByTestId("wizard-step-assets")).toBeVisible();
    await expect(page.getByTestId("wizard-step-tax-summary")).toBeVisible();

    // These steps should NOT appear in simple mode
    await expect(page.getByTestId("wizard-step-debts")).not.toBeVisible();
    await expect(page.getByTestId("wizard-step-property")).not.toBeVisible();
    await expect(page.getByTestId("wizard-step-stocks")).not.toBeVisible();

    await captureScreenshot(page, "task-177-wizard-steps-simple-mode");
  });

  test("advanced mode shows all 9 steps in wizard stepper", async ({ page }) => {
    // Load with advanced mode in URL state
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    // Switch to advanced mode
    await page.getByTestId("mode-toggle-advanced").click();

    // All 9 steps should be visible
    await expect(page.getByTestId("wizard-step-welcome")).toBeVisible();
    await expect(page.getByTestId("wizard-step-profile")).toBeVisible();
    await expect(page.getByTestId("wizard-step-income")).toBeVisible();
    await expect(page.getByTestId("wizard-step-expenses")).toBeVisible();
    await expect(page.getByTestId("wizard-step-debts")).toBeVisible();
    await expect(page.getByTestId("wizard-step-property")).toBeVisible();
    await expect(page.getByTestId("wizard-step-assets")).toBeVisible();
    await expect(page.getByTestId("wizard-step-stocks")).toBeVisible();
    await expect(page.getByTestId("wizard-step-tax-summary")).toBeVisible();

    await captureScreenshot(page, "task-177-wizard-steps-advanced-mode");
  });

  test("simple mode shows '1 of 6' in footer counter", async ({ page }) => {
    await setSimpleMode(page);
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("footer").getByText("1 of 6")).toBeVisible();
  });

  test("advanced mode shows '1 of 9' in footer counter", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("mode-toggle-advanced").click();

    await expect(page.locator("footer").getByText("1 of 9")).toBeVisible();
  });

  test("tax-summary step shows 'Summary' label in simple mode stepper", async ({ page }) => {
    await setSimpleMode(page);
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    // Navigate to last step (assets), then next goes to tax-summary
    // Or just check the stepper label directly for the tax-summary button
    const taxSummaryBtn = page.getByTestId("wizard-step-tax-summary");
    // The hidden sm:inline span shows the full label
    const fullLabel = taxSummaryBtn.locator(".hidden.sm\\:inline");
    await expect(fullLabel).toHaveText("Summary");
  });

  test("tax-summary step shows 'Tax Summary' label in advanced mode stepper", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("mode-toggle-advanced").click();

    const taxSummaryBtn = page.getByTestId("wizard-step-tax-summary");
    const fullLabel = taxSummaryBtn.locator(".hidden.sm\\:inline");
    await expect(fullLabel).toHaveText("Tax Summary");
  });

  test("switching from simple to advanced preserves current step navigation", async ({ page }) => {
    await setSimpleMode(page);
    await page.goto("/?step=profile");
    await page.waitForLoadState("networkidle");

    // In simple mode — profile is step 2 of 6
    await expect(page.locator("footer").getByText("2 of 6")).toBeVisible();

    // Switch to advanced — profile is still step 2 of 9
    await page.getByTestId("mode-toggle-advanced").click();
    await expect(page.locator("footer").getByText("2 of 9")).toBeVisible();

    await captureScreenshot(page, "task-177-wizard-steps-mode-switch-preserves-step");
  });
});
