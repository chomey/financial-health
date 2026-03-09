import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

async function goToStep(page: import("@playwright/test").Page, step: string) {
  const url = new URL(page.url());
  url.searchParams.set("step", step);
  await page.goto(url.toString());
}

test.describe("Shared state — live dashboard updates", () => {
  test("dashboard shows computed metrics from initial state", async ({ page }) => {
    await page.goto("/?step=dashboard");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // INITIAL_STATE: Assets $55k, Debts $5k → NW $50k
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("$50,000");

    await captureScreenshot(page, "task-10-dashboard-initial");
  });

  test("adding an asset updates net worth", async ({ page }) => {
    await page.goto("/?step=assets");

    // Add a new asset worth $100,000
    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Big Savings");
    await page.getByLabel("New asset amount").fill("100000");
    await page.getByLabel("Confirm add asset").click();

    // Navigate to dashboard — NW: $50k + $100k = $150k
    await goToStep(page, "dashboard");
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("$150,000");

    await captureScreenshot(page, "task-10-asset-updates-dashboard");
  });

  test("deleting a debt updates net worth", async ({ page }) => {
    await page.goto("/?step=debts");

    // Delete Car Loan ($5,000)
    const debtsList = page.getByRole("list", { name: "Debt items" });
    const carLoanRow = debtsList.getByRole("listitem").filter({ hasText: "Car Loan" });
    await carLoanRow.getByLabel("Delete Car Loan").click();
    await page.waitForTimeout(500);

    // Navigate to dashboard — NW: $55k - $0 = $55k
    await goToStep(page, "dashboard");
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("$55,000");

    await captureScreenshot(page, "task-10-debt-delete-updates-dashboard");
  });

  test("editing income updates on income step", async ({ page }) => {
    await page.goto("/?step=income");

    // Edit salary from $4,500 to $8,000
    const incomeList = page.getByRole("list", { name: "Income items" });
    const salaryRow = incomeList.getByRole("listitem").filter({ hasText: "Salary" });
    await salaryRow.getByLabel(/Edit amount for Salary/).click();
    await page.getByLabel("Edit amount for Salary").fill("8000");
    await page.getByLabel("Edit amount for Salary").press("Enter");

    // Verify the edit is reflected
    await expect(salaryRow).toContainText("$8,000");

    await captureScreenshot(page, "task-10-income-edit-updates-surplus");
  });

  test("adding expense updates expense list", async ({ page }) => {
    await page.goto("/?step=expenses");

    // Add a new expense
    await page.getByText("+ Add Expense").click();
    await page.getByLabel("New expense category").fill("Gym");
    await page.getByLabel("New expense amount").fill("50");
    await page.getByLabel("Confirm add expense").click();

    const expenseList = page.getByRole("list", { name: "Expense items" });
    await expect(expenseList).toContainText("Gym");

    await captureScreenshot(page, "task-10-expense-updates-dashboard");
  });

  test("insights are present on dashboard", async ({ page }) => {
    await page.goto("/?step=dashboard");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();
    const insightCards = insightsPanel.getByRole("article");
    expect(await insightCards.count()).toBeGreaterThanOrEqual(3);

    await captureScreenshot(page, "task-10-insights-update");
  });

  test("multiple edits across sections reflect in dashboard consistently", async ({ page }) => {
    // Add asset $10,000
    await page.goto("/?step=assets");
    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Cash");
    await page.getByLabel("New asset amount").fill("10000");
    await page.getByLabel("Confirm add asset").click();

    // Add income $1,000
    await goToStep(page, "income");
    await page.getByText("+ Add Income").click();
    await page.getByLabel("New income category").fill("Bonus");
    await page.getByLabel("New income amount").fill("1000");
    await page.getByLabel("Confirm add income").click();

    // Navigate to dashboard — NW: $50k + $10k = $60k
    await goToStep(page, "dashboard");
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("$60,000");

    await captureScreenshot(page, "task-10-multi-edit-dashboard");
  });
});
