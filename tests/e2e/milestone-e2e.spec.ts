import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("T3: Milestone — Comprehensive end-to-end user journey", () => {
  test("full financial snapshot lifecycle: add data, verify metrics, copy URL, reload, region toggle", async ({
    page,
    context,
  }) => {
    // Grant clipboard permissions for Copy Link test
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // ========================================
    // Step 1: Verify initial state
    // ========================================
    await expect(page.getByText("Financial Health Snapshot")).toBeVisible();
    await expect(
      page.getByText("Your finances at a glance — no judgment, just clarity")
    ).toBeVisible();

    // Verify initial mock data is present
    const assetsList = page.getByRole("list", { name: "Asset items" });
    await expect(assetsList).toContainText("Savings Account");
    await expect(assetsList).toContainText("TFSA");
    await expect(assetsList).toContainText("Brokerage");

    const debtsList = page.getByRole("list", { name: "Debt items" });
    await expect(debtsList).toContainText("Mortgage");
    await expect(debtsList).toContainText("Car Loan");

    // Verify initial dashboard metrics
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("-$229,500");
    await expect(dashboard.getByLabel(/Monthly Surplus:/)).toContainText(
      "$3,350"
    );

    await captureScreenshot(page, "task-15-initial-state");

    // ========================================
    // Step 2: Add 3 new assets
    // ========================================
    const assetSection = page
      .locator("section", { has: page.getByText("Assets") })
      .first();

    // Asset 1: Emergency Fund $10,000
    await assetSection.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Emergency Fund");
    await page.getByLabel("New asset amount").fill("10000");
    await page.getByLabel("Confirm add asset").click();
    await expect(assetsList).toContainText("Emergency Fund");
    await expect(assetsList).toContainText("$10,000");

    // Asset 2: Roth IRA $25,000
    await assetSection.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Roth IRA");
    await page.getByLabel("New asset amount").fill("25000");
    await page.getByLabel("Confirm add asset").click();
    await expect(assetsList).toContainText("Roth IRA");

    // Asset 3: HSA $5,000
    await assetSection.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("HSA");
    await page.getByLabel("New asset amount").fill("5000");
    await page.getByLabel("Confirm add asset").click();
    await expect(assetsList).toContainText("HSA");

    // Verify net worth updated: (65500 + 10000 + 25000 + 5000) - 295000 = -189500
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("-$189,500");

    await captureScreenshot(page, "task-15-after-adding-assets");

    // ========================================
    // Step 3: Add 2 new debts
    // ========================================
    const debtSection = page
      .locator("section", { has: page.getByRole("heading", { name: "Debts" }) })
      .first();

    // Debt 1: Student Loan $30,000
    await debtSection.getByText("+ Add Debt").click();
    await page.getByLabel("New debt category").fill("Student Loan");
    await page.getByLabel("New debt amount").fill("30000");
    await page.getByLabel("Confirm add debt").click();
    await expect(debtsList).toContainText("Student Loan");

    // Debt 2: Credit Card $5,000
    await debtSection.getByText("+ Add Debt").click();
    await page.getByLabel("New debt category").fill("Credit Card");
    await page.getByLabel("New debt amount").fill("5000");
    await page.getByLabel("Confirm add debt").click();
    await expect(debtsList).toContainText("Credit Card");

    // Net worth: 105500 - 330000 = -224500
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("-$224,500");

    await captureScreenshot(page, "task-15-after-adding-debts");

    // ========================================
    // Step 4: Add income and expenses
    // ========================================
    const incomeSection = page
      .locator("section", {
        has: page.getByRole("heading", { name: "Monthly Income" }),
      })
      .first();
    const incomeList = page.getByRole("list", { name: "Income items" });

    // Add income: Side Hustle $1,500
    await incomeSection.getByText("+ Add Income").click();
    await page.getByLabel("New income category").fill("Side Hustle");
    await page.getByLabel("New income amount").fill("1500");
    await page.getByLabel("Confirm add income").click();
    await expect(incomeList).toContainText("Side Hustle");

    const expenseSection = page
      .locator("section", {
        has: page.getByRole("heading", { name: "Monthly Expenses" }),
      })
      .first();
    const expenseList = page.getByRole("list", { name: "Expense items" });

    // Add expense: Insurance $200
    await expenseSection.getByText("+ Add Expense").click();
    await page.getByLabel("New expense category").fill("Insurance");
    await page.getByLabel("New expense amount").fill("200");
    await page.getByLabel("Confirm add expense").click();
    await expect(expenseList).toContainText("Insurance");

    // Add expense: Gym $50
    await expenseSection.getByText("+ Add Expense").click();
    await page.getByLabel("New expense category").fill("Gym");
    await page.getByLabel("New expense amount").fill("50");
    await page.getByLabel("Confirm add expense").click();
    await expect(expenseList).toContainText("Gym");

    // Surplus: (6300 + 1500) - (2950 + 200 + 50) = 7800 - 3200 = 4600
    await expect(dashboard.getByLabel(/Monthly Surplus:/)).toContainText(
      "$4,600"
    );

    await captureScreenshot(page, "task-15-after-income-expenses");

    // ========================================
    // Step 5: Add a goal
    // ========================================
    const goalSection = page
      .locator("section", {
        has: page.getByRole("heading", { name: "Goals" }),
      })
      .first();
    const goalsList = page.getByRole("list", { name: "Goal items" });

    await goalSection.getByText("+ Add Goal").click();
    await page.getByLabel("New goal name").fill("Dream Home Down Payment");
    await page.getByLabel("New goal target amount").fill("100000");
    await page.getByLabel("New goal current amount").fill("15000");
    await page.getByLabel("Confirm add goal").click();
    await expect(goalsList).toContainText("Dream Home Down Payment");

    await captureScreenshot(page, "task-15-after-adding-goal");

    // ========================================
    // Step 6: Verify dashboard metrics are correct
    // ========================================
    // All four metric cards should be present
    await expect(
      dashboard.getByRole("group", { name: "Net Worth" })
    ).toBeVisible();
    await expect(
      dashboard.getByRole("group", { name: "Monthly Surplus" })
    ).toBeVisible();
    await expect(
      dashboard.getByRole("group", { name: "Financial Runway" })
    ).toBeVisible();
    await expect(
      dashboard.getByRole("group", { name: "Debt-to-Asset Ratio" })
    ).toBeVisible();

    // Verify insights panel is present with cards
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();
    const insightCards = insightsPanel.getByRole("article");
    expect(await insightCards.count()).toBeGreaterThanOrEqual(3);

    await captureScreenshot(page, "task-15-dashboard-metrics");

    // ========================================
    // Step 7: Copy the URL
    // ========================================
    // Wait for URL state to be set
    await page.waitForFunction(() =>
      window.location.search.includes("s=")
    );
    const urlBeforeCopy = page.url();

    const copyButton = page.getByRole("button", {
      name: "Copy link to clipboard",
    });
    await copyButton.click();
    await expect(copyButton).toContainText("Copied!");

    // Read the clipboard content
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toContain("s=");
    expect(clipboardText).toBe(urlBeforeCopy);

    await captureScreenshot(page, "task-15-copy-link");

    // ========================================
    // Step 8: Reload the page and verify all data is preserved
    // ========================================
    const stateUrl = page.url();
    await page.goto(stateUrl);
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // Verify all 6 assets (3 original + 3 added)
    const assetsListAfterReload = page.getByRole("list", {
      name: "Asset items",
    });
    await expect(assetsListAfterReload).toContainText("Savings Account");
    await expect(assetsListAfterReload).toContainText("TFSA");
    await expect(assetsListAfterReload).toContainText("Brokerage");
    await expect(assetsListAfterReload).toContainText("Emergency Fund");
    await expect(assetsListAfterReload).toContainText("Roth IRA");
    await expect(assetsListAfterReload).toContainText("HSA");

    // Verify all 4 debts (2 original + 2 added)
    const debtsListAfterReload = page.getByRole("list", {
      name: "Debt items",
    });
    await expect(debtsListAfterReload).toContainText("Mortgage");
    await expect(debtsListAfterReload).toContainText("Car Loan");
    await expect(debtsListAfterReload).toContainText("Student Loan");
    await expect(debtsListAfterReload).toContainText("Credit Card");

    // Verify income (2 original + 1 added)
    const incomeListAfterReload = page.getByRole("list", {
      name: "Income items",
    });
    await expect(incomeListAfterReload).toContainText("Salary");
    await expect(incomeListAfterReload).toContainText("Freelance");
    await expect(incomeListAfterReload).toContainText("Side Hustle");

    // Verify expenses (3 original + 2 added)
    const expenseListAfterReload = page.getByRole("list", {
      name: "Expense items",
    });
    await expect(expenseListAfterReload).toContainText("Rent/Mortgage Payment");
    await expect(expenseListAfterReload).toContainText("Groceries");
    await expect(expenseListAfterReload).toContainText("Subscriptions");
    await expect(expenseListAfterReload).toContainText("Insurance");
    await expect(expenseListAfterReload).toContainText("Gym");

    // Verify goals (3 original + 1 added)
    const goalsListAfterReload = page.getByRole("list", {
      name: "Goal items",
    });
    await expect(goalsListAfterReload).toContainText("Rainy Day Fund");
    await expect(goalsListAfterReload).toContainText("New Car");
    await expect(goalsListAfterReload).toContainText("Vacation");
    await expect(goalsListAfterReload).toContainText("Dream Home Down Payment");

    // Verify dashboard metrics are the same after reload
    const dashboardAfterReload = page.locator(
      '[data-testid="snapshot-dashboard"]'
    );
    await expect(dashboardAfterReload.getByLabel(/Net Worth:/)).toContainText(
      "-$224,500"
    );
    await expect(
      dashboardAfterReload.getByLabel(/Monthly Surplus:/)
    ).toContainText("$4,600");

    await captureScreenshot(page, "task-15-after-reload");

    // ========================================
    // Step 9: Toggle region and verify category suggestions change
    // ========================================
    const toggle = page.getByRole("radiogroup", {
      name: /Select financial region/i,
    });

    // Switch to CA
    await toggle.getByRole("radio", { name: /CA/i }).click();
    await expect(
      toggle.getByRole("radio", { name: /CA/i })
    ).toHaveAttribute("aria-checked", "true");

    // Open add asset form and verify CA suggestions
    await page.getByText("+ Add Asset").click();
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.focus();

    // CA should show RRSP but not 401k
    const addRow = page.locator(".animate-in");
    const suggestionButtons = addRow.getByRole("button");
    const caTexts = await suggestionButtons.allTextContents();
    expect(caTexts).toContain("RRSP");
    expect(caTexts).toContain("TFSA");
    expect(caTexts).not.toContain("401k");
    expect(caTexts).not.toContain("Roth IRA");

    await captureScreenshot(page, "task-15-ca-suggestions");

    // Cancel the add form by pressing Escape
    await categoryInput.press("Escape");

    // Switch to US
    await toggle.getByRole("radio", { name: /US/i }).click();
    await expect(
      toggle.getByRole("radio", { name: /US/i })
    ).toHaveAttribute("aria-checked", "true");

    // Open add asset form and verify US suggestions
    await page.getByText("+ Add Asset").click();
    const categoryInputUS = page.getByLabel("New asset category");
    await categoryInputUS.focus();

    const addRowUS = page.locator(".animate-in");
    const usButtons = addRowUS.getByRole("button");
    const usTexts = await usButtons.allTextContents();
    expect(usTexts).toContain("401k");
    expect(usTexts).toContain("Roth IRA");
    expect(usTexts).not.toContain("RRSP");
    expect(usTexts).not.toContain("TFSA");

    await captureScreenshot(page, "task-15-us-suggestions");

    // Switch back to Both
    await toggle.getByRole("radio", { name: /Both/i }).click();

    await captureScreenshot(page, "task-15-final-state");
  });

  test("region selection persists across reload during full workflow", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // Switch to US region
    const toggle = page.getByRole("radiogroup", {
      name: /Select financial region/i,
    });
    await toggle.getByRole("radio", { name: /US/i }).click();

    // Wait for URL to update with region
    await page.waitForTimeout(1000);

    // Reload
    const regionUrl = page.url();
    await page.goto(regionUrl);

    // Verify US is still selected
    const toggleAfterReload = page.getByRole("radiogroup", {
      name: /Select financial region/i,
    });
    await expect(
      toggleAfterReload.getByRole("radio", { name: /US/i })
    ).toHaveAttribute("aria-checked", "true");
  });

  test("editing inline values persists across reload", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // Edit the Salary income from $5,500 to $10,000
    const incomeList = page.getByRole("list", { name: "Income items" });
    const salaryRow = incomeList
      .getByRole("listitem")
      .filter({ hasText: "Salary" });
    await salaryRow.getByLabel(/Edit amount for Salary/).click();
    await page.getByLabel("Edit amount for Salary").fill("10000");
    await page.getByLabel("Edit amount for Salary").press("Enter");

    // Verify surplus updated: (10000 + 800) - 2950 = 7850
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await expect(dashboard.getByLabel(/Monthly Surplus:/)).toContainText(
      "$7,850"
    );

    // Wait for URL update
    await page.waitForTimeout(500);
    const editUrl = page.url();

    // Reload
    await page.goto(editUrl);
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // Verify edited value persisted
    const incomeListAfter = page.getByRole("list", { name: "Income items" });
    await expect(incomeListAfter).toContainText("$10,000");

    // Verify dashboard still shows the updated surplus
    const dashboardAfter = page.locator('[data-testid="snapshot-dashboard"]');
    await expect(dashboardAfter.getByLabel(/Monthly Surplus:/)).toContainText(
      "$7,850"
    );
  });

  test("deleting items persists across reload", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // Delete Brokerage asset ($18,500)
    const assetsList = page.getByRole("list", { name: "Asset items" });
    const brokerageRow = assetsList
      .getByRole("listitem")
      .filter({ hasText: "Brokerage" });
    await brokerageRow.hover();
    await brokerageRow.getByLabel("Delete Brokerage").click();

    // Verify it's gone
    await expect(assetsList).not.toContainText("Brokerage");

    // Wait for URL update
    await page.waitForTimeout(500);
    const deleteUrl = page.url();

    // Reload
    await page.goto(deleteUrl);
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // Verify Brokerage is still gone
    const assetsListAfter = page.getByRole("list", { name: "Asset items" });
    await expect(assetsListAfter).not.toContainText("Brokerage");

    // Remaining assets should still be there
    await expect(assetsListAfter).toContainText("Savings Account");
    await expect(assetsListAfter).toContainText("TFSA");
  });
});
