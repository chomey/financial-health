import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Investment returns auto-computed in Income section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("auto-computed section appears in Income panel with default assets", async ({ page }) => {
    // Default state has TFSA, RRSP, and Savings Account with non-zero ROI
    const autoSection = page.getByTestId("investment-returns-auto-section");
    await expect(autoSection).toBeVisible();

    await captureScreenshot(page, "task-121-auto-returns-section");
  });

  test("shows 'Auto-computed' heading in Income panel", async ({ page }) => {
    await expect(page.getByTestId("investment-returns-auto-section")).toContainText("Auto-computed");
  });

  test("shows investment return rows with correct labels", async ({ page }) => {
    // Default INITIAL_STATE has TFSA, RRSP, Savings Account - all with ROI
    await expect(page.getByText("TFSA returns")).toBeVisible();
    await expect(page.getByText("RRSP returns")).toBeVisible();
    await expect(page.getByText("Savings Account returns")).toBeVisible();

    await captureScreenshot(page, "task-121-auto-return-labels");
  });

  test("each auto row shows an 'auto' badge", async ({ page }) => {
    const autoSection = page.getByTestId("investment-returns-auto-section");
    await expect(autoSection).toBeVisible();
    const rows = page.getByTestId("investment-return-row");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Each row should have an "auto" badge
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText("auto");
    }
  });

  test("auto row amounts are shown in green text", async ({ page }) => {
    const firstRow = page.getByTestId("investment-return-row").first();
    await expect(firstRow).toBeVisible();
    // Amount span should have green class
    const amountEl = firstRow.locator("span.text-green-600");
    await expect(amountEl).toBeVisible();
  });

  test("monthly total includes investment returns", async ({ page }) => {
    // With default data: Salary $4,500 + investment returns from TFSA/RRSP/Savings
    // Total should be greater than $4,500 - verify auto section contributes to total
    const totalEl = page.getByTestId("income-monthly-total");
    await expect(totalEl).toBeVisible();
    const text = await totalEl.textContent();
    // Extract numeric value - strip non-digit chars except dot
    const numeric = parseFloat((text ?? "0").replace(/[^0-9.]/g, ""));
    expect(numeric).toBeGreaterThan(4500);

    await captureScreenshot(page, "task-121-monthly-total-with-returns");
  });

  test("auto rows are read-only (no delete buttons)", async ({ page }) => {
    const rows = page.getByTestId("investment-return-row");
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      // No delete button inside auto rows
      await expect(row.locator("button")).not.toBeVisible();
    }
  });

  test("manual income items still appear alongside auto rows", async ({ page }) => {
    // Default income has Salary $4,500 - use role selector to avoid ambiguity
    await expect(page.getByRole("button", { name: "Edit category for Salary" })).toBeVisible();
    // Auto rows also present
    await expect(page.getByTestId("investment-returns-auto-section")).toBeVisible();

    await captureScreenshot(page, "task-121-manual-plus-auto-income");
  });
});
