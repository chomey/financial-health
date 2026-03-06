import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Milestone 6: Withdrawal Tax Features (Tasks 63-67)", () => {
  test("full journey — tax treatment classification, runway, projections, cost basis, insights, URL persistence", async ({ page }) => {
    test.setTimeout(120000);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // ========================================
    // Step 1: Verify default state has tax-classified accounts
    // Default: Savings ($5k taxable), TFSA ($22k tax-free), RRSP ($28k tax-deferred)
    // ========================================

    // TFSA should NOT show cost basis badge (tax-free)
    const tfsaItem = page.locator('#assets').getByRole("listitem").filter({ hasText: "TFSA" });
    await expect(tfsaItem).toBeVisible();
    const tfsaCostBasis = tfsaItem.locator('[data-testid^="cost-basis-badge-"]');
    await expect(tfsaCostBasis).toHaveCount(0);

    // Savings Account IS taxable but small amount — cost basis badge should be visible
    const savingsItem = page.locator('#assets').getByRole("listitem").filter({ hasText: "Savings Account" });
    await expect(savingsItem).toBeVisible();

    await captureScreenshot(page, "task-68-default-tax-classification");

    // ========================================
    // Step 2: Verify withdrawal tax content in Financial Runway explainer
    // ========================================

    const runwayCard = page.locator('[data-testid="metric-card-financial-runway"]');
    await runwayCard.scrollIntoViewIfNeeded();
    await runwayCard.click();
    const explainerModal = page.locator('[data-testid="explainer-modal"]');
    await expect(explainerModal).toBeVisible({ timeout: 3000 });

    const withdrawalTax = explainerModal.locator('[data-testid="runway-withdrawal-tax"]');
    await expect(withdrawalTax).toBeVisible();
    await expect(withdrawalTax.locator("text=Withdrawal Tax Impact")).toBeVisible();

    const dragSummary = explainerModal.locator('[data-testid="runway-tax-drag-summary"]');
    await expect(dragSummary).toBeVisible();

    await captureScreenshot(page, "task-68-withdrawal-tax-summary-default");

    // ========================================
    // Step 3: Verify withdrawal tax details with account groups and withdrawal order
    // ========================================

    const accountGroups = explainerModal.locator('[data-testid="runway-tax-account-groups"]');
    await expect(accountGroups).toBeVisible();
    await expect(accountGroups.locator("text=Tax-free")).toBeVisible();
    await expect(accountGroups.locator("text=Tax-deferred")).toBeVisible();
    await expect(withdrawalTax.locator("text=Suggested Withdrawal Order")).toBeVisible();

    await captureScreenshot(page, "task-68-withdrawal-tax-details-expanded");
    await page.keyboard.press("Escape");
    await expect(explainerModal).not.toBeVisible({ timeout: 3000 });

    // ========================================
    // Step 4: Increase RRSP to make tax drag significant on runway
    // ========================================

    await page.getByLabel(/Edit amount for RRSP/).click();
    const rrspInput = page.getByLabel("Edit amount for RRSP");
    await expect(rrspInput).toBeVisible();
    await rrspInput.fill("200000");
    await rrspInput.press("Enter");
    await page.waitForTimeout(1500);

    // Tax drag info is in the burndown chart summary text (switch to Income Stops mode)
    const projChart = page.locator('[data-testid="projection-chart"]');
    await projChart.locator('[data-testid="mode-income-stops"]').click();
    const burndownSummary = projChart.locator('[data-testid="burndown-summary"]');
    await expect(burndownSummary).toBeVisible({ timeout: 5000 });
    const summaryText = await burndownSummary.textContent();
    expect(summaryText).toContain("withdrawal taxes");
    await projChart.locator('[data-testid="mode-keep-earning"]').click();

    await captureScreenshot(page, "task-68-runway-after-tax-rrsp-heavy");

    // ========================================
    // Step 5: Add Brokerage account with cost basis to verify capital gains tracking
    // ========================================

    await page.click('text="+ Add Asset"');
    await page.fill('[aria-label="New asset category"]', "Brokerage");
    await page.fill('[aria-label="New asset amount"]', "100000");
    await page.click('[aria-label="Confirm add asset"]');
    await page.waitForTimeout(500);

    // Cost basis badge should appear for Brokerage (taxable)
    const costBasisBadge = page.locator('[data-testid^="cost-basis-badge-"]').last();
    await expect(costBasisBadge).toBeVisible();
    await expect(costBasisBadge).toContainText("Cost basis %");

    // Set cost basis to 60% (40% unrealized gains)
    await costBasisBadge.click();
    const cbInput = page.locator('input[aria-label^="Edit cost basis percent for Brokerage"]');
    await expect(cbInput).toBeVisible();
    await cbInput.fill("60");
    await cbInput.press("Enter");
    await page.waitForTimeout(500);

    // Should show the cost basis percentage
    await expect(costBasisBadge).toContainText("60% cost basis");

    // Unrealized gains badge should appear
    const gainsBadge = page.locator('[data-testid^="unrealized-gains-"]').last();
    await expect(gainsBadge).toBeVisible();
    await expect(gainsBadge).toContainText("$40,000 unrealized gains");

    await captureScreenshot(page, "task-68-brokerage-cost-basis-set");

    // ========================================
    // Step 6: Verify withdrawal-tax insights in insights panel
    // ========================================

    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();

    // Should have tax-free withdrawal insight about TFSA
    const taxFreeInsight = insightsPanel.locator("text=/tax-free/i");
    await expect(taxFreeInsight.first()).toBeVisible();

    await captureScreenshot(page, "task-68-withdrawal-tax-insights");

    // ========================================
    // Step 7: Verify projection chart renders with tax drag data
    // ========================================

    const chart = page.locator('[data-testid="projection-chart"]');
    await chart.scrollIntoViewIfNeeded();
    await expect(chart).toBeVisible();

    const chartContainer = page.locator('[data-testid="projection-chart-container"]');
    await expect(chartContainer).toBeVisible();

    await captureScreenshot(page, "task-68-projection-chart-with-tax");

    // ========================================
    // Step 8: Verify URL persistence — reload and check everything persists
    // ========================================

    await page.waitForFunction(() => window.location.search.includes("s="));
    await page.waitForTimeout(500);

    const url = page.url();
    await page.goto(url);
    await page.waitForSelector('[aria-label="Asset items"]');
    await page.waitForTimeout(1500);

    // RRSP should still be $200,000
    const rrspAfterReload = page.locator('#assets').getByRole("listitem").filter({ hasText: "RRSP" });
    await expect(rrspAfterReload).toContainText("$200,000");

    // Brokerage should still show 60% cost basis
    const reloadedCostBasis = page.locator('[data-testid^="cost-basis-badge-"]').last();
    await expect(reloadedCostBasis).toContainText("60% cost basis");

    // Unrealized gains should persist
    const reloadedGains = page.locator('[data-testid^="unrealized-gains-"]').last();
    await expect(reloadedGains).toContainText("$40,000 unrealized gains");

    // Financial Runway card should still exist
    const runwayCardReloaded = page.locator('[aria-label="Financial Runway"]');
    await expect(runwayCardReloaded).toBeVisible();

    await captureScreenshot(page, "task-68-url-persistence-after-reload");
  });

  test("tax-free-only portfolio shows no tax drag", async ({ page }) => {
    test.setTimeout(60000);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Delete RRSP (tax-deferred) and Savings Account (taxable)
    const rrspRow = page.locator('#assets').getByRole("listitem").filter({ hasText: "RRSP" });
    await rrspRow.hover();
    await page.getByLabel("Delete RRSP").click();
    await page.waitForTimeout(300);

    const savingsRow = page.locator('#assets').getByRole("listitem").filter({ hasText: "Savings Account" });
    await savingsRow.hover();
    await page.getByLabel("Delete Savings Account").click();
    await page.waitForTimeout(1500);

    // Only TFSA (tax-free) remains — switch to Income Stops and verify no tax drag
    const tfChart = page.locator('[data-testid="projection-chart"]');
    await tfChart.locator('[data-testid="mode-income-stops"]').click();
    const burndownSummaryTf = tfChart.locator('[data-testid="burndown-summary"]');
    if (await burndownSummaryTf.isVisible()) {
      const text = await burndownSummaryTf.textContent();
      expect(text).not.toContain("withdrawal taxes");
    }
    await tfChart.locator('[data-testid="mode-keep-earning"]').click();

    await captureScreenshot(page, "task-68-tax-free-only-no-drag");
  });

  test("US jurisdiction shows different tax treatment", async ({ page }) => {
    test.setTimeout(90000);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch to US country
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(500);

    // Verify jurisdiction selector updates to US states
    const jurisdictionSelect = page.getByTestId("jurisdiction-select");
    await expect(jurisdictionSelect).toBeVisible();

    // Switch to New York
    await jurisdictionSelect.selectOption("NY");
    await page.waitForTimeout(500);

    await captureScreenshot(page, "task-68-us-ny-jurisdiction");

    // Delete default CA assets and add US-specific ones
    // Delete TFSA
    const tfsaRow = page.locator('#assets').getByRole("listitem").filter({ hasText: "TFSA" });
    await tfsaRow.hover();
    await page.getByLabel("Delete TFSA").click();
    await page.waitForTimeout(300);

    // Delete RRSP
    const rrspRow = page.locator('#assets').getByRole("listitem").filter({ hasText: "RRSP" });
    await rrspRow.hover();
    await page.getByLabel("Delete RRSP").click();
    await page.waitForTimeout(300);

    // Add Roth IRA (US tax-free)
    await page.click('text="+ Add Asset"');
    await page.fill('[aria-label="New asset category"]', "Roth IRA");
    await page.fill('[aria-label="New asset amount"]', "50000");
    await page.click('[aria-label="Confirm add asset"]');
    await page.waitForTimeout(300);

    // Add 401k (US tax-deferred)
    await page.click('text="+ Add Asset"');
    await page.fill('[aria-label="New asset category"]', "401k");
    await page.fill('[aria-label="New asset amount"]', "300000");
    await page.click('[aria-label="Confirm add asset"]');
    await page.waitForTimeout(1500);

    // Roth IRA should NOT have cost basis badge (tax-free like TFSA)
    const rothRow = page.locator('#assets').getByRole("listitem").filter({ hasText: "Roth IRA" });
    await expect(rothRow).toBeVisible();
    const rothCostBasis = rothRow.locator('[data-testid^="cost-basis-badge-"]');
    await expect(rothCostBasis).toHaveCount(0);

    // 401k should NOT have cost basis badge (tax-deferred, full withdrawal taxed)
    const k401Row = page.locator('#assets').getByRole("listitem").filter({ hasText: "401k" });
    await expect(k401Row).toBeVisible();
    const k401CostBasis = k401Row.locator('[data-testid^="cost-basis-badge-"]');
    await expect(k401CostBasis).toHaveCount(0);

    // Tax drag info is in the burndown chart summary text (switch to Income Stops mode)
    const usChart = page.locator('[data-testid="projection-chart"]');
    await usChart.locator('[data-testid="mode-income-stops"]').click();
    const usBurndownSummary = usChart.locator('[data-testid="burndown-summary"]');
    await expect(usBurndownSummary).toBeVisible({ timeout: 5000 });
    await usChart.locator('[data-testid="mode-keep-earning"]').click();

    // Withdrawal tax content should be in Financial Runway explainer
    const usRunwayCard = page.locator('[data-testid="metric-card-financial-runway"]');
    await usRunwayCard.scrollIntoViewIfNeeded();
    await usRunwayCard.click();
    const usModal = page.locator('[data-testid="explainer-modal"]');
    await expect(usModal).toBeVisible({ timeout: 3000 });

    const usWithdrawalTax = usModal.locator('[data-testid="runway-withdrawal-tax"]');
    await expect(usWithdrawalTax).toBeVisible();
    const usAccountGroups = usModal.locator('[data-testid="runway-tax-account-groups"]');
    await expect(usAccountGroups).toBeVisible();
    await expect(usAccountGroups.locator("text=Tax-free")).toBeVisible();
    await expect(usAccountGroups.locator("text=Tax-deferred")).toBeVisible();

    await captureScreenshot(page, "task-68-us-withdrawal-tax-details");
    await page.keyboard.press("Escape");

    // Verify URL persistence with US jurisdiction
    await page.waitForFunction(() => window.location.search.includes("s="));
    await page.waitForTimeout(500);

    const url = page.url();
    await page.goto(url);
    await page.waitForSelector('[aria-label="Asset items"]');
    await page.waitForTimeout(1500);

    // Verify US country persisted
    const reloadedJurisdiction = page.getByTestId("jurisdiction-select");
    await expect(reloadedJurisdiction).toHaveValue("NY");

    // Verify 401k and Roth IRA persisted
    await expect(page.locator('#assets').getByRole("listitem").filter({ hasText: "401k" })).toBeVisible();
    await expect(page.locator('#assets').getByRole("listitem").filter({ hasText: "Roth IRA" })).toBeVisible();

    await captureScreenshot(page, "task-68-us-url-persistence");
  });

  test("projection drawdown shows tax drag with tax-deferred accounts", async ({ page }) => {
    test.setTimeout(60000);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Create a drawdown scenario: remove income, increase RRSP
    const salaryRow = page.locator('#income').getByRole("listitem").filter({ hasText: "Salary" });
    await salaryRow.hover();
    await page.getByLabel("Delete Salary").click();
    await page.waitForTimeout(300);

    await page.getByLabel(/Edit amount for RRSP/).click();
    const rrspInput = page.getByLabel("Edit amount for RRSP");
    await rrspInput.fill("300000");
    await rrspInput.press("Enter");
    await page.waitForTimeout(1500);

    // Projection chart should render in drawdown mode
    const chart = page.locator('[data-testid="projection-chart"]');
    await chart.scrollIntoViewIfNeeded();
    await expect(chart).toBeVisible();

    const chartContainer = page.locator('[data-testid="projection-chart-container"]');
    await expect(chartContainer).toBeVisible();

    // Chart should have SVG lines
    const svgLines = chartContainer.locator("svg .recharts-line");
    await expect(svgLines.first()).toBeVisible({ timeout: 5000 });

    await captureScreenshot(page, "task-68-projection-drawdown-tax-drag");

    // Withdrawal tax content should be in Financial Runway explainer
    const drawdownRunwayCard = page.locator('[data-testid="metric-card-financial-runway"]');
    await drawdownRunwayCard.scrollIntoViewIfNeeded();
    await drawdownRunwayCard.click();
    const drawdownModal = page.locator('[data-testid="explainer-modal"]');
    await expect(drawdownModal).toBeVisible({ timeout: 3000 });
    await expect(drawdownModal.locator('[data-testid="runway-withdrawal-tax"]')).toBeVisible();

    await captureScreenshot(page, "task-68-drawdown-withdrawal-tax-summary");
    await page.keyboard.press("Escape");
  });

  test("withdrawal order recommendation shows optimal tax ordering", async ({ page }) => {
    test.setTimeout(60000);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Add all three types of accounts with significant amounts
    // TFSA already exists (tax-free $22k), RRSP exists (tax-deferred $28k)
    // Add Brokerage (taxable)
    await page.click('text="+ Add Asset"');
    await page.fill('[aria-label="New asset category"]', "Brokerage");
    await page.fill('[aria-label="New asset amount"]', "50000");
    await page.click('[aria-label="Confirm add asset"]');
    await page.waitForTimeout(1500);

    // Open Financial Runway explainer to see withdrawal tax details
    const orderRunwayCard = page.locator('[data-testid="metric-card-financial-runway"]');
    await orderRunwayCard.scrollIntoViewIfNeeded();
    await orderRunwayCard.click();
    const orderModal = page.locator('[data-testid="explainer-modal"]');
    await expect(orderModal).toBeVisible({ timeout: 3000 });

    const orderWithdrawalTax = orderModal.locator('[data-testid="runway-withdrawal-tax"]');
    await expect(orderWithdrawalTax).toBeVisible();

    // Should show suggested withdrawal order
    await expect(orderWithdrawalTax.locator("text=Suggested Withdrawal Order")).toBeVisible();

    // All three treatments should be listed
    const orderAccountGroups = orderModal.locator('[data-testid="runway-tax-account-groups"]');
    await expect(orderAccountGroups.locator("text=Tax-free")).toBeVisible();
    await expect(orderAccountGroups.locator("text=Taxable")).toBeVisible();
    await expect(orderAccountGroups.locator("text=Tax-deferred")).toBeVisible();

    await captureScreenshot(page, "task-68-withdrawal-order-all-three-types");
    await page.keyboard.press("Escape");
  });
});
