import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Shared state — live dashboard updates", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for dashboard to render with initial metrics
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');
  });

  test("dashboard shows computed metrics from initial mock data", async ({ page }) => {
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // Net Worth: 65500 - 295000 = -229500
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("-$229,500");

    // Monthly Surplus: 6300 - 2950 = 3350
    await expect(dashboard.getByLabel(/Monthly Surplus:/)).toContainText("$3,350");

    await captureScreenshot(page, "task-10-dashboard-initial");
  });

  test("adding an asset updates net worth in real time", async ({ page }) => {
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // Get initial net worth
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("-$229,500");

    // Add a new asset worth $100,000
    const assetSection = page.locator("text=Assets").locator("..");
    await assetSection.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Big Savings");
    await page.getByLabel("New asset amount").fill("100000");
    await page.getByLabel("Confirm add asset").click();

    // Net worth should update: -229500 + 100000 = -129500
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("-$129,500");

    await captureScreenshot(page, "task-10-asset-updates-dashboard");
  });

  test("deleting a debt updates net worth in real time", async ({ page }) => {
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // Delete Car Loan ($15,000)
    const debtsList = page.getByRole("list", { name: "Debt items" });
    const carLoanRow = debtsList.getByRole("listitem").filter({ hasText: "Car Loan" });
    await carLoanRow.hover();
    await carLoanRow.getByLabel("Delete Car Loan").click();

    // Net worth should update: -229500 + 15000 = -214500
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("-$214,500");

    await captureScreenshot(page, "task-10-debt-delete-updates-dashboard");
  });

  test("editing income updates monthly surplus", async ({ page }) => {
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // Edit salary from $5,500 to $8,000
    const incomeList = page.getByRole("list", { name: "Income items" });
    const salaryRow = incomeList.getByRole("listitem").filter({ hasText: "Salary" });
    await salaryRow.getByLabel(/Edit amount for Salary/).click();
    await page.getByLabel("Edit amount for Salary").fill("8000");
    await page.getByLabel("Edit amount for Salary").press("Enter");

    // Surplus should update: (8000 + 800) - 2950 = 5850
    await expect(dashboard.getByLabel(/Monthly Surplus:/)).toContainText("$5,850");

    await captureScreenshot(page, "task-10-income-edit-updates-surplus");
  });

  test("adding expense updates runway and surplus", async ({ page }) => {
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // Add a large expense
    const expenseSection = page.locator("text=Monthly Expenses").locator("..");
    await expenseSection.getByText("+ Add Expense").click();
    await page.getByLabel("New expense category").fill("Gym");
    await page.getByLabel("New expense amount").fill("50");
    await page.getByLabel("Confirm add expense").click();

    // Surplus should drop: 6300 - (2950+50) = 3300
    await expect(dashboard.getByLabel(/Monthly Surplus:/)).toContainText("$3,300");

    await captureScreenshot(page, "task-10-expense-updates-dashboard");
  });

  test("insights update when financial data changes", async ({ page }) => {
    const insightsPanel = page.locator('[data-testid="insights-panel"]');

    // Verify initial insights contain runway message
    await expect(insightsPanel).toContainText("months of expenses");

    // Delete all assets to drastically change the picture
    const assetsList = page.getByRole("list", { name: "Asset items" });
    // Delete each asset
    for (const category of ["Brokerage", "TFSA", "Savings Account"]) {
      const row = assetsList.getByRole("listitem").filter({ hasText: category });
      await row.hover();
      await row.getByLabel(`Delete ${category}`).click();
    }

    // With zero assets: no runway insight (runway = 0)
    // Net worth insight should change
    await expect(insightsPanel).not.toContainText("22 months");

    await captureScreenshot(page, "task-10-insights-update");
  });

  test("multiple edits across sections reflect in dashboard consistently", async ({ page }) => {
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // Add asset $10,000
    const assetSection = page.locator("text=Assets").locator("..");
    await assetSection.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Cash");
    await page.getByLabel("New asset amount").fill("10000");
    await page.getByLabel("Confirm add asset").click();

    // Add income $1,000
    const incomeSection = page.locator("text=Monthly Income").locator("..");
    await incomeSection.getByText("+ Add Income").click();
    await page.getByLabel("New income category").fill("Bonus");
    await page.getByLabel("New income amount").fill("1000");
    await page.getByLabel("Confirm add income").click();

    // Net worth: -229500 + 10000 = -219500
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("-$219,500");

    // Surplus: (6300 + 1000) - 2950 = 4350
    await expect(dashboard.getByLabel(/Monthly Surplus:/)).toContainText("$4,350");

    await captureScreenshot(page, "task-10-multi-edit-dashboard");
  });
});
