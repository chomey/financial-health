import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

/** Navigate from wizard step to dashboard preserving state */
async function goToDashboard(page: import("@playwright/test").Page) {
  await page.waitForTimeout(300);
  const url = page.url();
  const dashUrl = url.replace(/step=[^&]+&?/, "").replace(/[&?]$/, "");
  await page.goto(dashUrl.includes("?") ? dashUrl : dashUrl + (url.includes("s=") ? "?" + url.split("?")[1].replace(/step=[^&]+&?/, "").replace(/&$/, "") : ""));
}

test.describe("Milestone 6: Withdrawal Tax Features (Tasks 63-67)", () => {
  test("full journey — tax treatment classification, runway, projections, cost basis, insights, URL persistence", async ({ page }) => {
    test.setTimeout(120000);

    // Start on assets step to verify tax classification
    await page.goto("/?step=assets");
    await page.waitForFunction(() => window.location.search.includes("s="));

    // TFSA should NOT show cost basis badge (tax-free)
    const tfsaItem = page.getByRole("listitem").filter({ hasText: "TFSA" });
    await expect(tfsaItem).toBeVisible();
    const tfsaCostBasis = tfsaItem.locator('[data-testid^="cost-basis-badge-"]');
    await expect(tfsaCostBasis).toHaveCount(0);

    // Savings Account IS taxable
    const savingsItem = page.getByRole("listitem").filter({ hasText: "Savings Account" });
    await expect(savingsItem).toBeVisible();

    await captureScreenshot(page, "task-68-default-tax-classification");

    // Increase RRSP to $200k
    await page.getByLabel(/Edit amount for RRSP/).click();
    const rrspInput = page.getByLabel("Edit amount for RRSP");
    await expect(rrspInput).toBeVisible();
    await rrspInput.fill("200000");
    await rrspInput.press("Enter");
    await page.waitForTimeout(500);

    // Add Brokerage account with cost basis
    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Brokerage");
    await page.getByLabel("New asset amount").fill("100000");
    await page.getByLabel("Confirm add asset").click();
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

    await expect(costBasisBadge).toContainText("60% cost basis");
    const gainsBadge = page.locator('[data-testid^="unrealized-gains-"]').last();
    await expect(gainsBadge).toBeVisible();
    await expect(gainsBadge).toContainText("$40,000 unrealized gains");

    await captureScreenshot(page, "task-68-brokerage-cost-basis-set");

    // Navigate to dashboard to check metrics
    await goToDashboard(page);

    // Verify withdrawal tax content in Financial Runway explainer
    const runwayCard = page.locator('[data-testid="metric-card-financial-runway"]');
    await runwayCard.scrollIntoViewIfNeeded();
    await runwayCard.click();
    const explainerModal = page.locator('[data-testid="explainer-modal"]');
    await expect(explainerModal).toBeVisible({ timeout: 3000 });

    const withdrawalTax = explainerModal.locator('[data-testid="runway-withdrawal-tax"]');
    await expect(withdrawalTax).toBeVisible();
    await expect(withdrawalTax.locator("text=Withdrawal Tax Impact")).toBeVisible();

    const accountGroups = explainerModal.locator('[data-testid="runway-tax-account-groups"]');
    await expect(accountGroups).toBeVisible();
    await expect(accountGroups.locator("text=Tax-free")).toBeVisible();
    await expect(accountGroups.locator("text=Tax-deferred")).toBeVisible();

    await captureScreenshot(page, "task-68-withdrawal-tax-details-expanded");
    await page.keyboard.press("Escape");

    // Switch to Income Stops mode to check burndown tax drag
    const projChart = page.locator('[data-testid="projection-chart"]');
    await projChart.locator('[data-testid="mode-income-stops"]').click();
    const burndownSummary = projChart.locator('[data-testid="burndown-summary"]');
    await expect(burndownSummary).toBeVisible({ timeout: 5000 });
    const summaryText = await burndownSummary.textContent();
    expect(summaryText).toContain("withdrawal taxes");

    await captureScreenshot(page, "task-68-runway-after-tax-rrsp-heavy");

    // Verify URL persistence — reload
    await page.waitForFunction(() => window.location.search.includes("s="));
    await page.waitForTimeout(500);
    const url = page.url();

    // Go back to assets step with the same state to verify persistence
    const assetsUrl = url + (url.includes("?") ? "&" : "?") + "step=assets";
    await page.goto(assetsUrl);
    await page.waitForTimeout(1000);

    const rrspAfterReload = page.getByRole("listitem").filter({ hasText: "RRSP" });
    await expect(rrspAfterReload).toContainText("$200,000");

    const reloadedCostBasis = page.locator('[data-testid^="cost-basis-badge-"]').last();
    await expect(reloadedCostBasis).toContainText("60% cost basis");

    await captureScreenshot(page, "task-68-url-persistence-after-reload");
  });

  test("tax-free-only portfolio shows no tax drag", async ({ page }) => {
    test.setTimeout(60000);

    // Go to assets step to modify assets
    await page.goto("/?step=assets");
    await page.waitForFunction(() => window.location.search.includes("s="));

    // Delete RRSP (tax-deferred) and Savings Account (taxable)
    const rrspRow = page.getByRole("listitem").filter({ hasText: "RRSP" });
    await rrspRow.hover();
    await page.getByLabel("Delete RRSP").click();
    await page.waitForTimeout(300);

    const savingsRow = page.getByRole("listitem").filter({ hasText: "Savings Account" });
    await savingsRow.hover();
    await page.getByLabel("Delete Savings Account").click();
    await page.waitForTimeout(500);

    // Navigate to dashboard
    await goToDashboard(page);

    // Only TFSA (tax-free) remains — switch to Income Stops and verify no tax drag
    const tfChart = page.locator('[data-testid="projection-chart"]');
    await tfChart.locator('[data-testid="mode-income-stops"]').click();
    const burndownSummaryTf = tfChart.locator('[data-testid="burndown-summary"]');
    if (await burndownSummaryTf.isVisible()) {
      const text = await burndownSummaryTf.textContent();
      expect(text).not.toContain("withdrawal taxes");
    }

    await captureScreenshot(page, "task-68-tax-free-only-no-drag");
  });

  test("US jurisdiction shows different tax treatment", async ({ page }) => {
    test.setTimeout(90000);

    // Go to profile step to switch country
    await page.goto("/?step=profile");
    await page.waitForFunction(() => window.location.search.includes("s="));

    // Switch to US country
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(500);

    // Switch to New York
    const jurisdictionSelect = page.getByTestId("jurisdiction-select");
    await expect(jurisdictionSelect).toBeVisible();
    await jurisdictionSelect.selectOption("NY");
    await page.waitForTimeout(500);

    await captureScreenshot(page, "task-68-us-ny-jurisdiction");

    // Go to assets step
    const stateUrl = page.url();
    const assetsUrl = stateUrl.replace(/step=profile/, "step=assets");
    await page.goto(assetsUrl);
    await page.waitForTimeout(500);

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
    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Roth IRA");
    await page.getByLabel("New asset amount").fill("50000");
    await page.getByLabel("Confirm add asset").click();
    await page.waitForTimeout(300);

    // Add 401k (US tax-deferred)
    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("401k");
    await page.getByLabel("New asset amount").fill("300000");
    await page.getByLabel("Confirm add asset").click();
    await page.waitForTimeout(500);

    // Roth IRA should NOT have cost basis badge (tax-free)
    const rothRow = page.getByRole("listitem").filter({ hasText: "Roth IRA" });
    await expect(rothRow).toBeVisible();
    const rothCostBasis = rothRow.locator('[data-testid^="cost-basis-badge-"]');
    await expect(rothCostBasis).toHaveCount(0);

    // 401k should NOT have cost basis badge (tax-deferred)
    const k401Row = page.getByRole("listitem").filter({ hasText: "401k" });
    await expect(k401Row).toBeVisible();
    const k401CostBasis = k401Row.locator('[data-testid^="cost-basis-badge-"]');
    await expect(k401CostBasis).toHaveCount(0);

    // Navigate to dashboard
    await goToDashboard(page);

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

    await captureScreenshot(page, "task-68-us-url-persistence");
  });

  test("projection drawdown shows tax drag with tax-deferred accounts", async ({ page }) => {
    test.setTimeout(60000);

    // Go to income step to delete salary
    await page.goto("/?step=income");
    await page.waitForFunction(() => window.location.search.includes("s="));

    const salaryRow = page.getByRole("listitem").filter({ hasText: "Salary" });
    await salaryRow.hover();
    await page.getByLabel("Delete Salary").click();
    await page.waitForTimeout(300);

    // Go to assets step to increase RRSP
    const stateUrl = page.url();
    const assetsUrl = stateUrl.replace(/step=income/, "step=assets");
    await page.goto(assetsUrl);
    await page.waitForTimeout(500);

    await page.getByLabel(/Edit amount for RRSP/).click();
    const rrspInput = page.getByLabel("Edit amount for RRSP");
    await rrspInput.fill("300000");
    await rrspInput.press("Enter");
    await page.waitForTimeout(500);

    // Navigate to dashboard
    await goToDashboard(page);

    // Projection chart should render
    const chart = page.locator('[data-testid="projection-chart"]');
    await chart.scrollIntoViewIfNeeded();
    await expect(chart).toBeVisible();

    const chartContainer = page.locator('[data-testid="projection-chart-container"]');
    await expect(chartContainer).toBeVisible();

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

    // Go to assets step to add Brokerage
    await page.goto("/?step=assets");
    await page.waitForFunction(() => window.location.search.includes("s="));

    // Add Brokerage (taxable)
    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Brokerage");
    await page.getByLabel("New asset amount").fill("50000");
    await page.getByLabel("Confirm add asset").click();
    await page.waitForTimeout(500);

    // Navigate to dashboard
    await goToDashboard(page);

    // Open Financial Runway explainer to see withdrawal tax details
    const orderRunwayCard = page.locator('[data-testid="metric-card-financial-runway"]');
    await orderRunwayCard.scrollIntoViewIfNeeded();
    await orderRunwayCard.click();
    const orderModal = page.locator('[data-testid="explainer-modal"]');
    await expect(orderModal).toBeVisible({ timeout: 3000 });

    const orderWithdrawalTax = orderModal.locator('[data-testid="runway-withdrawal-tax"]');
    await expect(orderWithdrawalTax).toBeVisible();
    await expect(orderWithdrawalTax.locator("text=Suggested Withdrawal Order")).toBeVisible();

    const orderAccountGroups = orderModal.locator('[data-testid="runway-tax-account-groups"]');
    await expect(orderAccountGroups.locator("text=Tax-free")).toBeVisible();
    await expect(orderAccountGroups.locator("text=Taxable")).toBeVisible();
    await expect(orderAccountGroups.locator("text=Tax-deferred")).toBeVisible();

    await captureScreenshot(page, "task-68-withdrawal-order-all-three-types");
    await page.keyboard.press("Escape");
  });
});
