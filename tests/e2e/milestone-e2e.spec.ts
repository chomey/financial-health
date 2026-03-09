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

test.describe("T3: Milestone — Comprehensive end-to-end user journey", () => {
  test("full financial snapshot lifecycle: add data, verify metrics, copy URL, reload", async ({
    page,
    context,
  }) => {
    // Grant clipboard permissions for Copy Link test
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // ========================================
    // Step 1: Verify initial state on dashboard
    // ========================================
    await page.goto("/?step=dashboard");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // INITIAL_STATE: Assets $55k, Debts $5k → NW $50k
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("$50,000");

    await captureScreenshot(page, "task-15-initial-state");

    // ========================================
    // Step 2: Add 3 new assets
    // ========================================
    await goToStep(page, "assets");
    const assetsList = page.getByRole("list", { name: "Asset items" });

    // Verify initial assets
    await expect(assetsList).toContainText("Savings Account");
    await expect(assetsList).toContainText("TFSA");
    await expect(assetsList).toContainText("RRSP");

    // Asset 1: Emergency Fund $10,000
    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Emergency Fund");
    await page.getByLabel("New asset amount").fill("10000");
    await page.getByLabel("Confirm add asset").click();
    await expect(assetsList).toContainText("Emergency Fund");

    // Asset 2: Roth IRA $25,000
    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Roth IRA");
    await page.getByLabel("New asset amount").fill("25000");
    await page.getByLabel("Confirm add asset").click();
    await expect(assetsList).toContainText("Roth IRA");

    // Asset 3: HSA $5,000
    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("HSA");
    await page.getByLabel("New asset amount").fill("5000");
    await page.getByLabel("Confirm add asset").click();
    await expect(assetsList).toContainText("HSA");

    // Verify net worth updated: NW = (55k + 10k + 25k + 5k) - 5k = $90,000
    await goToStep(page, "dashboard");
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("$90,000");

    await captureScreenshot(page, "task-15-after-adding-assets");

    // ========================================
    // Step 3: Add 2 new debts
    // ========================================
    await goToStep(page, "debts");
    const debtsList = page.getByRole("list", { name: "Debt items" });
    await expect(debtsList).toContainText("Car Loan");

    // Debt 1: Student Loan $30,000
    await page.getByText("+ Add Debt").click();
    await page.getByLabel("New debt category").fill("Student Loan");
    const debtAmount1 = page.getByLabel("New debt amount");
    await debtAmount1.fill("30000");
    await debtAmount1.press("Enter");
    await expect(debtsList).toContainText("Student Loan");

    // Debt 2: Credit Card $5,000
    await page.getByText("+ Add Debt").click();
    await page.getByLabel("New debt category").fill("Credit Card");
    const debtAmount2 = page.getByLabel("New debt amount");
    await debtAmount2.fill("5000");
    await debtAmount2.press("Enter");
    await expect(debtsList).toContainText("Credit Card");

    expect(await debtsList.getByRole("listitem").count()).toBe(3);

    await captureScreenshot(page, "task-15-after-adding-debts");

    // ========================================
    // Step 4: Add income and expenses
    // ========================================
    await goToStep(page, "income");
    const incomeList = page.getByRole("list", { name: "Income items" });

    await page.getByText("+ Add Income").click();
    await page.getByLabel("New income category").fill("Side Hustle");
    await page.getByLabel("New income amount").fill("1500");
    await page.getByLabel("Confirm add income").click();
    await expect(incomeList).toContainText("Side Hustle");

    await goToStep(page, "expenses");
    const expenseList = page.getByRole("list", { name: "Expense items" });

    // Add expense: Insurance $200
    await page.getByText("+ Add Expense").click();
    await page.getByLabel("New expense category").fill("Insurance");
    await page.getByLabel("New expense amount").fill("200");
    await page.getByLabel("Confirm add expense").click();
    await expect(expenseList).toContainText("Insurance");

    // Add expense: Gym $50
    await page.getByText("+ Add Expense").click();
    await page.getByLabel("New expense category").fill("Gym");
    await page.getByLabel("New expense amount").fill("50");
    await page.getByLabel("Confirm add expense").click();
    await expect(expenseList).toContainText("Gym");

    await captureScreenshot(page, "task-15-after-income-expenses");

    // ========================================
    // Step 5: Verify dashboard metrics are correct
    // ========================================
    await goToStep(page, "dashboard");

    await expect(dashboard.getByRole("group", { name: "Net Worth" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Monthly Cash Flow" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Financial Runway" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Debt-to-Asset Ratio" })).toBeVisible();

    // Verify insights panel is present with cards
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();
    const insightCards = insightsPanel.getByRole("article");
    expect(await insightCards.count()).toBeGreaterThanOrEqual(3);

    await captureScreenshot(page, "task-15-dashboard-metrics");

    // ========================================
    // Step 6: Copy the URL
    // ========================================
    await page.waitForFunction(() => window.location.search.includes("s="));
    const urlBeforeCopy = page.url();

    const copyButton = page.getByRole("button", { name: "Copy link to clipboard" });
    await copyButton.click();
    // Button shows a green checkmark SVG after copying (no text)
    await expect(copyButton.locator("svg.text-emerald-500")).toBeVisible();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain("s=");
    expect(clipboardText).toBe(urlBeforeCopy);

    await captureScreenshot(page, "task-15-copy-link");

    // ========================================
    // Step 7: Reload the page and verify data preserved
    // ========================================
    const stateUrl = page.url();
    await page.goto(stateUrl);
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // Dashboard metrics should still be present
    const dashboardAfterReload = page.locator('[data-testid="snapshot-dashboard"]');
    await expect(dashboardAfterReload.getByRole("group", { name: "Net Worth" })).toBeVisible();

    // Verify entries persisted by navigating to wizard steps
    await goToStep(page, "assets");
    const assetsListAfterReload = page.getByRole("list", { name: "Asset items" });
    await expect(assetsListAfterReload).toContainText("Savings Account");
    await expect(assetsListAfterReload).toContainText("TFSA");
    await expect(assetsListAfterReload).toContainText("RRSP");
    await expect(assetsListAfterReload).toContainText("Emergency Fund");
    await expect(assetsListAfterReload).toContainText("Roth IRA");
    await expect(assetsListAfterReload).toContainText("HSA");

    await goToStep(page, "debts");
    const debtsListAfterReload = page.getByRole("list", { name: "Debt items" });
    await expect(debtsListAfterReload).toContainText("Car Loan");
    await expect(debtsListAfterReload).toContainText("Student Loan");

    await goToStep(page, "income");
    const incomeListAfterReload = page.getByRole("list", { name: "Income items" });
    await expect(incomeListAfterReload).toContainText("Salary");
    await expect(incomeListAfterReload).toContainText("Side Hustle");

    await goToStep(page, "expenses");
    const expenseListAfterReload = page.getByRole("list", { name: "Expense items" });
    await expect(expenseListAfterReload).toContainText("Rent/Mortgage Payment");
    await expect(expenseListAfterReload).toContainText("Groceries");
    await expect(expenseListAfterReload).toContainText("Subscriptions");

    await captureScreenshot(page, "task-15-after-reload");
    await captureScreenshot(page, "task-15-final-state");
  });

  test("editing inline values persists across reload", async ({ page }) => {
    // Navigate to income step to edit
    await page.goto("/?step=income");

    // Edit the Salary income from $4,500 to $10,000
    const incomeList = page.getByRole("list", { name: "Income items" });
    const salaryRow = incomeList.getByRole("listitem").filter({ hasText: "Salary" });
    await salaryRow.getByLabel(/Edit amount for Salary/).click();
    await page.getByLabel("Edit amount for Salary").fill("10000");
    await page.getByLabel("Edit amount for Salary").press("Enter");

    // Verify the edit shows in the list
    await expect(salaryRow).toContainText("$10,000");

    // Wait for URL update
    await page.waitForTimeout(500);
    const editUrl = page.url();

    // Reload at the same step with preserved state
    await page.goto(editUrl);

    // Verify edited value persisted
    const incomeListAfter = page.getByRole("list", { name: "Income items" });
    await expect(incomeListAfter).toContainText("$10,000");
  });

  test("deleting items persists across reload", async ({ page }) => {
    // Navigate to assets step to delete
    await page.goto("/?step=assets");

    // Delete RRSP asset ($28,000)
    const assetsList = page.getByRole("list", { name: "Asset items" });
    const rrspRow = assetsList.getByRole("listitem").filter({ hasText: "RRSP" });
    await rrspRow.getByLabel("Delete RRSP").click();

    // Verify it's gone
    await expect(assetsList).not.toContainText("RRSP");

    // Wait for URL update
    await page.waitForTimeout(500);
    const deleteUrl = page.url();

    // Reload
    await page.goto(deleteUrl);

    // Verify RRSP is still gone
    const assetsListAfter = page.getByRole("list", { name: "Asset items" });
    await expect(assetsListAfter).not.toContainText("RRSP");

    // Remaining assets should still be there
    await expect(assetsListAfter).toContainText("Savings Account");
    await expect(assetsListAfter).toContainText("TFSA");
  });
});
