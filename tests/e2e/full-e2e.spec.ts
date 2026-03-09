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

test.describe("T3: Full end-to-end user journey", () => {
  test("complete financial snapshot workflow with live dashboard updates", async ({ page }) => {
    // Start at dashboard — INITIAL_STATE: Assets $55k, Debts $5k → NW $50k
    await page.goto("/?step=dashboard");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // --- Step 1: Verify initial state loaded correctly ---
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("$50,000");
    await captureScreenshot(page, "task-10-e2e-initial-state");

    // --- Step 2: Add an asset and verify dashboard updates ---
    await goToStep(page, "assets");
    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Emergency Fund");
    await page.getByLabel("New asset amount").fill("25000");
    await page.getByLabel("Confirm add asset").click();

    // Verify the new asset appears in the list
    const assetsList = page.getByRole("list", { name: "Asset items" });
    await expect(assetsList).toContainText("Emergency Fund");
    await expect(assetsList).toContainText("$25,000");

    // Go to dashboard — Net worth should increase by $25k → $75,000
    await goToStep(page, "dashboard");
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("$75,000");

    // --- Step 3: Delete a debt and verify dashboard updates ---
    await goToStep(page, "debts");
    const debtsList = page.getByRole("list", { name: "Debt items" });
    const carLoanRow = debtsList.getByRole("listitem").filter({ hasText: "Car Loan" });
    await carLoanRow.getByLabel("Delete Car Loan").click();
    // Wait for URL state to persist after deletion
    await page.waitForTimeout(500);

    // Go to dashboard — Net worth: $80k - $0 = $80,000
    await goToStep(page, "dashboard");
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("$80,000");

    // --- Step 4: Add income ---
    await goToStep(page, "income");
    await page.getByText("+ Add Income").click();
    await page.getByLabel("New income category").fill("Side Hustle");
    await page.getByLabel("New income amount").fill("2000");
    await page.getByLabel("Confirm add income").click();

    const incomeList = page.getByRole("list", { name: "Income items" });
    await expect(incomeList).toContainText("Side Hustle");

    // --- Step 5: Add an expense ---
    await goToStep(page, "expenses");
    await page.getByText("+ Add Expense").click();
    await page.getByLabel("New expense category").fill("Insurance");
    await page.getByLabel("New expense amount").fill("200");
    await page.getByLabel("Confirm add expense").click();

    const expenseList = page.getByRole("list", { name: "Expense items" });
    await expect(expenseList).toContainText("Insurance");

    // --- Step 6: Edit an existing amount (inline edit) ---
    await goToStep(page, "income");
    const incomeListEdit = page.getByRole("list", { name: "Income items" });
    const salaryRow = incomeListEdit.getByRole("listitem").filter({ hasText: "Salary" });
    await salaryRow.getByLabel(/Edit amount for Salary, currently/).click();
    const editInput = incomeListEdit.locator('input[aria-label="Edit amount for Salary"]');
    await expect(editInput).toBeVisible();
    await editInput.clear();
    await editInput.type("7000");
    await editInput.press("Enter");

    // Verify the inline edit is visible in the income list
    await expect(incomeListEdit.getByRole("listitem").filter({ hasText: "Salary" })).toContainText("$7,000");

    // --- Step 7: Verify dashboard has insights ---
    await goToStep(page, "dashboard");
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();
    const insightCards = insightsPanel.getByRole("article");
    expect(await insightCards.count()).toBeGreaterThanOrEqual(3);

    // --- Step 8: Verify all four dashboard metrics are present ---
    await expect(dashboard.getByRole("group", { name: "Net Worth" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Monthly Cash Flow" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Financial Runway" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Debt-to-Asset Ratio" })).toBeVisible();

    await captureScreenshot(page, "task-10-e2e-after-edits");

    // --- Step 9: Verify tooltips work on dashboard ---
    const netWorthCard = dashboard.getByRole("group", { name: "Net Worth" });
    const helpBtn = netWorthCard.getByTestId("help-tip-button");
    await helpBtn.hover();
    await expect(page.getByRole("tooltip")).toContainText("Assets");

    await captureScreenshot(page, "task-10-e2e-tooltip");
  });
});
