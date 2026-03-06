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
    const tfsaItem = page.getByRole("listitem").filter({ hasText: "TFSA" });
    await expect(tfsaItem).toBeVisible();
    const tfsaCostBasis = tfsaItem.locator('[data-testid^="cost-basis-badge-"]');
    await expect(tfsaCostBasis).toHaveCount(0);

    // Savings Account IS taxable but small amount — cost basis badge should be visible
    const savingsItem = page.getByRole("listitem").filter({ hasText: "Savings Account" });
    await expect(savingsItem).toBeVisible();

    await captureScreenshot(page, "task-68-default-tax-classification");

    // ========================================
    // Step 2: Verify withdrawal tax summary card is present
    // ========================================

    const summary = page.locator('[data-testid="withdrawal-tax-summary"]');
    await summary.scrollIntoViewIfNeeded();
    await expect(summary).toBeVisible();
    await expect(summary.locator("text=Withdrawal Tax Impact")).toBeVisible();

    const dragSummary = page.locator('[data-testid="tax-drag-summary"]');
    await expect(dragSummary).toBeVisible();

    await captureScreenshot(page, "task-68-withdrawal-tax-summary-default");

    // ========================================
    // Step 3: Expand withdrawal tax details — see account breakdown and withdrawal order
    // ========================================

    const toggle = page.locator('[data-testid="withdrawal-tax-toggle"]');
    await toggle.click();

    const details = page.locator('[data-testid="withdrawal-tax-details"]');
    await expect(details).toBeVisible();
    await expect(details.locator("text=Optimal withdrawal order")).toBeVisible();
    await expect(details.locator("text=Tax-free")).toBeVisible();
    await expect(details.locator("text=Tax-deferred")).toBeVisible();

    await captureScreenshot(page, "task-68-withdrawal-tax-details-expanded");

    // Collapse it
    await toggle.click();
    await expect(details).not.toBeVisible();

    // ========================================
    // Step 4: Increase RRSP to make tax drag significant on runway
    // ========================================

    await page.getByLabel(/Edit amount for RRSP/).click();
    const rrspInput = page.getByLabel("Edit amount for RRSP");
    await expect(rrspInput).toBeVisible();
    await rrspInput.fill("200000");
    await rrspInput.press("Enter");
    await page.waitForTimeout(1500);

    // Runway should now show tax-adjusted value
    const afterTaxElement = page.locator('[data-testid="runway-after-tax"]');
    await expect(afterTaxElement).toBeVisible({ timeout: 5000 });
    const afterTaxText = await afterTaxElement.textContent();
    expect(afterTaxText).toContain("after withdrawal tax");
    expect(afterTaxText).toContain("mo");

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
    const rrspAfterReload = page.getByRole("listitem").filter({ hasText: "RRSP" });
    await expect(rrspAfterReload).toContainText("$200,000");

    // Brokerage should still show 60% cost basis
    const reloadedCostBasis = page.locator('[data-testid^="cost-basis-badge-"]').last();
    await expect(reloadedCostBasis).toContainText("60% cost basis");

    // Unrealized gains should persist
    const reloadedGains = page.locator('[data-testid^="unrealized-gains-"]').last();
    await expect(reloadedGains).toContainText("$40,000 unrealized gains");

    // Withdrawal tax summary should still be visible
    const summaryReloaded = page.locator('[data-testid="withdrawal-tax-summary"]');
    await summaryReloaded.scrollIntoViewIfNeeded();
    await expect(summaryReloaded).toBeVisible();

    // Runway after tax should still display
    const afterTaxReloaded = page.locator('[data-testid="runway-after-tax"]');
    await expect(afterTaxReloaded).toBeVisible({ timeout: 5000 });

    await captureScreenshot(page, "task-68-url-persistence-after-reload");
  });

  test("tax-free-only portfolio shows no tax drag", async ({ page }) => {
    test.setTimeout(60000);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Delete RRSP (tax-deferred) and Savings Account (taxable)
    const rrspRow = page.getByRole("listitem").filter({ hasText: "RRSP" });
    await rrspRow.hover();
    await page.getByLabel("Delete RRSP").click();
    await page.waitForTimeout(300);

    const savingsRow = page.getByRole("listitem").filter({ hasText: "Savings Account" });
    await savingsRow.hover();
    await page.getByLabel("Delete Savings Account").click();
    await page.waitForTimeout(1500);

    // Only TFSA (tax-free) remains — no tax drag annotation
    const afterTaxElement = page.locator('[data-testid="runway-after-tax"]');
    await expect(afterTaxElement).not.toBeVisible();

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
    const tfsaRow = page.getByRole("listitem").filter({ hasText: "TFSA" });
    await tfsaRow.hover();
    await page.getByLabel("Delete TFSA").click();
    await page.waitForTimeout(300);

    // Delete RRSP
    const rrspRow = page.getByRole("listitem").filter({ hasText: "RRSP" });
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
    const rothRow = page.getByRole("listitem").filter({ hasText: "Roth IRA" });
    await expect(rothRow).toBeVisible();
    const rothCostBasis = rothRow.locator('[data-testid^="cost-basis-badge-"]');
    await expect(rothCostBasis).toHaveCount(0);

    // 401k should NOT have cost basis badge (tax-deferred, full withdrawal taxed)
    const k401Row = page.getByRole("listitem").filter({ hasText: "401k" });
    await expect(k401Row).toBeVisible();
    const k401CostBasis = k401Row.locator('[data-testid^="cost-basis-badge-"]');
    await expect(k401CostBasis).toHaveCount(0);

    // Tax-adjusted runway should show with 401k heavy portfolio
    const afterTaxElement = page.locator('[data-testid="runway-after-tax"]');
    await expect(afterTaxElement).toBeVisible({ timeout: 5000 });

    // Withdrawal tax summary should show US tax treatments
    const summary = page.locator('[data-testid="withdrawal-tax-summary"]');
    await summary.scrollIntoViewIfNeeded();
    await expect(summary).toBeVisible();

    // Expand to see breakdown
    const expandToggle = page.locator('[data-testid="withdrawal-tax-toggle"]');
    await expandToggle.click();

    const taxDetails = page.locator('[data-testid="withdrawal-tax-details"]');
    await expect(taxDetails).toBeVisible();
    await expect(taxDetails.locator("text=Tax-free")).toBeVisible();
    await expect(taxDetails.locator("text=Tax-deferred")).toBeVisible();

    await captureScreenshot(page, "task-68-us-withdrawal-tax-details");

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
    await expect(page.getByRole("listitem").filter({ hasText: "401k" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "Roth IRA" })).toBeVisible();

    await captureScreenshot(page, "task-68-us-url-persistence");
  });

  test("projection drawdown shows tax drag with tax-deferred accounts", async ({ page }) => {
    test.setTimeout(60000);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Create a drawdown scenario: remove income, increase RRSP
    const salaryRow = page.getByRole("listitem").filter({ hasText: "Salary" });
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

    // Withdrawal tax summary should show high tax drag in drawdown
    const summary = page.locator('[data-testid="withdrawal-tax-summary"]');
    await summary.scrollIntoViewIfNeeded();
    await expect(summary).toBeVisible();

    await captureScreenshot(page, "task-68-drawdown-withdrawal-tax-summary");
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

    // Expand withdrawal tax details
    const summary = page.locator('[data-testid="withdrawal-tax-summary"]');
    await summary.scrollIntoViewIfNeeded();
    await expect(summary).toBeVisible();

    const expandToggle = page.locator('[data-testid="withdrawal-tax-toggle"]');
    await expandToggle.click();

    const taxDetails = page.locator('[data-testid="withdrawal-tax-details"]');
    await expect(taxDetails).toBeVisible();

    // Should show optimal withdrawal order
    await expect(taxDetails.locator("text=Optimal withdrawal order")).toBeVisible();

    // All three treatments should be listed
    await expect(taxDetails.locator("text=Tax-free")).toBeVisible();
    await expect(taxDetails.locator("text=Taxable")).toBeVisible();
    await expect(taxDetails.locator("text=Tax-deferred")).toBeVisible();

    await captureScreenshot(page, "task-68-withdrawal-order-all-three-types");
  });
});
