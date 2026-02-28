import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Investment contributions in expenses", () => {
  test("shows auto-generated Investment Contributions row when assets have contributions", async ({ page }) => {
    await page.goto("/");

    // Default mock data has no contributions, so the row should not appear
    const contributionsRow = page.getByTestId("investment-contributions-row");
    await expect(contributionsRow).not.toBeVisible();

    // Add a monthly contribution to the first asset (Savings Account)
    await page.getByTestId("contribution-badge-a1").click();
    const contributionInput = page.getByLabel("Edit monthly contribution for Savings Account");
    await contributionInput.fill("500");
    await contributionInput.press("Enter");

    // Now the Investment Contributions row should appear in expenses
    await expect(contributionsRow).toBeVisible();
    await expect(contributionsRow).toContainText("Investment Contributions");
    await expect(contributionsRow).toContainText("auto");
    await expect(contributionsRow).toContainText("$500");

    await captureScreenshot(page, "task-35-investment-contributions-row");
  });

  test("surplus metric decreases when contributions are added", async ({ page }) => {
    await page.goto("/");

    // Initial surplus: $6,300 - $2,950 = $3,350
    const surplusCard = page.getByLabel(/Monthly Surplus:/);
    await expect(surplusCard).toContainText("$3,350");

    // Add a $500 contribution to Savings Account
    await page.getByTestId("contribution-badge-a1").click();
    const input = page.getByLabel("Edit monthly contribution for Savings Account");
    await input.fill("500");
    await input.press("Enter");

    // Surplus should now be $6,300 - $2,950 - $500 = $2,850
    await expect(surplusCard).toContainText("$2,850");

    await captureScreenshot(page, "task-35-surplus-with-contributions");
  });

  test("investment contributions row has auto badge and is read-only", async ({ page }) => {
    await page.goto("/");

    // Add a contribution so the row appears
    await page.getByTestId("contribution-badge-a1").click();
    const input = page.getByLabel("Edit monthly contribution for Savings Account");
    await input.fill("1000");
    await input.press("Enter");

    const contributionsRow = page.getByTestId("investment-contributions-row");
    await expect(contributionsRow).toBeVisible();
    await expect(contributionsRow).toContainText("$1,000");

    // The auto row should have the "auto" badge
    const autoBadge = contributionsRow.locator("text=auto");
    await expect(autoBadge).toBeVisible();

    // The auto row should not have a delete button
    const deleteButton = contributionsRow.locator('button[aria-label*="Delete"]');
    await expect(deleteButton).toHaveCount(0);
  });

  test("expense total includes investment contributions", async ({ page }) => {
    await page.goto("/");

    // Add a $1,000 contribution
    await page.getByTestId("contribution-badge-a1").click();
    const input = page.getByLabel("Edit monthly contribution for Savings Account");
    await input.fill("1000");
    await input.press("Enter");

    // The expense section total should include the contribution
    // Default expenses: $2,200 + $600 + $150 = $2,950 + $1,000 contribution = $3,950
    const expenseSection = page.locator("section").filter({ hasText: "Monthly Expenses" });
    await expect(expenseSection.locator("text=Monthly Total: $3,950")).toBeVisible();

    await captureScreenshot(page, "task-35-expense-total-with-contributions");
  });
});
