import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Property mortgage details", () => {
  async function addHome(page: import("@playwright/test").Page) {
    await page.getByText("+ Add Property").click();
    await page.getByLabel("New property name").fill("Home");
    await page.getByLabel("New property value").fill("450000");
    await page.getByLabel("New property mortgage").fill("280000");
    await page.getByLabel("Confirm add property").click();
    await page.waitForSelector("[data-testid^='rate-badge-']");
  }

  test.beforeEach(async ({ page }) => {
    await page.goto("/?step=property");
    await expect(page.getByRole("heading", { name: "Properties" })).toBeVisible();
  });

  test("displays suggested interest rate and payment badges", async ({ page }) => {
    await addHome(page);

    const rateBadge = page.locator("[data-testid^='rate-badge-']").first();
    await expect(rateBadge).toBeVisible();
    await expect(rateBadge).toContainText("5% APR (suggested)");

    const paymentBadge = page.locator("[data-testid^='payment-badge-']").first();
    await expect(paymentBadge).toBeVisible();
    await expect(paymentBadge).toContainText("/mo (suggested)");

    const amortBadge = page.locator("[data-testid^='amort-badge-']").first();
    await expect(amortBadge).toBeVisible();
    await expect(amortBadge).toContainText("Term years");

    await captureScreenshot(page, "task-23-property-suggested-badges");
  });

  test("can edit interest rate inline", async ({ page }) => {
    await addHome(page);

    await page.locator("[data-testid^='rate-badge-']").first().click();
    const input = page.getByLabel("Edit interest rate for Home");
    await expect(input).toBeVisible();
    await input.fill("4.5");
    await input.press("Enter");

    const rateBadge = page.locator("[data-testid^='rate-badge-']").first();
    await expect(rateBadge).toContainText("4.5% APR");
    await expect(rateBadge).not.toContainText("suggested");

    await captureScreenshot(page, "task-23-interest-rate-edited");
  });

  test("can edit monthly payment inline", async ({ page }) => {
    await addHome(page);

    await page.locator("[data-testid^='payment-badge-']").first().click();
    const input = page.getByLabel("Edit monthly payment for Home");
    await expect(input).toBeVisible();
    await input.fill("1800");
    await input.press("Enter");

    const paymentBadge = page.locator("[data-testid^='payment-badge-']").first();
    await expect(paymentBadge).toContainText("$1,800/mo");
    await expect(paymentBadge).not.toContainText("suggested");

    await captureScreenshot(page, "task-23-monthly-payment-edited");
  });

  test("can edit amortization years inline", async ({ page }) => {
    await addHome(page);

    await page.locator("[data-testid^='amort-badge-']").first().click();
    const input = page.getByLabel("Edit amortization years for Home");
    await expect(input).toBeVisible();
    await input.fill("20");
    await input.press("Enter");

    const amortBadge = page.locator("[data-testid^='amort-badge-']").first();
    await expect(amortBadge).toContainText("20yr term");

    await captureScreenshot(page, "task-23-amortization-edited");
  });

  test("shows computed mortgage breakdown when payment is set", async ({ page }) => {
    await addHome(page);

    // Set interest rate
    await page.locator("[data-testid^='rate-badge-']").first().click();
    await page.getByLabel("Edit interest rate for Home").fill("5");
    await page.getByLabel("Edit interest rate for Home").press("Enter");

    // Set monthly payment
    await page.locator("[data-testid^='payment-badge-']").first().click();
    await page.getByLabel("Edit monthly payment for Home").fill("1636");
    await page.getByLabel("Edit monthly payment for Home").press("Enter");

    // Computed info should appear
    const mortgageInfo = page.locator("[data-testid^='mortgage-info-']").first();
    await expect(mortgageInfo).toBeVisible();
    await expect(mortgageInfo).toContainText("Current month: interest");
    await expect(mortgageInfo).toContainText("Current month: principal");
    await expect(mortgageInfo).toContainText("Total interest remaining");
    await expect(mortgageInfo).toContainText("Estimated payoff");
    await expect(mortgageInfo).toContainText("First year avg interest");
    await expect(mortgageInfo).toContainText("Last year avg interest");

    // View schedule button should be visible
    const viewScheduleBtn = page.locator("[data-testid^='view-schedule-']").first();
    await expect(viewScheduleBtn).toBeVisible();
    await expect(viewScheduleBtn).toContainText("View schedule");

    await captureScreenshot(page, "task-34-mortgage-breakdown-relabeled");
  });

  test("can expand and collapse amortization schedule", async ({ page }) => {
    await addHome(page);

    // Set interest rate and payment
    await page.locator("[data-testid^='rate-badge-']").first().click();
    await page.getByLabel("Edit interest rate for Home").fill("5");
    await page.getByLabel("Edit interest rate for Home").press("Enter");

    await page.locator("[data-testid^='payment-badge-']").first().click();
    await page.getByLabel("Edit monthly payment for Home").fill("1636");
    await page.getByLabel("Edit monthly payment for Home").press("Enter");

    // Click "View schedule"
    const viewScheduleBtn = page.locator("[data-testid^='view-schedule-']").first();
    await viewScheduleBtn.click();

    // Table should appear
    const scheduleTable = page.locator("[data-testid^='schedule-table-']").first();
    await expect(scheduleTable).toBeVisible();
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
    await addHome(page);

    // Set very high interest rate
    await page.locator("[data-testid^='rate-badge-']").first().click();
    await page.getByLabel("Edit interest rate for Home").fill("10");
    await page.getByLabel("Edit interest rate for Home").press("Enter");

    // Set low monthly payment (less than interest)
    await page.locator("[data-testid^='payment-badge-']").first().click();
    await page.getByLabel("Edit monthly payment for Home").fill("500");
    await page.getByLabel("Edit monthly payment for Home").press("Enter");

    // Warning should appear
    const warning = page.locator("[data-testid^='mortgage-warning-']").first();
    await expect(warning).toBeVisible();
    await expect(warning).toContainText("Payment doesn't cover monthly interest");

    await captureScreenshot(page, "task-23-mortgage-payment-warning");
  });

  test("property mortgage details persist via URL state", async ({ page }) => {
    await addHome(page);

    // Set interest rate and payment
    await page.locator("[data-testid^='rate-badge-']").first().click();
    await page.getByLabel("Edit interest rate for Home").fill("4.5");
    await page.getByLabel("Edit interest rate for Home").press("Enter");

    await page.locator("[data-testid^='payment-badge-']").first().click();
    await page.getByLabel("Edit monthly payment for Home").fill("1550");
    await page.getByLabel("Edit monthly payment for Home").press("Enter");

    await page.locator("[data-testid^='amort-badge-']").first().click();
    await page.getByLabel("Edit amortization years for Home").fill("20");
    await page.getByLabel("Edit amortization years for Home").press("Enter");

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Reload and verify persistence
    await page.reload();
    await expect(page.getByRole("heading", { name: "Properties" })).toBeVisible();

    await expect(page.locator("[data-testid^='rate-badge-']").first()).toContainText("4.5% APR");
    await expect(page.locator("[data-testid^='payment-badge-']").first()).toContainText("/mo");
    await expect(page.locator("[data-testid^='amort-badge-']").first()).toContainText("20yr term");

    await captureScreenshot(page, "task-23-mortgage-details-persisted");
  });
});
