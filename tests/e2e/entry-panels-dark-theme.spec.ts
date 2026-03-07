import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Entry panels dark theme (Task 129)", () => {
  test("asset entry panel has dark glass card styling", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    // The "Assets" heading should use light text (dark theme)
    const heading = page.getByRole("heading", { name: "Assets" }).first();
    await expect(heading).toHaveClass(/text-slate-200/);

    await captureScreenshot(page, "task-129-entry-panels-dark-theme");
  });

  test("entry panels screenshot - full page", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(800);
    await captureScreenshot(page, "task-129-full-page-dark-entry-panels");
  });

  test("expense entry shows rose-colored amounts", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    // Check that expense amounts are rose-colored (not amber)
    const expenseAmounts = page.locator('[class*="text-rose-400"]');
    const count = await expenseAmounts.count();
    expect(count).toBeGreaterThan(0);
  });

  test("income entry shows emerald-colored amounts", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    // Check that emerald amounts exist (income)
    const emeraldAmounts = page.locator('[class*="text-emerald-400"]');
    const count = await emeraldAmounts.count();
    expect(count).toBeGreaterThan(0);
  });

  test("add expense form has dark inputs when opened", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    // Click "Add Expense" button
    const addBtn = page.getByText("+ Add Expense").first();
    await addBtn.click();
    await page.waitForTimeout(200);

    // The new expense category input should have dark bg
    const categoryInput = page.getByLabel("New expense category");
    const inputClass = await categoryInput.getAttribute("class");
    expect(inputClass).toContain("bg-slate-900");
    expect(inputClass).toContain("border-cyan-500/50");

    await captureScreenshot(page, "task-129-add-expense-dark-form");
  });

  test("add asset form has dark inputs when opened", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    const addBtn = page.getByText("+ Add Asset").first();
    await addBtn.click();
    await page.waitForTimeout(200);

    const categoryInput = page.getByLabel("New asset category");
    const inputClass = await categoryInput.getAttribute("class");
    expect(inputClass).toContain("bg-slate-900");
    expect(inputClass).toContain("border-cyan-500/50");
  });
});
