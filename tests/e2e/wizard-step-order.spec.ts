import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Wizard step order (Task 168)", () => {
  test("stepper shows all 9 steps in correct DOM order", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='wizard-step-income']");

    // Get all step testIds in DOM order
    const stepIds = await page.locator("[data-testid^='wizard-step-']").evaluateAll(
      (els) => els.map((el) => el.getAttribute("data-testid"))
    );

    const expectedOrder = [
      "wizard-step-welcome",
      "wizard-step-profile",
      "wizard-step-income",
      "wizard-step-expenses",
      "wizard-step-debts",
      "wizard-step-property",
      "wizard-step-assets",
      "wizard-step-stocks",
      "wizard-step-tax-summary",
    ];

    expect(stepIds).toEqual(expectedOrder);

    await captureScreenshot(page, "task-168-wizard-step-order");
  });

  test("clicking income tab shows income as the active step", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='wizard-step-income']");

    await page.getByTestId("wizard-step-income").click();
    await page.waitForTimeout(200);

    await expect(page.getByTestId("wizard-step-income")).toHaveAttribute("aria-current", "step");

    await captureScreenshot(page, "task-168-income-step-active");
  });

  test("clicking expenses tab shows expenses as the active step", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='wizard-step-expenses']");

    await page.getByTestId("wizard-step-expenses").click();
    await page.waitForTimeout(200);

    await expect(page.getByTestId("wizard-step-expenses")).toHaveAttribute("aria-current", "step");

    await captureScreenshot(page, "task-168-expenses-step-active");
  });

  test("clicking debts tab shows debts as the active step", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='wizard-step-debts']");

    await page.getByTestId("wizard-step-debts").click();
    await page.waitForTimeout(200);

    await expect(page.getByTestId("wizard-step-debts")).toHaveAttribute("aria-current", "step");

    await captureScreenshot(page, "task-168-debts-step-active");
  });

  test("clicking assets tab shows assets as the active step", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='wizard-step-assets']");

    await page.getByTestId("wizard-step-assets").click();
    await page.waitForTimeout(200);

    await expect(page.getByTestId("wizard-step-assets")).toHaveAttribute("aria-current", "step");

    await captureScreenshot(page, "task-168-assets-step-active");
  });
});
