import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Debt payoff timeline display", () => {
  test("shows payoff info when interest rate and payment are set", async ({ page }) => {
    await page.goto("/");

    // Set interest rate on Car Loan (d1)
    await page.getByTestId("interest-badge-d1").click();
    await page.getByLabel("Edit interest rate for Car Loan").fill("6");
    await page.getByLabel("Edit interest rate for Car Loan").press("Enter");

    // Set monthly payment
    await page.getByTestId("debt-payment-badge-d1").click();
    await page.getByLabel("Edit monthly payment for Car Loan").fill("300");
    await page.getByLabel("Edit monthly payment for Car Loan").press("Enter");

    // Payoff info should appear
    const payoffInfo = page.getByTestId("debt-payoff-d1");
    await expect(payoffInfo).toBeVisible();
    await expect(payoffInfo).toContainText("Paid off in");
    await expect(payoffInfo).toContainText("total interest");

    await captureScreenshot(page, "task-29-payoff-timeline");
  });

  test("shows warning when payment doesn't cover interest", async ({ page }) => {
    await page.goto("/");

    // Set high interest rate on Car Loan
    await page.getByTestId("interest-badge-d1").click();
    await page.getByLabel("Edit interest rate for Car Loan").fill("50");
    await page.getByLabel("Edit interest rate for Car Loan").press("Enter");

    // Set tiny monthly payment ($100 won't cover interest on $15,000 at 50%)
    await page.getByTestId("debt-payment-badge-d1").click();
    await page.getByLabel("Edit monthly payment for Car Loan").fill("100");
    await page.getByLabel("Edit monthly payment for Car Loan").press("Enter");

    // Warning should appear
    const warning = page.getByTestId("debt-payoff-warning-d1");
    await expect(warning).toBeVisible();
    await expect(warning).toContainText("balance will grow");

    await captureScreenshot(page, "task-29-payoff-warning");
  });

  test("no payoff info when only interest rate is set (no payment)", async ({ page }) => {
    await page.goto("/");

    // Car Loan has suggested 6% APR but no payment set by default
    // Payoff info should not appear
    await expect(page.getByTestId("debt-payoff-d1")).not.toBeVisible();
    await expect(page.getByTestId("debt-payoff-warning-d1")).not.toBeVisible();
  });

  test("payoff info uses suggested rate when no explicit rate set", async ({ page }) => {
    await page.goto("/");

    // Don't set interest rate (Car Loan has 6% suggested default)
    // Set monthly payment
    await page.getByTestId("debt-payment-badge-d1").click();
    await page.getByLabel("Edit monthly payment for Car Loan").fill("300");
    await page.getByLabel("Edit monthly payment for Car Loan").press("Enter");

    // Payoff info should appear using suggested 6% rate
    const payoffInfo = page.getByTestId("debt-payoff-d1");
    await expect(payoffInfo).toBeVisible();
    await expect(payoffInfo).toContainText("Paid off in");

    await captureScreenshot(page, "task-29-payoff-suggested-rate");
  });
});
