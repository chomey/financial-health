import { test, expect } from "@playwright/test";
import { captureScreenshot, setSimpleMode } from "./helpers";

test.describe("ExpenseEntry simple mode debt payments", () => {
  test("shows Debt Payments subsection in simple mode expenses step", async ({ page }) => {
    await setSimpleMode(page);
    await page.goto("/?step=expenses");
    await page.waitForLoadState("networkidle");

    // Debt Payments section should be visible in simple mode
    await expect(page.getByTestId("simple-debt-payments-section")).toBeVisible();
    await expect(page.getByText("Debt Payments")).toBeVisible();
    await expect(page.getByText("Monthly total — credit cards, loans, etc.")).toBeVisible();

    await captureScreenshot(page, "task-180-expense-simple-debt-section");
  });

  test("hides Debt Payments subsection in advanced mode", async ({ page }) => {
    await page.goto("/?step=expenses");
    await page.waitForLoadState("networkidle");

    // Switch to advanced mode
    await page.getByTestId("mode-toggle-advanced").click();

    // Debt Payments section should not be visible
    await expect(page.getByTestId("simple-debt-payments-section")).not.toBeVisible();

    await captureScreenshot(page, "task-180-expense-advanced-mode-no-debt-section");
  });

  test("can enter monthly debt payments in simple mode", async ({ page }) => {
    await setSimpleMode(page);
    await page.goto("/?step=expenses");
    await page.waitForLoadState("networkidle");

    // Click to edit the debt payments amount
    await page.getByTestId("simple-debt-amount").click();

    // Input should appear
    const input = page.getByTestId("simple-debt-input");
    await expect(input).toBeVisible();

    // Enter an amount
    await input.fill("500");
    await input.press("Enter");

    // Amount should be saved and displayed
    await expect(page.getByTestId("simple-debt-amount")).toHaveText("$500/mo");

    await captureScreenshot(page, "task-180-expense-simple-debt-entered");
  });
});
