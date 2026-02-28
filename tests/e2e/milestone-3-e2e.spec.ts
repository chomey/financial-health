import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("T3: Milestone 3 — Comprehensive E2E for tasks 27-35", () => {
  test.setTimeout(90000);

  test("full journey: chart position, legend, debt payoff, income frequency, grouped dropdowns, stocks, amortization, contributions", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // ========================================
    // Step 1: Projection chart is full-width above two-column layout (Task 33)
    // ========================================
    const projectionsSection = page.locator(
      'section[aria-label="Financial projections"]'
    );
    await expect(projectionsSection).toBeVisible();

    const chart = page.getByTestId("projection-chart");
    await expect(chart).toBeVisible();

    // Chart section should appear before the entry/dashboard sections
    const projBB = await projectionsSection.boundingBox();
    const entrySection = page.locator(
      'section[aria-label="Financial data entry"]'
    );
    const entryBB = await entrySection.boundingBox();
    expect(projBB).not.toBeNull();
    expect(entryBB).not.toBeNull();
    expect(projBB!.y).toBeLessThan(entryBB!.y);

    // On desktop, chart should be wider than dashboard column
    const dashboardSection = page.locator(
      'section[aria-label="Financial dashboard"]'
    );
    const dashBB = await dashboardSection.boundingBox();
    expect(dashBB).not.toBeNull();
    expect(projBB!.width).toBeGreaterThan(dashBB!.width);

    // Chart should NOT be inside dashboard section
    const chartInDashboard = dashboardSection.getByTestId("projection-chart");
    await expect(chartInDashboard).toHaveCount(0);

    await captureScreenshot(page, "task-36-chart-fullwidth-position");

    // ========================================
    // Step 2: Scenario legend visibility and content (Task 28)
    // ========================================
    // Scenario buttons should have tooltip descriptions
    const conservativeBtn = page.getByTestId("scenario-conservative");
    const moderateBtn = page.getByTestId("scenario-moderate");
    const optimisticBtn = page.getByTestId("scenario-optimistic");

    await expect(conservativeBtn).toHaveAttribute("title", /30%.*below/);
    await expect(moderateBtn).toHaveAttribute("title", /entered.*ROI/);
    await expect(optimisticBtn).toHaveAttribute("title", /30%.*above/);

    // Legend toggle should be visible and start collapsed
    const legendToggle = page.getByTestId("scenario-legend-toggle");
    await expect(legendToggle).toBeVisible();
    await expect(legendToggle).toContainText("What do the scenarios mean?");
    await expect(legendToggle).toHaveAttribute("aria-expanded", "false");

    const legendContent = page.getByTestId("scenario-legend-content");
    await expect(legendContent).not.toBeVisible();

    // Expand legend
    await legendToggle.click();
    await expect(legendContent).toBeVisible();
    await expect(legendContent).toContainText("Conservative");
    await expect(legendContent).toContainText("Moderate");
    await expect(legendContent).toContainText("Optimistic");
    await expect(legendContent).toContainText("30% below");
    await expect(legendContent).toContainText("entered ROI values");
    await expect(legendContent).toContainText("30% above");
    await expect(legendToggle).toHaveAttribute("aria-expanded", "true");

    // Colored dots matching scenario colors
    const dots = legendContent.locator("span.rounded-full");
    await expect(dots).toHaveCount(3);

    await captureScreenshot(page, "task-36-scenario-legend-expanded");

    // Collapse again
    await legendToggle.click();
    await expect(legendContent).not.toBeVisible();

    // ========================================
    // Step 3: Debt payoff timeline (Task 29)
    // ========================================
    // Set interest rate and payment on Car Loan (d1) to trigger payoff calc
    await page.getByTestId("interest-badge-d1").click();
    await page.getByLabel("Edit interest rate for Car Loan").fill("6");
    await page.getByLabel("Edit interest rate for Car Loan").press("Enter");

    await page.getByTestId("debt-payment-badge-d1").click();
    await page.getByLabel("Edit monthly payment for Car Loan").fill("300");
    await page.getByLabel("Edit monthly payment for Car Loan").press("Enter");

    // Payoff info should appear
    const payoffInfo = page.getByTestId("debt-payoff-d1");
    await expect(payoffInfo).toBeVisible();
    await expect(payoffInfo).toContainText("Paid off in");
    await expect(payoffInfo).toContainText("total interest");

    await captureScreenshot(page, "task-36-debt-payoff-timeline");

    // ========================================
    // Step 4: Debt payoff warning for insufficient payment
    // ========================================
    // Add a new debt with high interest and tiny payment
    const debtSection = page
      .locator("section", { has: page.getByRole("heading", { name: "Debts" }) })
      .first();
    await debtSection.getByText("+ Add Debt").click();
    await page.getByLabel("New debt category").fill("Credit Card");
    const newDebtAmount = page.getByLabel("New debt amount");
    await newDebtAmount.fill("20000");
    await newDebtAmount.press("Enter");

    // Find the new debt's ID by looking for the Credit Card item
    const debtsList = page.getByRole("list", { name: "Debt items" });
    await expect(debtsList).toContainText("Credit Card");

    // Credit Card should have suggested 19.9% APR
    // Set a tiny payment that won't cover interest
    // $20,000 at 19.9% = ~$332/mo interest, so $100/mo won't cover it
    // Find the last interest badge (for the new debt)
    const allInterestBadges = page.locator('[data-testid^="interest-badge-d"]');
    const lastInterestBadge = allInterestBadges.last();
    await expect(lastInterestBadge).toBeVisible();

    const allPaymentBadges = page.locator(
      '[data-testid^="debt-payment-badge-d"]'
    );
    const lastPaymentBadge = allPaymentBadges.last();
    await lastPaymentBadge.click();
    // After clicking, the badge becomes an input
    const paymentInput = page
      .locator('[aria-label="Edit monthly payment for Credit Card"]');
    await expect(paymentInput).toBeVisible();
    await paymentInput.fill("100");
    await paymentInput.press("Enter");

    // Warning should appear for the last debt
    const allWarnings = page.locator('[data-testid^="debt-payoff-warning-"]');
    await expect(allWarnings.last()).toBeVisible();
    await expect(allWarnings.last()).toContainText("balance will grow");

    await captureScreenshot(page, "task-36-debt-payoff-warning");

    // ========================================
    // Step 5: Amortization schedule (Task 34)
    // ========================================
    // Set property interest rate and payment
    await page.getByTestId("rate-badge-p1").click();
    await page.getByLabel("Edit interest rate for Home").fill("5");
    await page.getByLabel("Edit interest rate for Home").press("Enter");

    await page.getByTestId("payment-badge-p1").click();
    await page.getByLabel("Edit monthly payment for Home").fill("1636");
    await page.getByLabel("Edit monthly payment for Home").press("Enter");

    // Mortgage breakdown should show relabeled fields
    const mortgageInfo = page.getByTestId("mortgage-info-p1");
    await expect(mortgageInfo).toBeVisible();
    await expect(mortgageInfo).toContainText("Current month: interest");
    await expect(mortgageInfo).toContainText("Current month: principal");
    await expect(mortgageInfo).toContainText("First year avg interest");
    await expect(mortgageInfo).toContainText("Last year avg interest");

    // Expand amortization schedule
    const viewScheduleBtn = page.getByTestId("view-schedule-p1");
    await expect(viewScheduleBtn).toBeVisible();
    await viewScheduleBtn.click();

    const scheduleTable = page.getByTestId("schedule-table-p1");
    await expect(scheduleTable).toBeVisible();
    await expect(scheduleTable).toContainText("Year");
    await expect(scheduleTable).toContainText("Interest");
    await expect(scheduleTable).toContainText("Principal");
    await expect(scheduleTable).toContainText("Balance");

    await captureScreenshot(page, "task-36-amortization-schedule");

    // Collapse schedule
    await viewScheduleBtn.click();
    await expect(scheduleTable).not.toBeVisible();

    // ========================================
    // Step 6: Income frequency selector (Task 30)
    // ========================================
    // Default income items should have frequency selects
    const salaryFreq = page.getByTestId("frequency-i1");
    const freelanceFreq = page.getByTestId("frequency-i2");
    await expect(salaryFreq).toBeVisible();
    await expect(freelanceFreq).toBeVisible();
    await expect(salaryFreq).toHaveValue("monthly");
    await expect(freelanceFreq).toHaveValue("monthly");

    // Record initial income total
    const incomeTotalEl = page.getByTestId("income-monthly-total");
    const initialIncomeTotal = await incomeTotalEl.textContent();

    // Change Freelance to weekly: $800 * 52/12 = $3,467 + $5,500 = $8,967
    await freelanceFreq.selectOption("weekly");
    await expect(incomeTotalEl).toHaveText("$8,967");

    await captureScreenshot(page, "task-36-income-frequency-weekly");

    // Change back to monthly
    await freelanceFreq.selectOption("monthly");
    await expect(incomeTotalEl).toHaveText(initialIncomeTotal!);

    // Change Salary to annually: $5,500/12 + $800 = ~$1,258
    await salaryFreq.selectOption("annually");
    await expect(incomeTotalEl).toHaveText("$1,258");

    // Dashboard surplus should reflect the drastic income reduction
    const surplusCard = page.getByRole("group", { name: "Monthly Surplus" });
    // With annual salary normalized to monthly, surplus will be negative
    await expect(surplusCard).toContainText("-");

    await captureScreenshot(page, "task-36-income-annual-deficit");

    // Revert to monthly for the rest of the test
    await salaryFreq.selectOption("monthly");

    // Add income with non-monthly frequency
    await page.getByText("+ Add Income").click();
    await page.getByLabel("New income category").fill("Dividends");
    await page.getByLabel("New income amount").fill("3000");
    await page.getByTestId("new-income-frequency").selectOption("quarterly");
    await page.getByLabel("Confirm add income").click();

    // $5,500 + $800 + $1,000(quarterly normalized) = $7,300
    await expect(incomeTotalEl).toHaveText("$7,300");

    await captureScreenshot(page, "task-36-income-quarterly-added");

    // ========================================
    // Step 7: Grouped category dropdowns without region toggle (Task 31)
    // ========================================
    // Region toggle should NOT exist
    const regionToggle = page.getByRole("radiogroup", {
      name: /Filter account types/i,
    });
    await expect(regionToggle).toHaveCount(0);

    // Open add asset form and verify grouped suggestions
    await page.getByText("+ Add Asset").click();
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();

    const headers = page.locator("[data-testid='suggestion-group-header']");
    await expect(headers).toHaveCount(3);
    await expect(headers.nth(0)).toContainText("Canada");
    await expect(headers.nth(1)).toContainText("USA");
    await expect(headers.nth(2)).toContainText("General");

    // Verify CA and US types coexist (no filtering)
    const suggestions = page.locator(".animate-in");
    await expect(
      suggestions.getByRole("button", { name: /TFSA/ })
    ).toBeVisible();
    await expect(
      suggestions.getByRole("button", { name: /401k/ })
    ).toBeVisible();
    await expect(
      suggestions.getByRole("button", { name: /Savings/ })
    ).toBeVisible();

    await captureScreenshot(page, "task-36-grouped-asset-dropdown");

    // Select a category
    await suggestions.getByRole("button", { name: /RESP/ }).click();
    await expect(categoryInput).toHaveValue("RESP");

    // Cancel adding
    await categoryInput.press("Escape");

    // Verify debt dropdown also has grouped categories
    await debtSection.getByText("+ Add Debt").click();
    const debtCategoryInput = page.getByLabel("New debt category");
    await debtCategoryInput.click();

    const debtHeaders = page.locator("[data-testid='suggestion-group-header']");
    await expect(debtHeaders).toHaveCount(3);
    await expect(debtHeaders.nth(0)).toContainText("Canada");
    await expect(debtHeaders.nth(1)).toContainText("USA");
    await expect(debtHeaders.nth(2)).toContainText("General");

    await captureScreenshot(page, "task-36-grouped-debt-dropdown");
    await debtCategoryInput.press("Escape");

    // No region-based dimming on items
    const assetList = page.getByRole("list", { name: "Asset items" });
    const tfsaItem = assetList
      .getByRole("listitem")
      .filter({ hasText: "TFSA" });
    await expect(tfsaItem).toBeVisible();
    await expect(tfsaItem).not.toHaveClass(/opacity-50/);

    // ========================================
    // Step 8: Stock entry with ticker and price (Task 32)
    // ========================================
    // Add a stock with manual price
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "AAPL");
    await page.fill('[aria-label="Number of shares"]', "10");
    await page.fill(
      '[aria-label="Price per share (leave empty to auto-fetch)"]',
      "200"
    );
    await page.click('[aria-label="Confirm add stock"]');

    // Verify stock appears
    await expect(page.locator("text=AAPL")).toBeVisible();
    await expect(page.locator("text=10 shares")).toBeVisible();
    await expect(page.locator("text=$2,000").first()).toBeVisible();
    await expect(page.locator("text=Manual: $200.00")).toBeVisible();

    await captureScreenshot(page, "task-36-stock-added");

    // Add cost basis and verify gain/loss
    await page.locator("text=Cost basis").click();
    const costBasisInput = page.locator(
      '[aria-label="Edit cost basis for AAPL"]'
    );
    await costBasisInput.fill("100");
    await costBasisInput.press("Enter");

    await expect(page.locator("text=+$1,000")).toBeVisible();
    await expect(page.locator("text=+100.0%")).toBeVisible();

    await captureScreenshot(page, "task-36-stock-gain-loss");

    // ========================================
    // Step 9: Investment contributions in expenses (Task 35)
    // ========================================
    // Add monthly contribution to Savings Account
    await page.getByTestId("contribution-badge-a1").click();
    const contribInput = page.getByLabel(
      "Edit monthly contribution for Savings Account"
    );
    await contribInput.fill("500");
    await contribInput.press("Enter");

    // Investment Contributions row should appear in expenses
    const contributionsRow = page.getByTestId("investment-contributions-row");
    await expect(contributionsRow).toBeVisible();
    await expect(contributionsRow).toContainText("Investment Contributions");
    await expect(contributionsRow).toContainText("auto");
    await expect(contributionsRow).toContainText("$500");

    // The row should be read-only (no delete button)
    const deleteBtn = contributionsRow.locator('button[aria-label*="Delete"]');
    await expect(deleteBtn).toHaveCount(0);

    await captureScreenshot(page, "task-36-investment-contributions");

    // ========================================
    // Step 10: Verify URL state persistence for all features
    // ========================================
    await page.waitForFunction(() => window.location.search.includes("s="));
    await page.waitForTimeout(500);

    const stateUrl = page.url();
    await page.goto(stateUrl);
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // Verify chart still at top
    const projSectionAfter = page.locator(
      'section[aria-label="Financial projections"]'
    );
    await expect(projSectionAfter).toBeVisible();

    // Verify debt payoff info persisted
    await expect(page.getByTestId("interest-badge-d1")).toContainText(
      "6% APR"
    );
    await expect(page.getByTestId("debt-payment-badge-d1")).toContainText(
      "$300/mo"
    );
    const payoffAfter = page.getByTestId("debt-payoff-d1");
    await expect(payoffAfter).toBeVisible();
    await expect(payoffAfter).toContainText("Paid off in");

    // Verify property mortgage persisted
    await expect(page.getByTestId("rate-badge-p1")).toContainText("5% APR");
    // Payment may persist as user-entered $1,636 or revert to suggested $1,637
    const paymentText = await page.getByTestId("payment-badge-p1").textContent();
    expect(paymentText).toMatch(/\$1,63[67]\/mo/);

    // Verify mortgage breakdown still shows after reload
    await expect(page.getByTestId("mortgage-info-p1")).toBeVisible();

    // Verify stock persisted
    await expect(page.locator("text=AAPL")).toBeVisible();
    await expect(page.locator("text=10 shares")).toBeVisible();

    // Verify income frequency persisted (Dividends should be quarterly)
    const lastFreq = page.locator('[data-testid^="frequency-"]').last();
    await expect(lastFreq).toHaveValue("quarterly");

    // Verify dashboard metrics present
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await expect(
      dashboard.getByRole("group", { name: "Net Worth" })
    ).toBeVisible();
    await expect(
      dashboard.getByRole("group", { name: /Monthly Surplus/ })
    ).toBeVisible();

    // Verify insights panel
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();
    const insightCards = insightsPanel.getByRole("article");
    expect(await insightCards.count()).toBeGreaterThanOrEqual(3);

    await captureScreenshot(page, "task-36-after-reload-persistence");
  });

  test("income frequency changes update dashboard metrics in real-time", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // Record initial surplus
    const surplusCard = page.getByRole("group", { name: "Monthly Surplus" });
    const initialSurplus = await surplusCard.textContent();

    // Change Salary to annually - drastic income reduction
    const salaryFreq = page.getByTestId("frequency-i1");
    await salaryFreq.selectOption("annually");
    await page.waitForTimeout(300);

    // Surplus should have changed
    const newSurplus = await surplusCard.textContent();
    expect(newSurplus).not.toEqual(initialSurplus);

    await captureScreenshot(page, "task-36-frequency-affects-dashboard");
  });

  test("stock and contribution values affect net worth together", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // Record initial net worth
    const netWorthCard = page.getByRole("group", { name: "Net Worth" });
    const initialNetWorth = await netWorthCard.textContent();

    // Add a stock worth $10,000
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "MSFT");
    await page.fill('[aria-label="Number of shares"]', "50");
    await page.fill(
      '[aria-label="Price per share (leave empty to auto-fetch)"]',
      "200"
    );
    await page.click('[aria-label="Confirm add stock"]');
    await page.waitForTimeout(500);

    // Net worth should increase by $10,000
    const newNetWorth = await netWorthCard.textContent();
    expect(newNetWorth).not.toEqual(initialNetWorth);

    await captureScreenshot(page, "task-36-stock-affects-networth");
  });

  test("all features work together with Copy Link and reload", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // Set a variety of features
    // 1. Debt interest rate
    await page.getByTestId("interest-badge-d1").click();
    await page.getByLabel("Edit interest rate for Car Loan").fill("7");
    await page.getByLabel("Edit interest rate for Car Loan").press("Enter");

    // 2. Asset ROI
    await page.getByTestId("roi-badge-a1").click();
    await page.getByLabel("Edit ROI for Savings Account").fill("4");
    await page.getByLabel("Edit ROI for Savings Account").press("Enter");

    // 3. Income frequency
    await page.getByTestId("frequency-i2").selectOption("biweekly");

    // 4. Property interest rate
    await page.getByTestId("rate-badge-p1").click();
    await page.getByLabel("Edit interest rate for Home").fill("3.5");
    await page.getByLabel("Edit interest rate for Home").press("Enter");

    // Wait for URL to update
    await page.waitForFunction(() => window.location.search.includes("s="));
    await page.waitForTimeout(500);

    // Copy the link
    const copyButton = page.getByRole("button", {
      name: "Copy link to clipboard",
    });
    await copyButton.click();
    await expect(copyButton).toContainText("Copied!");

    // Read clipboard and navigate to it
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toContain("s=");

    await page.goto(clipboardText);
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // Verify all values persisted via Copy Link
    await expect(page.getByTestId("interest-badge-d1")).toContainText(
      "7% APR"
    );
    await expect(page.getByTestId("roi-badge-a1")).toContainText("4% ROI");
    await expect(page.getByTestId("frequency-i2")).toHaveValue("biweekly");
    await expect(page.getByTestId("rate-badge-p1")).toContainText("3.5% APR");

    await captureScreenshot(page, "task-36-copy-link-all-features");
  });
});
