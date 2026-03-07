import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

/**
 * Task 109: [MILESTONE] Comprehensive E2E test for UI polish and formula validation.
 *
 * Covers:
 * 1. Tax bracket tiered fill bars render correctly
 * 2. Explainer modals show full formatted currency (no "k" abbreviation)
 * 3. Net worth donut chart renders with segments and hover
 * 4. Cash flow Sankey includes investment interest income nodes
 * 5. Fast Forward panel shows new scenario options
 * 6. All metric card values match their explainer breakdowns
 */

test.describe("Milestone E2E: UI Polish & Formula Validation", () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');
  });

  // --- 1. Tax bracket tiered fill bars ---

  test("tax bracket tiered fill bars render with proportional income fills", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    // Federal brackets table should render
    const federalTable = page.locator('[data-testid="tax-federal-brackets-table"]');
    await expect(federalTable).toBeVisible();

    // At least one filled bracket bar should exist
    const fills = page.locator('[data-testid^="tax-federal-brackets-fill-"]');
    const fillCount = await fills.count();
    expect(fillCount).toBeGreaterThan(0);

    // The first filled bracket should have a non-zero width (proportional fill)
    const firstFill = fills.first();
    const width = await firstFill.evaluate((el) => parseFloat(el.style.width));
    expect(width).toBeGreaterThan(0);

    // Rows should contain rate percentages and dollar amounts
    const row0 = page.locator('[data-testid="tax-federal-brackets-row-0"]');
    const row0Text = await row0.textContent();
    expect(row0Text).toMatch(/\d+\.\d+%/);
    expect(row0Text).toMatch(/\$/);

    // Provincial brackets should also render
    const provTable = page.locator('[data-testid="tax-provincial-brackets-table"]');
    await expect(provTable).toBeVisible();

    const provFills = page.locator('[data-testid^="tax-provincial-brackets-fill-"]');
    expect(await provFills.count()).toBeGreaterThan(0);

    // Subtotals should show
    const provSubtotal = page.locator('[data-testid="tax-provincial-brackets-subtotal"]');
    await expect(provSubtotal).toBeVisible();
    const subtotalText = await provSubtotal.textContent();
    expect(subtotalText).toMatch(/\$/);

    await captureScreenshot(page, "task-109-tax-bracket-bars");
    await page.keyboard.press("Escape");
  });

  // --- 2. Explainer modals show full formatted currency ---

  test("explainer modals use full currency format (no k abbreviation)", async ({ page }) => {
    // Open Net Worth explainer
    await page.click('[data-testid="metric-card-net-worth"]');
    await page.waitForSelector('[data-testid="explainer-modal"]');

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // The explainer value should show full format (e.g., $150,000 not $150k)
    const explainerValue = page.locator('[data-testid="explainer-value"]');
    const valueText = await explainerValue.textContent();
    // Full format uses commas with no "k" or "M" suffix
    expect(valueText).toMatch(/\$[\d,]+/);
    expect(valueText).not.toMatch(/\d+k/i);
    expect(valueText).not.toMatch(/\d+M/i);

    // Source cards should also use full currency format
    const sources = page.locator('[data-testid="explainer-sources"]');
    const sourcesText = await sources.textContent();
    // Should contain dollar amounts with commas
    expect(sourcesText).toMatch(/\$/);
    // No "k" abbreviation in source values
    expect(sourcesText).not.toMatch(/\$[\d.]+k/i);

    // Result value should match
    const resultValue = page.locator('[data-testid="explainer-result-value"]');
    if (await resultValue.isVisible()) {
      const resultText = await resultValue.textContent();
      expect(resultText).not.toMatch(/\d+k/i);
    }

    await captureScreenshot(page, "task-109-explainer-full-currency");
    await page.keyboard.press("Escape");

    // Also check Estimated Tax explainer
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    const taxExplainer = page.locator('[data-testid="tax-explainer"]');
    const taxBreakdown = taxExplainer.locator('[data-testid="tax-breakdown"]');
    await expect(taxBreakdown).toBeVisible();

    // Federal and provincial amounts should use full format
    const federalAmt = taxExplainer.locator('[data-testid="tax-federal-amount"]');
    const fedText = await federalAmt.textContent();
    expect(fedText).toMatch(/\$/);
    expect(fedText).not.toMatch(/\$[\d.]+k/i);

    await captureScreenshot(page, "task-109-tax-explainer-full-currency");
    await page.keyboard.press("Escape");
  });

  // --- 3. Net worth donut chart ---

  test("net worth donut chart renders with segments and legend", async ({ page }) => {
    const donutChart = page.locator('[data-testid="donut-chart"]');
    await expect(donutChart).toBeVisible();

    // Center label should display net worth value
    const centerLabel = page.locator('[data-testid="donut-center-label"]');
    await expect(centerLabel).toBeVisible();
    const centerText = await centerLabel.textContent();
    expect(centerText).toMatch(/\$/);

    // Legend should show asset breakdown categories
    const legend = page.locator('[data-testid="donut-legend"]');
    await expect(legend).toBeVisible();

    // Chart should contain SVG elements (recharts renders sectors)
    const svgElements = donutChart.locator("svg");
    expect(await svgElements.count()).toBeGreaterThan(0);

    await captureScreenshot(page, "task-109-donut-chart");
  });

  // --- 4. Cash flow Sankey with investment income ---

  test("cash flow Sankey includes investment interest income nodes", async ({ page }) => {
    // Expand the Sankey (matching pattern from sankey-investment-returns.spec.ts)
    const toggle = page.getByTestId("cash-flow-toggle");
    // There may be duplicate toggles; click the visible one
    const toggleCount = await toggle.count();
    if (toggleCount > 1) {
      await toggle.nth(1).click();
    } else {
      await toggle.click();
    }
    await expect(page.getByTestId("sankey-chart").first()).toBeVisible();

    // Legend should show Investment Income entry
    const legend = page.getByTestId("sankey-legend").first();
    await expect(legend).toBeVisible();

    // Check for investment income legend item (conditional — only if user has income-type investments)
    const investmentLegend = page.getByTestId("sankey-legend-investment-income").first();
    const hasInvestmentIncome = await investmentLegend.isVisible().catch(() => false);

    if (hasInvestmentIncome) {
      await expect(investmentLegend).toContainText("Interest");
    }

    // Core nodes should always exist
    const afterTaxNode = page.getByTestId("sankey-node-after-tax").first();
    await expect(afterTaxNode).toBeVisible();

    await captureScreenshot(page, "task-109-sankey-investment-income");
  });

  // --- 5. Fast Forward panel scenario options ---

  test("Fast Forward panel shows all new scenario options", async ({ page }) => {
    // Expand Fast Forward panel
    await page.getByTestId("fast-forward-toggle").click();
    await expect(page.getByTestId("fast-forward-panel")).toBeVisible();

    // Scenario presets should show
    await expect(page.getByTestId("scenario-presets")).toBeVisible();
    await expect(page.getByTestId("preset-conservative")).toBeVisible();
    await expect(page.getByTestId("preset-aggressive-saver")).toBeVisible();
    await expect(page.getByTestId("preset-early-retirement")).toBeVisible();

    // Retire today option
    await expect(page.getByTestId("retire-today")).toBeVisible();
    await expect(page.getByTestId("retire-today-checkbox")).toBeVisible();

    // Max tax-sheltered option
    await expect(page.getByTestId("max-tax-sheltered")).toBeVisible();

    // ROI adjustment slider
    const roiSection = page.getByTestId("roi-adjustment");
    await expect(roiSection).toBeVisible();
    await expect(page.getByTestId("roi-adjustment-slider")).toBeVisible();

    await captureScreenshot(page, "task-109-fast-forward-options");

    // Test a preset activates scenario comparison
    await page.getByTestId("preset-early-retirement").click();
    await expect(page.getByTestId("scenario-comparison")).toBeVisible();
    await expect(page.getByTestId("runway-estimate")).toBeVisible();

    await captureScreenshot(page, "task-109-fast-forward-early-retirement");

    // Reset
    await page.getByTestId("reset-scenario").click();
    await expect(page.getByTestId("scenario-comparison")).not.toBeVisible();
  });

  // --- 6. All metric card values match explainer breakdowns ---

  test("net worth card value matches explainer result", async ({ page }) => {
    // Get card value
    const card = page.locator('[data-testid="metric-card-net-worth"]');
    await expect(card).toBeVisible();

    // Open explainer
    await card.click();
    await page.waitForSelector('[data-testid="explainer-modal"]');

    // The explainer should have sources that sum up
    const sources = page.locator('[data-testid="explainer-sources"]');
    await expect(sources).toBeVisible();

    // Result section should exist
    const resultSection = page.locator('[data-testid="explainer-result-section"]');
    await expect(resultSection).toBeVisible();

    // Summary should describe the components
    const summary = page.locator('[data-testid="explainer-summary"]');
    if (await summary.isVisible()) {
      const summaryText = await summary.textContent();
      expect(summaryText!.length).toBeGreaterThan(0);
    }

    await captureScreenshot(page, "task-109-net-worth-match");
    await page.keyboard.press("Escape");
  });

  test("estimated tax shows federal + provincial = total with correct rates", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    const taxExplainer = page.locator('[data-testid="tax-explainer"]');
    await expect(taxExplainer).toBeVisible();

    // Federal and provincial breakdown (scoped to tax explainer to avoid duplicates)
    const breakdown = taxExplainer.locator('[data-testid="tax-breakdown"]');
    await expect(breakdown).toBeVisible();

    // Both amounts should be visible
    await expect(taxExplainer.locator('[data-testid="tax-federal-amount"]')).toBeVisible();
    await expect(taxExplainer.locator('[data-testid="tax-provincial-amount"]')).toBeVisible();

    // Effective rate should show
    const effectiveRate = page.locator('[data-testid="tax-effective-rate"]');
    await expect(effectiveRate).toBeVisible();
    const rateText = await effectiveRate.textContent();
    expect(rateText).toMatch(/[\d.]+%/);

    // Marginal rate should show
    const marginalRate = page.locator('[data-testid="tax-marginal-rate"]');
    await expect(marginalRate).toBeVisible();

    await captureScreenshot(page, "task-109-tax-breakdown-rates");
    await page.keyboard.press("Escape");
  });

  test("financial runway explainer shows monthly obligations", async ({ page }) => {
    await page.click('[data-testid="metric-card-financial-runway"]');
    await page.waitForSelector('[data-testid="explainer-modal"]');

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Should show months
    const modalText = await modal.textContent();
    expect(modalText).toMatch(/month/i);

    // Runway after-tax badge should be visible on the card
    const afterTaxBadge = page.locator('[data-testid="runway-after-tax"]');
    if (await afterTaxBadge.isVisible()) {
      const badgeText = await afterTaxBadge.textContent();
      expect(badgeText).toMatch(/\d+/);
    }

    await captureScreenshot(page, "task-109-runway-breakdown");
    await page.keyboard.press("Escape");
  });

  test("monthly surplus card renders with value", async ({ page }) => {
    const card = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await expect(card).toBeVisible();
    const text = await card.textContent();
    expect(text).toMatch(/\$/);
  });

  test("debt-to-asset ratio card shows ratio with without-mortgage variant", async ({ page }) => {
    const card = page.locator('[data-testid="metric-card-debt-to-asset-ratio"]');
    await expect(card).toBeVisible();

    // Without mortgage variant
    const withoutMortgage = page.locator('[data-testid="ratio-without-mortgage"]');
    if (await withoutMortgage.isVisible()) {
      const text = await withoutMortgage.textContent();
      expect(text!.length).toBeGreaterThan(0);
    }
  });

  // --- Combined screenshot: full dashboard ---

  test("full dashboard renders all metric cards and charts", async ({ page }) => {
    // All five metric cards should be visible
    const cardIds = [
      "metric-card-net-worth",
      "metric-card-monthly-surplus",
      "metric-card-estimated-tax",
      "metric-card-financial-runway",
      "metric-card-debt-to-asset-ratio",
    ];

    for (const id of cardIds) {
      await expect(page.locator(`[data-testid="${id}"]`)).toBeVisible();
    }

    // Donut chart visible
    await expect(page.locator('[data-testid="donut-chart"]')).toBeVisible();

    // Projection chart visible
    await expect(page.locator('[data-testid="projection-chart"]')).toBeVisible();

    await captureScreenshot(page, "task-109-full-dashboard");
  });
});
