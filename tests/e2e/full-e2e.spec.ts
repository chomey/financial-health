import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("T3: Full end-to-end user journey", () => {
  test("complete financial snapshot workflow with live dashboard updates", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // --- Step 1: Verify initial state loaded correctly ---
    await expect(page.getByText("Financial Health Snapshot")).toBeVisible();
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("-$229,500");
    await expect(dashboard.getByLabel(/Monthly Surplus:/)).toContainText("$3,350");
    await captureScreenshot(page, "task-10-e2e-initial-state");

    // --- Step 2: Add an asset and verify dashboard updates ---
    const assetSection = page.locator("section", { has: page.getByText("Assets") }).first();
    await assetSection.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Emergency Fund");
    await page.getByLabel("New asset amount").fill("25000");
    await page.getByLabel("Confirm add asset").click();

    // Verify the new asset appears in the list
    const assetsList = page.getByRole("list", { name: "Asset items" });
    await expect(assetsList).toContainText("Emergency Fund");
    await expect(assetsList).toContainText("$25,000");

    // Net worth should now be: (65500 + 25000) - 295000 = -204500
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("-$204,500");

    // --- Step 3: Delete a debt and verify dashboard updates ---
    const debtsList = page.getByRole("list", { name: "Debt items" });
    const carLoanRow = debtsList.getByRole("listitem").filter({ hasText: "Car Loan" });
    await carLoanRow.hover();
    await carLoanRow.getByLabel("Delete Car Loan").click();

    // Net worth: (90500) - (280000) = -189500
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("-$189,500");

    // --- Step 4: Add income and verify surplus updates ---
    const incomeSection = page.locator("section", { has: page.getByText("Monthly Income") }).first();
    await incomeSection.getByText("+ Add Income").click();
    await page.getByLabel("New income category").fill("Side Hustle");
    await page.getByLabel("New income amount").fill("2000");
    await page.getByLabel("Confirm add income").click();

    // Surplus: (6300 + 2000) - 2950 = 5350
    await expect(dashboard.getByLabel(/Monthly Surplus:/)).toContainText("$5,350");

    // --- Step 5: Add an expense and verify surplus + runway update ---
    const expenseSection = page.locator("section", { has: page.getByText("Monthly Expenses") }).first();
    await expenseSection.getByText("+ Add Expense").click();
    await page.getByLabel("New expense category").fill("Insurance");
    await page.getByLabel("New expense amount").fill("200");
    await page.getByLabel("Confirm add expense").click();

    // Surplus: (8300) - (2950 + 200) = 5150
    await expect(dashboard.getByLabel(/Monthly Surplus:/)).toContainText("$5,150");

    // --- Step 6: Edit an existing amount (inline edit) ---
    const incomeList = page.getByRole("list", { name: "Income items" });
    const salaryRow = incomeList.getByRole("listitem").filter({ hasText: "Salary" });
    await salaryRow.getByLabel(/Edit amount for Salary/).click();
    await page.getByLabel("Edit amount for Salary").fill("7000");
    await page.getByLabel("Edit amount for Salary").press("Enter");

    // Surplus: (7000 + 800 + 2000) - (3150) = 6650
    await expect(dashboard.getByLabel(/Monthly Surplus:/)).toContainText("$6,650");

    // --- Step 7: Verify goals section still functions ---
    const goalsList = page.getByRole("list", { name: "Goal items" });
    await expect(goalsList).toContainText("Rainy Day Fund");
    await expect(goalsList).toContainText("New Car");
    await expect(goalsList).toContainText("Vacation");

    // --- Step 8: Verify insights reflect the current state ---
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();
    // Should still have insights based on updated numbers
    const insightCards = insightsPanel.getByRole("article");
    expect(await insightCards.count()).toBeGreaterThanOrEqual(3);

    // --- Step 9: Verify all four dashboard metrics are present ---
    // First dismiss any tooltip by moving mouse away
    await page.mouse.move(0, 0);
    await expect(dashboard.getByRole("group", { name: "Net Worth" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Monthly Surplus" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Financial Runway" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Debt-to-Asset Ratio" })).toBeVisible();

    await captureScreenshot(page, "task-10-e2e-after-edits");

    // --- Step 10: Verify tooltips work on dashboard ---
    const netWorthCard = dashboard.getByRole("group", { name: "Net Worth" });
    await netWorthCard.hover();
    await expect(page.getByRole("tooltip")).toContainText("total assets minus total debts");

    await captureScreenshot(page, "task-10-e2e-tooltip");
  });
});
