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

test.describe("T3: Milestone 2 — Comprehensive E2E for features from tasks 22-25", () => {
  test("full journey: asset ROI, debt interest, projection chart, grouped suggestions", async ({
    page,
  }) => {
    // ========================================
    // Step 1: Verify initial asset ROI badges on assets step
    // ========================================
    await page.goto("/?step=assets");

    // INITIAL_STATE: a1=Savings $5k, a2=TFSA $22k, a3=RRSP $28k
    const savingsRoi = page.getByTestId("roi-badge-a1");
    await expect(savingsRoi).toBeVisible();
    await expect(savingsRoi).toContainText("2% ROI (suggested)");

    const tfsaRoi = page.getByTestId("roi-badge-a2");
    await expect(tfsaRoi).toBeVisible();
    await expect(tfsaRoi).toContainText("5% ROI (suggested)");

    const rrspRoi = page.getByTestId("roi-badge-a3");
    await expect(rrspRoi).toBeVisible();
    await expect(rrspRoi).toContainText("5% ROI (suggested)");

    // Contribution badges should show placeholders
    await expect(page.getByTestId("contribution-badge-a1")).toBeVisible();
    await expect(page.getByTestId("contribution-badge-a1")).toContainText("Monthly contribution");

    await captureScreenshot(page, "task-26-initial-state-with-features");

    // ========================================
    // Step 2: Edit asset ROI and contribution
    // ========================================
    // Set custom ROI on TFSA
    await page.getByTestId("roi-badge-a2").click();
    const roiInput = page.getByLabel("Edit ROI for TFSA");
    await expect(roiInput).toBeVisible();
    await roiInput.fill("8");
    await roiInput.press("Enter");
    await expect(page.getByTestId("roi-badge-a2")).toContainText("8% ROI");
    await expect(page.getByTestId("roi-badge-a2")).not.toContainText("suggested");

    // Set monthly contribution on TFSA
    await page.getByTestId("contribution-badge-a2").click();
    const contribInput = page.getByLabel("Edit monthly contribution for TFSA");
    await expect(contribInput).toBeVisible();
    await contribInput.fill("500");
    await contribInput.press("Enter");
    await expect(page.getByTestId("contribution-badge-a2")).toContainText("+$500/mo");

    // Set ROI on Savings Account
    await page.getByTestId("roi-badge-a1").click();
    const savingsRoiInput = page.getByLabel("Edit ROI for Savings Account");
    await savingsRoiInput.fill("3");
    await savingsRoiInput.press("Enter");
    await expect(page.getByTestId("roi-badge-a1")).toContainText("3% ROI");

    // Set contribution on Savings Account
    await page.getByTestId("contribution-badge-a1").click();
    const savingsContribInput = page.getByLabel("Edit monthly contribution for Savings Account");
    await savingsContribInput.fill("200");
    await savingsContribInput.press("Enter");
    await expect(page.getByTestId("contribution-badge-a1")).toContainText("+$200/mo");

    await captureScreenshot(page, "task-26-asset-roi-and-contributions-set");

    // ========================================
    // Step 3: Edit debt interest rate and payment
    // ========================================
    await goToStep(page, "debts");

    // INITIAL_STATE: d1=Car Loan $5k
    const debtInterest = page.getByTestId("interest-badge-d1");
    await expect(debtInterest).toBeVisible();
    await expect(debtInterest).toContainText("APR");

    await page.getByTestId("interest-badge-d1").click();
    const debtRateInput = page.getByLabel("Edit interest rate for Car Loan");
    await expect(debtRateInput).toBeVisible();
    await debtRateInput.fill("5.5");
    await debtRateInput.press("Enter");
    await expect(page.getByTestId("interest-badge-d1")).toContainText("5.5% APR");
    await expect(page.getByTestId("interest-badge-d1")).not.toContainText("suggested");

    // Set monthly payment for debt
    await page.getByTestId("debt-payment-badge-d1").click();
    const debtPaymentInput = page.getByLabel("Edit monthly payment for Car Loan");
    await expect(debtPaymentInput).toBeVisible();
    await debtPaymentInput.fill("350");
    await debtPaymentInput.press("Enter");
    await expect(page.getByTestId("debt-payment-badge-d1")).toContainText("$350/mo");

    // Add a high-interest debt
    await page.getByText("+ Add Debt").click();
    await page.getByLabel("New debt category").fill("Credit Card");
    const newDebtAmount = page.getByLabel("New debt amount");
    await newDebtAmount.fill("8000");
    await newDebtAmount.press("Enter");
    const debtsList = page.getByRole("list", { name: "Debt items" });
    await expect(debtsList).toContainText("Credit Card");

    await captureScreenshot(page, "task-26-debt-interest-set");

    // ========================================
    // Step 4: Verify projection chart on dashboard
    // ========================================
    await goToStep(page, "dashboard");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    const projChart = page.getByTestId("projection-chart");
    await expect(projChart).toBeVisible();
    await expect(projChart.getByTestId("projection-chart-container")).toBeVisible();

    // Verify scenario buttons
    await expect(projChart.getByTestId("scenario-conservative")).toBeVisible();
    await expect(projChart.getByTestId("scenario-moderate")).toBeVisible();
    await expect(projChart.getByTestId("scenario-optimistic")).toBeVisible();

    // Verify legend labels (use first() as text may appear in both legend and table)
    await expect(projChart.getByText("Net Worth", { exact: true }).first()).toBeVisible();
    await expect(projChart.getByText("Assets", { exact: true }).first()).toBeVisible();
    await expect(projChart.getByText("Debts", { exact: true }).first()).toBeVisible();

    await captureScreenshot(page, "task-26-projection-chart-default");

    // ========================================
    // Step 5: Test scenario toggling
    // ========================================
    const conservativeBtn = projChart.getByTestId("scenario-conservative");
    await conservativeBtn.click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    await expect(conservativeBtn).toHaveCSS("background-color", "rgb(245, 158, 11)");

    await captureScreenshot(page, "task-26-scenario-conservative");

    const optimisticBtn = projChart.getByTestId("scenario-optimistic");
    await optimisticBtn.click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    await expect(optimisticBtn).toHaveCSS("background-color", "rgb(96, 165, 250)");

    await captureScreenshot(page, "task-26-scenario-optimistic");

    const moderateBtn = projChart.getByTestId("scenario-moderate");
    await moderateBtn.click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    await expect(moderateBtn).toHaveCSS("background-color", "rgb(52, 211, 153)");

    // ========================================
    // Step 6: Verify grouped suggestions on assets step
    // ========================================
    await goToStep(page, "assets");
    await page.getByText("+ Add Asset").click();
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();

    const headers = page.locator("[data-testid='suggestion-group-header']");
    await expect(headers).toHaveCount(4);
    await expect(headers.nth(0)).toContainText("Canada");
    await expect(headers.nth(1)).toContainText("USA");
    await expect(headers.nth(2)).toContainText("Australia");
    await expect(headers.nth(3)).toContainText("General");

    await captureScreenshot(page, "task-26-grouped-suggestions");
    await categoryInput.press("Escape");

    // ========================================
    // Step 7: Verify URL state persistence after reload
    // ========================================
    await page.waitForFunction(() => window.location.search.includes("s="));
    await page.waitForTimeout(500);

    const stateUrl = page.url();
    await page.goto(stateUrl);

    // Verify asset ROI persisted
    await expect(page.getByTestId("roi-badge-a1")).toContainText("3% ROI");
    await expect(page.getByTestId("roi-badge-a1")).not.toContainText("suggested");
    await expect(page.getByTestId("roi-badge-a2")).toContainText("8% ROI");
    await expect(page.getByTestId("roi-badge-a2")).not.toContainText("suggested");

    // Verify contributions persisted
    await expect(page.getByTestId("contribution-badge-a2")).toContainText("+$500/mo");

    // Verify debt interest persisted
    await goToStep(page, "debts");
    await expect(page.getByTestId("interest-badge-d1")).toContainText("5.5% APR");
    await expect(page.getByTestId("interest-badge-d1")).not.toContainText("suggested");
    await expect(page.getByTestId("debt-payment-badge-d1")).toContainText("$350/mo");

    // Verify projection chart still renders on dashboard
    await goToStep(page, "dashboard");
    const chartAfterReload = page.getByTestId("projection-chart");
    await expect(chartAfterReload).toBeVisible();
    await expect(chartAfterReload.getByTestId("projection-chart-container")).toBeVisible();

    // Verify dashboard metrics
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await expect(dashboard.getByRole("group", { name: "Net Worth" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Monthly Cash Flow" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Financial Runway" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Debt-to-Asset Ratio" })).toBeVisible();

    // Insights should be present
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();
    expect(await insightsPanel.getByRole("article").count()).toBeGreaterThanOrEqual(3);

    await captureScreenshot(page, "task-26-final-state");
  });

  test("projection chart responds to data changes in real-time", async ({ page }) => {
    await page.goto("/?step=dashboard");
    await page.waitForSelector('[data-testid="projection-chart"]');

    const chart = page.getByTestId("projection-chart");
    await expect(chart.getByTestId("projection-chart-container")).toBeVisible();

    // Add a large asset on the assets step
    await goToStep(page, "assets");
    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("401k");
    await page.getByLabel("New asset amount").fill("100000");
    await page.getByLabel("Confirm add asset").click();

    // Go back to dashboard — chart should still render with updated data
    await goToStep(page, "dashboard");
    await expect(chart.getByTestId("projection-chart-container")).toBeVisible();
    await expect(chart.getByText("Financial Projection")).toBeVisible();

    await captureScreenshot(page, "task-26-chart-after-adding-asset");
  });

  test("all feature fields work together with URL copy and reload", async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);

    // Set ROI on RRSP (a3) on assets step
    await page.goto("/?step=assets");
    await page.getByTestId("roi-badge-a3").click();
    await page.getByLabel("Edit ROI for RRSP").fill("10");
    await page.getByLabel("Edit ROI for RRSP").press("Enter");
    await expect(page.getByTestId("roi-badge-a3")).toContainText("10% ROI");

    // Set debt interest rate on debts step
    await goToStep(page, "debts");
    await page.getByTestId("interest-badge-d1").click();
    await page.getByLabel("Edit interest rate for Car Loan").fill("4");
    await page.getByLabel("Edit interest rate for Car Loan").press("Enter");

    // Wait for URL to update
    await page.waitForFunction(() => window.location.search.includes("s="));
    await page.waitForTimeout(500);

    // Go to dashboard to copy the link
    await goToStep(page, "dashboard");
    const copyButton = page.getByRole("button", { name: "Copy link to clipboard" });
    await copyButton.click();
    // Button shows green checkmark SVG after copying
    await expect(copyButton.locator("svg.text-emerald-500")).toBeVisible();

    // Read clipboard and navigate to it
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain("s=");

    // Navigate to clipboard URL — should go to dashboard
    await page.goto(clipboardText);
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // Verify custom values persisted — go to assets step
    await goToStep(page, "assets");
    await expect(page.getByTestId("roi-badge-a3")).toContainText("10% ROI");
    await expect(page.getByTestId("roi-badge-a3")).not.toContainText("suggested");

    await goToStep(page, "debts");
    await expect(page.getByTestId("interest-badge-d1")).toContainText("4% APR");

    await captureScreenshot(page, "task-26-copy-link-persistence");
  });
});
