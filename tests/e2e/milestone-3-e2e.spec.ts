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

test.describe("T3: Milestone 3 — Comprehensive E2E for tasks 27-35", () => {
  test.setTimeout(90000);

  test("full journey: scenario legend, debt payoff, income frequency, grouped dropdowns, stocks", async ({
    page,
  }) => {
    // ========================================
    // Step 1: Verify projection chart and scenario legend on dashboard
    // ========================================
    await page.goto("/?step=dashboard");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    const chart = page.getByTestId("projection-chart");
    await expect(chart).toBeVisible();

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
    // Step 2: Debt payoff timeline on debts step
    // ========================================
    await goToStep(page, "debts");

    // Set interest rate and payment on Car Loan (d1)
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
    // Step 3: Debt payoff warning for insufficient payment
    // ========================================
    await page.getByText("+ Add Debt").click();
    await page.getByLabel("New debt category").fill("Credit Card");
    const newDebtAmount = page.getByLabel("New debt amount");
    await newDebtAmount.fill("20000");
    await newDebtAmount.press("Enter");

    const debtsList = page.getByRole("list", { name: "Debt items" });
    await expect(debtsList).toContainText("Credit Card");

    // Set a tiny payment that won't cover interest ($20k at 19.9% ≈ $332/mo interest)
    const allPaymentBadges = page.locator('[data-testid^="debt-payment-badge-d"]');
    const lastPaymentBadge = allPaymentBadges.last();
    await lastPaymentBadge.click();
    const paymentInput = page.locator('[aria-label="Edit monthly payment for Credit Card"]');
    await expect(paymentInput).toBeVisible();
    await paymentInput.fill("100");
    await paymentInput.press("Enter");

    // Warning should appear
    const allWarnings = page.locator('[data-testid^="debt-payoff-warning-"]');
    await expect(allWarnings.last()).toBeVisible();
    await expect(allWarnings.last()).toContainText("balance will grow");

    await captureScreenshot(page, "task-36-debt-payoff-warning");

    // ========================================
    // Step 4: Income frequency selector
    // ========================================
    await goToStep(page, "income");

    // INITIAL_STATE has i1=Salary
    const salaryFreq = page.getByTestId("frequency-i1");
    await expect(salaryFreq).toBeVisible();
    await expect(salaryFreq).toHaveValue("monthly");

    const incomeTotalEl = page.getByTestId("income-monthly-total");
    const initialIncomeTotal = await incomeTotalEl.textContent();

    // Change Salary to annually: $4,500/12 = $375
    await salaryFreq.selectOption("annually");
    // Monthly total should drop significantly
    const newTotal = await incomeTotalEl.textContent();
    expect(newTotal).not.toEqual(initialIncomeTotal);

    await captureScreenshot(page, "task-36-income-annual-deficit");

    // Revert to monthly
    await salaryFreq.selectOption("monthly");

    // Add income with non-monthly frequency
    await page.getByText("+ Add Income").click();
    await page.getByLabel("New income category").fill("Dividends");
    await page.getByLabel("New income amount").fill("3000");
    await page.getByTestId("new-income-frequency").selectOption("quarterly");
    await page.getByLabel("Confirm add income").click();

    await captureScreenshot(page, "task-36-income-quarterly-added");

    // ========================================
    // Step 5: Grouped category dropdowns on assets step
    // ========================================
    await goToStep(page, "assets");

    // Region toggle should NOT exist
    const regionToggle = page.getByRole("radiogroup", { name: /Filter account types/i });
    await expect(regionToggle).toHaveCount(0);

    // Open add asset form and verify grouped suggestions
    await page.getByText("+ Add Asset").click();
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();

    const headers = page.locator("[data-testid='suggestion-group-header']");
    await expect(headers).toHaveCount(4);
    await expect(headers.nth(0)).toContainText("Canada");
    await expect(headers.nth(1)).toContainText("USA");
    await expect(headers.nth(2)).toContainText("Australia");
    await expect(headers.nth(3)).toContainText("General");

    await captureScreenshot(page, "task-36-grouped-asset-dropdown");

    // Select RESP
    const suggestions = page.locator(".animate-in");
    await suggestions.getByRole("button", { name: /RESP/ }).click();
    await expect(categoryInput).toHaveValue("RESP");
    await categoryInput.press("Escape");

    // No region-based dimming on items
    const assetList = page.getByRole("list", { name: "Asset items" });
    const tfsaItem = assetList.getByRole("listitem").filter({ hasText: "TFSA" });
    await expect(tfsaItem).toBeVisible();
    await expect(tfsaItem).not.toHaveClass(/opacity-50/);

    // ========================================
    // Step 6: Stock entry on stocks step
    // ========================================
    await goToStep(page, "stocks");

    await page.getByText("+ Add Stock").click();
    await page.fill('[aria-label="New stock ticker"]', "AAPL");
    await page.fill('[aria-label="Number of shares"]', "10");
    await page.click('[aria-label="Confirm add stock"]');

    // Verify stock appears (uses ticker button with aria-label)
    await expect(page.getByRole("button", { name: "Edit ticker for AAPL" })).toBeVisible();

    await captureScreenshot(page, "task-36-stock-added");

    // ========================================
    // Step 7: Verify URL state persistence after reload
    // ========================================
    await page.waitForFunction(() => window.location.search.includes("s="));
    await page.waitForTimeout(500);

    const stateUrl = page.url();
    await page.goto(stateUrl);

    // Stock should still be there
    await expect(page.getByRole("button", { name: "Edit ticker for AAPL" })).toBeVisible();

    // Verify debt settings persisted
    await goToStep(page, "debts");
    await expect(page.getByTestId("interest-badge-d1")).toContainText("6% APR");
    await expect(page.getByTestId("debt-payment-badge-d1")).toContainText("$300/mo");
    const payoffAfter = page.getByTestId("debt-payoff-d1");
    await expect(payoffAfter).toBeVisible();
    await expect(payoffAfter).toContainText("Paid off in");

    // Verify dashboard metrics present
    await goToStep(page, "dashboard");
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await expect(dashboard.getByRole("group", { name: "Net Worth" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Monthly Cash Flow" })).toBeVisible();

    // Verify insights panel
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();
    expect(await insightsPanel.getByRole("article").count()).toBeGreaterThanOrEqual(3);

    await captureScreenshot(page, "task-36-after-reload-persistence");
  });

  test("income frequency changes update dashboard metrics", async ({ page }) => {
    // Navigate to income step
    await page.goto("/?step=income");

    // Change Salary to annually — drastic income reduction
    const salaryFreq = page.getByTestId("frequency-i1");
    await salaryFreq.selectOption("annually");
    await page.waitForTimeout(300);

    // Navigate to dashboard to check surplus changed
    await goToStep(page, "dashboard");
    const surplusCard = page.getByRole("group", { name: "Monthly Cash Flow" });
    // With annual salary normalized to monthly (~$375), surplus will be negative
    await expect(surplusCard).toContainText("-");

    await captureScreenshot(page, "task-36-frequency-affects-dashboard");
  });

  test("adding stocks on stocks step", async ({ page }) => {
    // Add a stock on stocks step
    await page.goto("/?step=stocks");
    await page.getByText("+ Add Stock").click();
    await page.fill('[aria-label="New stock ticker"]', "MSFT");
    await page.fill('[aria-label="Number of shares"]', "50");
    await page.click('[aria-label="Confirm add stock"]');

    // Verify stock appears
    await expect(page.getByRole("button", { name: "Edit ticker for MSFT" })).toBeVisible();

    // Verify URL state persists after reload
    await page.waitForTimeout(500);
    const stateUrl = page.url();
    await page.goto(stateUrl);
    await expect(page.getByRole("button", { name: "Edit ticker for MSFT" })).toBeVisible();

    await captureScreenshot(page, "task-36-stock-affects-networth");
  });

  test("all features work together with Copy Link and reload", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // 1. Set debt interest rate
    await page.goto("/?step=debts");
    await page.getByTestId("interest-badge-d1").click();
    await page.getByLabel("Edit interest rate for Car Loan").fill("7");
    await page.getByLabel("Edit interest rate for Car Loan").press("Enter");
    await expect(page.getByTestId("interest-badge-d1")).toContainText("7% APR");
    // Wait for URL state to persist
    await page.waitForTimeout(500);

    // 2. Set asset ROI
    await goToStep(page, "assets");
    await page.getByTestId("roi-badge-a1").click();
    await page.getByLabel("Edit ROI for Savings Account").fill("4");
    await page.getByLabel("Edit ROI for Savings Account").press("Enter");

    // Wait for URL to update
    await page.waitForFunction(() => window.location.search.includes("s="));
    await page.waitForTimeout(500);

    // Copy the link on dashboard
    await goToStep(page, "dashboard");
    const copyButton = page.getByRole("button", { name: "Copy link to clipboard" });
    await copyButton.click();
    // Button shows green checkmark SVG after copying
    await expect(copyButton.locator("svg.text-emerald-500")).toBeVisible();

    // Read clipboard and navigate to it
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain("s=");

    await page.goto(clipboardText);
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // Verify values persisted via Copy Link — check on respective steps
    await goToStep(page, "debts");
    await expect(page.getByTestId("interest-badge-d1")).toContainText("7% APR");

    await goToStep(page, "assets");
    await expect(page.getByTestId("roi-badge-a1")).toContainText("4% ROI");

    await captureScreenshot(page, "task-36-copy-link-all-features");
  });
});
