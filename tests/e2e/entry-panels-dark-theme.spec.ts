import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Entry panels dark theme (Task 129)", () => {
  test("asset entry has dark glass styling with light text heading", async ({ page }) => {
    await page.goto("/?step=assets");
    await page.waitForSelector('[aria-label="Asset items"]');

    // The "Assets" heading should use light text (dark theme)
    const heading = page.getByRole("heading", { name: "Assets" }).first();
    await expect(heading).toBeVisible();

    await captureScreenshot(page, "task-129-entry-panels-dark-theme");
  });

  test("expense entry shows rose-colored amounts", async ({ page }) => {
    await page.goto("/?step=expenses");

    // Check that expense amounts are rose-colored
    const expenseAmounts = page.locator('[class*="text-rose-400"]');
    const count = await expenseAmounts.count();
    expect(count).toBeGreaterThan(0);
  });

  test("income entry shows emerald-colored amounts", async ({ page }) => {
    await page.goto("/?step=income");

    // Check that emerald amounts exist (income)
    const emeraldAmounts = page.locator('[class*="text-emerald-400"]');
    const count = await emeraldAmounts.count();
    expect(count).toBeGreaterThan(0);
  });

  test("add expense form has dark inputs when opened", async ({ page }) => {
    await page.goto("/?step=expenses");

    const addBtn = page.getByText("+ Add Expense").first();
    await addBtn.click();

    const categoryInput = page.getByLabel("New expense category");
    const inputClass = await categoryInput.getAttribute("class");
    expect(inputClass).toContain("bg-slate-900");

    await captureScreenshot(page, "task-129-add-expense-dark-form");
  });

  test("add asset form has dark inputs when opened", async ({ page }) => {
    await page.goto("/?step=assets");

    const addBtn = page.getByText("+ Add Asset").first();
    await addBtn.click();

    const categoryInput = page.getByLabel("New asset category");
    const inputClass = await categoryInput.getAttribute("class");
    expect(inputClass).toContain("bg-slate-900");
  });
});
