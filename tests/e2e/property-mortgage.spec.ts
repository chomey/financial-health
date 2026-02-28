import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Property mortgage details", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=Property");
  });

  test("displays suggested interest rate and payment badges", async ({ page }) => {
    // Default property should show suggested badges
    const rateBadge = page.getByTestId("rate-badge-p1");
    await expect(rateBadge).toBeVisible();
    await expect(rateBadge).toContainText("5% APR (suggested)");

    const paymentBadge = page.getByTestId("payment-badge-p1");
    await expect(paymentBadge).toBeVisible();
    await expect(paymentBadge).toContainText("/mo (suggested)");

    const amortBadge = page.getByTestId("amort-badge-p1");
    await expect(amortBadge).toBeVisible();
    await expect(amortBadge).toContainText("Term years");

    await captureScreenshot(page, "task-23-property-suggested-badges");
  });

  test("can edit interest rate inline", async ({ page }) => {
    await page.getByTestId("rate-badge-p1").click();
    const input = page.getByLabel("Edit interest rate for Home");
    await expect(input).toBeVisible();
    await input.fill("4.5");
    await input.press("Enter");

    // Badge should now show active value
    const rateBadge = page.getByTestId("rate-badge-p1");
    await expect(rateBadge).toContainText("4.5% APR");
    // Should not say "suggested" anymore
    await expect(rateBadge).not.toContainText("suggested");

    await captureScreenshot(page, "task-23-interest-rate-edited");
  });

  test("can edit monthly payment inline", async ({ page }) => {
    await page.getByTestId("payment-badge-p1").click();
    const input = page.getByLabel("Edit monthly payment for Home");
    await expect(input).toBeVisible();
    await input.fill("1800");
    await input.press("Enter");

    const paymentBadge = page.getByTestId("payment-badge-p1");
    await expect(paymentBadge).toContainText("$1,800/mo");
    await expect(paymentBadge).not.toContainText("suggested");

    await captureScreenshot(page, "task-23-monthly-payment-edited");
  });

  test("can edit amortization years inline", async ({ page }) => {
    await page.getByTestId("amort-badge-p1").click();
    const input = page.getByLabel("Edit amortization years for Home");
    await expect(input).toBeVisible();
    await input.fill("20");
    await input.press("Enter");

    const amortBadge = page.getByTestId("amort-badge-p1");
    await expect(amortBadge).toContainText("20yr term");

    await captureScreenshot(page, "task-23-amortization-edited");
  });

  test("shows computed mortgage breakdown when payment is set", async ({ page }) => {
    // Set interest rate
    await page.getByTestId("rate-badge-p1").click();
    await page.getByLabel("Edit interest rate for Home").fill("5");
    await page.getByLabel("Edit interest rate for Home").press("Enter");

    // Set monthly payment
    await page.getByTestId("payment-badge-p1").click();
    await page.getByLabel("Edit monthly payment for Home").fill("1636");
    await page.getByLabel("Edit monthly payment for Home").press("Enter");

    // Computed info should appear
    const mortgageInfo = page.getByTestId("mortgage-info-p1");
    await expect(mortgageInfo).toBeVisible();
    await expect(mortgageInfo).toContainText("Current month: interest");
    await expect(mortgageInfo).toContainText("Current month: principal");
    await expect(mortgageInfo).toContainText("Total interest remaining");
    await expect(mortgageInfo).toContainText("Estimated payoff");
    await expect(mortgageInfo).toContainText("First year avg interest");
    await expect(mortgageInfo).toContainText("Last year avg interest");

    // View schedule button should be visible
    const viewScheduleBtn = page.getByTestId("view-schedule-p1");
    await expect(viewScheduleBtn).toBeVisible();
    await expect(viewScheduleBtn).toContainText("View schedule");

    await captureScreenshot(page, "task-34-mortgage-breakdown-relabeled");
  });

  test("can expand and collapse amortization schedule", async ({ page }) => {
    // Set interest rate and payment
    await page.getByTestId("rate-badge-p1").click();
    await page.getByLabel("Edit interest rate for Home").fill("5");
    await page.getByLabel("Edit interest rate for Home").press("Enter");

    await page.getByTestId("payment-badge-p1").click();
    await page.getByLabel("Edit monthly payment for Home").fill("1636");
    await page.getByLabel("Edit monthly payment for Home").press("Enter");

    // Click "View schedule"
    const viewScheduleBtn = page.getByTestId("view-schedule-p1");
    await viewScheduleBtn.click();

    // Table should appear
    const scheduleTable = page.getByTestId("schedule-table-p1");
    await expect(scheduleTable).toBeVisible();
    // Should have year-by-year rows with Interest/Principal/Balance headers
    await expect(scheduleTable).toContainText("Year");
    await expect(scheduleTable).toContainText("Interest");
    await expect(scheduleTable).toContainText("Principal");
    await expect(scheduleTable).toContainText("Balance");

    // Button text should change to "Hide schedule"
    await expect(viewScheduleBtn).toContainText("Hide schedule");

    await captureScreenshot(page, "task-34-amortization-schedule-expanded");

    // Click again to collapse
    await viewScheduleBtn.click();
    await expect(scheduleTable).not.toBeVisible();
    await expect(viewScheduleBtn).toContainText("View schedule");
  });

  test("shows warning when payment is too low", async ({ page }) => {
    // Set very high interest rate
    await page.getByTestId("rate-badge-p1").click();
    await page.getByLabel("Edit interest rate for Home").fill("10");
    await page.getByLabel("Edit interest rate for Home").press("Enter");

    // Set low monthly payment (less than interest)
    await page.getByTestId("payment-badge-p1").click();
    await page.getByLabel("Edit monthly payment for Home").fill("500");
    await page.getByLabel("Edit monthly payment for Home").press("Enter");

    // Warning should appear
    const warning = page.getByTestId("mortgage-warning-p1");
    await expect(warning).toBeVisible();
    await expect(warning).toContainText("Payment doesn't cover monthly interest");

    await captureScreenshot(page, "task-23-mortgage-payment-warning");
  });

  test("property mortgage details persist via URL state", async ({ page }) => {
    // Set interest rate and payment
    await page.getByTestId("rate-badge-p1").click();
    await page.getByLabel("Edit interest rate for Home").fill("4.5");
    await page.getByLabel("Edit interest rate for Home").press("Enter");

    await page.getByTestId("payment-badge-p1").click();
    await page.getByLabel("Edit monthly payment for Home").fill("1550");
    await page.getByLabel("Edit monthly payment for Home").press("Enter");

    await page.getByTestId("amort-badge-p1").click();
    await page.getByLabel("Edit amortization years for Home").fill("20");
    await page.getByLabel("Edit amortization years for Home").press("Enter");

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Reload and verify persistence
    await page.reload();
    await page.waitForSelector("text=Property");

    await expect(page.getByTestId("rate-badge-p1")).toContainText("4.5% APR");
    await expect(page.getByTestId("payment-badge-p1")).toContainText("$1,550/mo");
    await expect(page.getByTestId("amort-badge-p1")).toContainText("20yr term");

    await captureScreenshot(page, "task-23-mortgage-details-persisted");
  });
});
