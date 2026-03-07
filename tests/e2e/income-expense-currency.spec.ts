import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Income/Expense foreign currency support", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Open Income section
    const incomeSection = page.getByRole("button", { name: /income/i }).first();
    await incomeSection.click();
  });

  test("currency badge appears on income items", async ({ page }) => {
    // Income section should have a currency badge for each item
    const badges = page.getByTestId("currency-badge");
    const count = await badges.count();
    expect(count).toBeGreaterThan(0);

    await captureScreenshot(page, "task-124-income-currency-badge");
  });

  test("income currency badge shows home currency (CAD) by default", async ({ page }) => {
    const badge = page.getByTestId("currency-badge").first();
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText("CAD");
  });

  test("clicking income currency badge toggles to foreign currency (USD)", async ({ page }) => {
    const badge = page.getByTestId("currency-badge").first();
    await badge.click();
    await expect(badge).toHaveText("USD");

    await captureScreenshot(page, "task-124-income-currency-toggled");
  });

  test("converted amount appears when income switched to foreign currency", async ({ page }) => {
    const badge = page.getByTestId("currency-badge").first();
    await badge.click();
    // After toggle to USD, the converted amount (≈ ...) should appear
    const converted = page.getByTestId("currency-converted").first();
    await expect(converted).toBeVisible();

    await captureScreenshot(page, "task-124-income-currency-converted");
  });

  test("expense section also shows currency badge", async ({ page }) => {
    // Open Expenses section
    const expenseSection = page.getByRole("button", { name: /expenses/i }).first();
    await expenseSection.click();

    const expenseBadges = page.getByTestId("currency-badge");
    const count = await expenseBadges.count();
    expect(count).toBeGreaterThan(0);

    await captureScreenshot(page, "task-124-expense-currency-badge");
  });

  test("clicking expense currency badge toggles to USD", async ({ page }) => {
    // Open Expenses section
    const expenseSection = page.getByRole("button", { name: /expenses/i }).first();
    await expenseSection.click();

    const badge = page.getByTestId("currency-badge").first();
    await badge.click();
    await expect(badge).toHaveText("USD");

    await captureScreenshot(page, "task-124-expense-currency-toggled");
  });
});
