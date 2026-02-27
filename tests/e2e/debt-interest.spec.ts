import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Debt interest rate and monthly payment", () => {
  test("shows suggested interest rate badge for Car Loan", async ({ page }) => {
    await page.goto("/");

    // Car Loan should show 6% APR (suggested)
    const interestBadge = page.getByTestId("interest-badge-d1");
    await expect(interestBadge).toBeVisible();
    await expect(interestBadge).toContainText("6% APR (suggested)");

    await captureScreenshot(page, "task-24-interest-suggested-badge");
  });

  test("shows monthly payment placeholder", async ({ page }) => {
    await page.goto("/");

    const paymentBadge = page.getByTestId("debt-payment-badge-d1");
    await expect(paymentBadge).toBeVisible();
    await expect(paymentBadge).toContainText("Monthly payment");
  });

  test("allows editing interest rate by clicking the badge", async ({ page }) => {
    await page.goto("/");

    // Click the Car Loan interest badge
    await page.getByTestId("interest-badge-d1").click();

    // Should show edit input
    const rateInput = page.getByLabel("Edit interest rate for Car Loan");
    await expect(rateInput).toBeVisible();

    // Type a custom rate
    await rateInput.fill("5.5");
    await rateInput.press("Enter");

    // Should show the user-set value without (suggested)
    await expect(page.getByTestId("interest-badge-d1")).toContainText("5.5% APR");
    await expect(page.getByTestId("interest-badge-d1")).not.toContainText("suggested");

    await captureScreenshot(page, "task-24-interest-edited");
  });

  test("allows editing monthly payment by clicking the badge", async ({ page }) => {
    await page.goto("/");

    // Click the payment badge
    await page.getByTestId("debt-payment-badge-d1").click();

    // Should show edit input
    const paymentInput = page.getByLabel("Edit monthly payment for Car Loan");
    await expect(paymentInput).toBeVisible();

    // Type a payment amount
    await paymentInput.fill("350");
    await paymentInput.press("Enter");

    // Should show the formatted payment badge
    await expect(page.getByTestId("debt-payment-badge-d1")).toContainText("$350/mo");

    await captureScreenshot(page, "task-24-payment-edited");
  });

  test("interest rate persists in URL state after reload", async ({ page }) => {
    await page.goto("/");

    // Set interest rate on Car Loan
    await page.getByTestId("interest-badge-d1").click();
    await page.getByLabel("Edit interest rate for Car Loan").fill("7.5");
    await page.getByLabel("Edit interest rate for Car Loan").press("Enter");

    // Verify interest was set
    await expect(page.getByTestId("interest-badge-d1")).toContainText("7.5% APR");

    // Wait for URL update
    await page.waitForTimeout(500);

    // Reload the page
    const url = page.url();
    await page.goto(url);

    // Interest rate should be preserved
    await expect(page.getByTestId("interest-badge-d1")).toContainText("7.5% APR");
    await expect(page.getByTestId("interest-badge-d1")).not.toContainText("suggested");
  });

  test("monthly payment persists in URL state after reload", async ({ page }) => {
    await page.goto("/");

    // Set payment on Car Loan
    await page.getByTestId("debt-payment-badge-d1").click();
    await page.getByLabel("Edit monthly payment for Car Loan").fill("400");
    await page.getByLabel("Edit monthly payment for Car Loan").press("Enter");

    // Verify payment was set
    await expect(page.getByTestId("debt-payment-badge-d1")).toContainText("$400/mo");

    // Wait for URL update
    await page.waitForTimeout(500);

    // Reload the page
    const url = page.url();
    await page.goto(url);

    // Payment should be preserved
    await expect(page.getByTestId("debt-payment-badge-d1")).toContainText("$400/mo");

    await captureScreenshot(page, "task-24-url-persistence");
  });

  test("detail fields appear for default debt", async ({ page }) => {
    await page.goto("/");

    // Default Car Loan should have detail row
    await expect(page.getByTestId("debt-details-d1")).toBeVisible();

    await captureScreenshot(page, "task-24-detail-fields");
  });
});
