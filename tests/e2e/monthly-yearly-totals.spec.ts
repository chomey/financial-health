import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Monthly and yearly dual totals", () => {
  test("income section footer shows both monthly and yearly testids", async ({ page }) => {
    await page.goto("/?step=income");

    await expect(page.getByTestId("income-monthly-total")).toBeVisible();
    await expect(page.getByTestId("income-yearly-total")).toBeVisible();

    const monthlyText = await page.getByTestId("income-monthly-total").textContent();
    const yearlyText = await page.getByTestId("income-yearly-total").textContent();
    expect(monthlyText).toMatch(/^\$[\d,]+$/);
    expect(yearlyText).toMatch(/^\$[\d,]+$/);

    await captureScreenshot(page, "task-126-income-dual-totals");
  });

  test("income section footer contains Monthly, pipe, and Yearly labels", async ({ page }) => {
    await page.goto("/?step=income");

    const monthlyEl = page.getByTestId("income-monthly-total");
    const parentSpan = monthlyEl.locator("..");
    await expect(parentSpan).toContainText("Monthly:");
    await expect(parentSpan).toContainText("Yearly:");
    await expect(parentSpan).toContainText("|");
  });

  test("income items show /mo and /yr suffixes", async ({ page }) => {
    await page.goto("/?step=income");

    const incomeList = page.getByRole("list", { name: "Income items" });
    await expect(incomeList.locator("text=/\\/mo/").first()).toBeVisible();
    await expect(incomeList.locator("text=/\\/yr/").first()).toBeVisible();

    await captureScreenshot(page, "task-126-income-item-dual-amounts");
  });

  test("expense section shows both monthly and yearly testids", async ({ page }) => {
    await page.goto("/?step=expenses");

    // No toggle
    const toggle = page.getByTestId("expense-view-toggle");
    await expect(toggle).toHaveCount(0);

    await expect(page.getByTestId("expense-monthly-total")).toBeVisible();
    await expect(page.getByTestId("expense-yearly-total")).toBeVisible();

    await captureScreenshot(page, "task-126-expense-dual-totals");
  });

  test("expense items show /mo and /yr suffixes", async ({ page }) => {
    await page.goto("/?step=expenses");

    const expenseList = page.getByRole("list", { name: "Expense items" });
    await expect(expenseList.locator("text=/\\/mo/").first()).toBeVisible();
    await expect(expenseList.locator("text=/\\/yr/").first()).toBeVisible();

    await captureScreenshot(page, "task-126-expense-item-dual-amounts");
  });
});
