import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

/**
 * Helper to navigate between wizard steps while preserving URL state (s= param).
 */
async function goToStep(page: import("@playwright/test").Page, step: string) {
  const url = new URL(page.url());
  url.searchParams.set("step", step);
  await page.goto(url.toString());
}

test.describe("Net worth milestone and percentile insights", () => {
  async function setAge(page: import("@playwright/test").Page, age: string) {
    await goToStep(page, "profile");
    const ageInput = page.getByTestId("wizard-age-input");
    await expect(ageInput).toBeVisible({ timeout: 3000 });
    await ageInput.fill(age);
    await ageInput.press("Tab"); // trigger onChange
    await page.waitForTimeout(500);
  }

  async function addAsset(page: import("@playwright/test").Page, name: string, amount: string) {
    await goToStep(page, "assets");
    await page.click('text="+ Add Asset"');
    await page.fill('[aria-label="New asset category"]', name);
    await page.fill('[aria-label="New asset amount"]', amount);
    await page.click('[aria-label="Confirm add asset"]');
    await page.waitForTimeout(500);
  }

  /**
   * Clear debts, expenses, and income to minimize competing insights,
   * ensuring net-worth-milestone and net-worth-percentile appear in top 8.
   */
  async function simplifyState(page: import("@playwright/test").Page) {
    // Remove debt
    await goToStep(page, "debts");
    const debtsList = page.getByRole("list", { name: "Debt items" });
    const carLoan = debtsList.getByRole("listitem").filter({ hasText: "Car Loan" });
    if (await carLoan.isVisible({ timeout: 1000 }).catch(() => false)) {
      await carLoan.getByLabel("Delete Car Loan").click();
      await page.waitForTimeout(300);
    }

    // Remove expenses
    await goToStep(page, "expenses");
    const expenseList = page.getByRole("list", { name: "Expense items" });
    let expenseCount = await expenseList.getByRole("listitem").count();
    while (expenseCount > 0) {
      const deleteBtn = expenseList.getByRole("listitem").first().getByRole("button", { name: /^Delete / });
      if (await deleteBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await deleteBtn.click();
        await page.waitForTimeout(200);
      }
      expenseCount = await expenseList.getByRole("listitem").count();
    }

    // Remove income
    await goToStep(page, "income");
    const incomeList = page.getByRole("list", { name: "Income items" });
    let incomeCount = await incomeList.getByRole("listitem").count();
    while (incomeCount > 0) {
      const deleteBtn = incomeList.getByRole("listitem").first().getByRole("button", { name: /^Delete / });
      if (await deleteBtn.isVisible({ timeout: 500 }).catch(() => false)) {
        await deleteBtn.click();
        await page.waitForTimeout(200);
      }
      incomeCount = await incomeList.getByRole("listitem").count();
    }
  }

  test("shows net-worth-milestone insight for positive net worth", async ({ page }) => {
    // INITIAL_STATE NW = $50k. Add $100k to reach $100k milestone
    await page.goto("/?step=assets");
    await addAsset(page, "Portfolio", "100000");
    await simplifyState(page);

    await goToStep(page, "dashboard");
    await page.waitForTimeout(2000);

    const milestone = page.locator('[data-insight-type="net-worth-milestone"]');
    await expect(milestone).toBeVisible({ timeout: 8000 });
    const text = await milestone.textContent();
    expect(text).toContain("$100k");

    await captureScreenshot(page, "task-138-net-worth-milestone");
  });

  test("shows $1M milestone for millionaire net worth", async ({ page }) => {
    await page.goto("/?step=assets");
    await addAsset(page, "Portfolio", "1200000");
    await simplifyState(page);

    await goToStep(page, "dashboard");
    await page.waitForTimeout(2000);

    const milestone = page.locator('[data-insight-type="net-worth-milestone"]');
    await expect(milestone).toBeVisible({ timeout: 8000 });
    const text = await milestone.textContent();
    expect(text).toContain("Millionaire");
  });

  test("shows net-worth-percentile insight when age is set", async ({ page }) => {
    await page.goto("/?step=assets");
    await addAsset(page, "Investments", "150000");
    await simplifyState(page);
    await setAge(page, "30");

    await goToStep(page, "dashboard");
    await page.waitForTimeout(2000);

    const percentile = page.locator('[data-insight-type="net-worth-percentile"]');
    await expect(percentile).toBeVisible({ timeout: 8000 });
    const text = await percentile.textContent();
    expect(text).toContain("above the median");
    expect(text).toContain("Under 35");

    await captureScreenshot(page, "task-138-net-worth-percentile-above");
  });

  test("shows below-median percentile insight for lower net worth", async ({ page }) => {
    // INITIAL_STATE NW = $50k. Set age 50, 45-54 median = $247k
    await page.goto("/?step=dashboard");
    await simplifyState(page);
    await setAge(page, "50");

    await goToStep(page, "dashboard");
    await page.waitForTimeout(2000);

    const percentile = page.locator('[data-insight-type="net-worth-percentile"]');
    await expect(percentile).toBeVisible({ timeout: 8000 });
    const text = await percentile.textContent();
    expect(text).toContain("45–54");

    await captureScreenshot(page, "task-138-net-worth-percentile-below");
  });

  test("percentile insight not shown without age", async ({ page }) => {
    await page.goto("/?step=dashboard");
    await page.waitForSelector('[data-testid="insights-panel"]');

    const percentile = page.locator('[data-insight-type="net-worth-percentile"]');
    await expect(percentile).not.toBeVisible({ timeout: 2000 });
  });

  test("milestone and percentile icons are correct", async ({ page }) => {
    await page.goto("/?step=assets");
    await addAsset(page, "Savings Extra", "50000");
    await simplifyState(page);
    await setAge(page, "35");

    await goToStep(page, "dashboard");
    await page.waitForTimeout(2000);

    const milestone = page.locator('[data-insight-type="net-worth-milestone"]');
    await expect(milestone).toBeVisible({ timeout: 8000 });
    await expect(milestone).toContainText("🏆");

    const percentile = page.locator('[data-insight-type="net-worth-percentile"]');
    await expect(percentile).toBeVisible({ timeout: 8000 });
    await expect(percentile).toContainText("📊");
  });
});
