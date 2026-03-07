import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Monthly and yearly dual totals", () => {
  test("income section footer shows both monthly and yearly testids", async ({ page }) => {
    await page.goto("/");

    // Both testids are present and visible
    await expect(page.getByTestId("income-monthly-total")).toBeVisible();
    await expect(page.getByTestId("income-yearly-total")).toBeVisible();

    // Both should contain dollar amounts
    const monthlyText = await page.getByTestId("income-monthly-total").textContent();
    const yearlyText = await page.getByTestId("income-yearly-total").textContent();
    expect(monthlyText).toMatch(/^\$[\d,]+$/);
    expect(yearlyText).toMatch(/^\$[\d,]+$/);

    await captureScreenshot(page, "task-126-income-dual-totals");
  });

  test("income section footer contains Monthly, pipe, and Yearly labels", async ({ page }) => {
    await page.goto("/");

    const monthlyEl = page.getByTestId("income-monthly-total");
    const parentSpan = monthlyEl.locator("..");
    await expect(parentSpan).toContainText("Monthly:");
    await expect(parentSpan).toContainText("Yearly:");
    await expect(parentSpan).toContainText("|");
  });

  test("income items show /mo and /yr suffixes", async ({ page }) => {
    await page.goto("/");

    const incomeSection = page.locator("section", { has: page.getByRole("heading", { name: "Income" }) }).first();
    await expect(incomeSection.locator("text=/\\/mo/").first()).toBeVisible();
    await expect(incomeSection.locator("text=/\\/yr/").first()).toBeVisible();

    await captureScreenshot(page, "task-126-income-item-dual-amounts");
  });

  test("expense section has no toggle and shows both monthly and yearly testids", async ({ page }) => {
    await page.goto("/");

    // No toggle — it should not exist or not be visible
    const toggle = page.getByTestId("expense-view-toggle");
    await expect(toggle).toHaveCount(0);

    // Both testids visible
    await expect(page.getByTestId("expense-monthly-total")).toBeVisible();
    await expect(page.getByTestId("expense-yearly-total")).toBeVisible();

    await captureScreenshot(page, "task-126-expense-dual-totals");
  });

  test("expense items show /mo and /yr suffixes", async ({ page }) => {
    await page.goto("/");

    const expenseSection = page.locator("section", { has: page.getByRole("heading", { name: "Expenses" }) }).first();
    await expect(expenseSection.locator("text=/\\/mo/").first()).toBeVisible();
    await expect(expenseSection.locator("text=/\\/yr/").first()).toBeVisible();

    await captureScreenshot(page, "task-126-expense-item-dual-amounts");
  });

  test("full page: both income and expense dual totals visible", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByTestId("income-monthly-total")).toBeVisible();
    await expect(page.getByTestId("income-yearly-total")).toBeVisible();
    await expect(page.getByTestId("expense-monthly-total")).toBeVisible();
    await expect(page.getByTestId("expense-yearly-total")).toBeVisible();

    await captureScreenshot(page, "task-126-full-page-dual-totals");
  });
});
