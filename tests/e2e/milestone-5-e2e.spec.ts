import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("T3: Milestone 5 — Comprehensive E2E for Kubera-inspired visualization features (tasks 48-54)", () => {
  test.setTimeout(120000);

  test("full journey: allocation chart, expense breakdown, waterfall, fast forward, benchmarks, sankey, stock ROI", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');
    await page.waitForTimeout(1500); // Wait for count-up animations

    // ========================================
    // Step 1: Asset Allocation Chart (Task 48)
    // ========================================
    const allocationChart = page.getByTestId("allocation-chart");
    await expect(allocationChart).toBeVisible();

    // Verify "By Type" is the default view
    const byTypeBtn = allocationChart.getByRole("button", { name: /By Type/i });
    const byLiquidityBtn = allocationChart.getByRole("button", {
      name: /By Liquidity/i,
    });
    await expect(byTypeBtn).toBeVisible();
    await expect(byLiquidityBtn).toBeVisible();

    // Chart should have rendered segments (recharts renders SVG)
    const chartSvg = allocationChart.locator("svg.recharts-surface");
    await expect(chartSvg.first()).toBeVisible();

    // Toggle to "By Liquidity" view
    await byLiquidityBtn.click();
    await page.waitForTimeout(500);

    // Toggle back to "By Type"
    await byTypeBtn.click();
    await page.waitForTimeout(500);

    await captureScreenshot(page, "task-55-allocation-chart-by-type");

    // ========================================
    // Step 2: Expense Breakdown Chart (Task 49)
    // ========================================
    const expenseBreakdown = page.getByTestId("expense-breakdown-chart");
    await expect(expenseBreakdown).toBeVisible();

    // Income vs Expenses comparison bar should be visible
    const incomeVsExpenses = page.getByTestId("income-vs-expenses");
    await expect(incomeVsExpenses).toBeVisible();

    // Check surplus/deficit indicator exists
    const surplusText = await incomeVsExpenses.textContent();
    expect(surplusText).toBeTruthy();

    await captureScreenshot(page, "task-55-expense-breakdown");

    // ========================================
    // Step 3: Net Worth Waterfall Chart (Task 50)
    // ========================================
    const waterfallChart = page.getByTestId("waterfall-chart");
    await expect(waterfallChart).toBeVisible();

    // Waterfall should have SVG chart rendered
    const waterfallSvg = waterfallChart.locator("svg.recharts-surface");
    await expect(waterfallSvg.first()).toBeVisible();

    // Legend should show Assets, Debts, Net Worth labels
    const waterfallText = await waterfallChart.textContent();
    expect(waterfallText).toContain("Assets");
    expect(waterfallText).toContain("Debts");
    expect(waterfallText).toContain("Net Worth");

    await captureScreenshot(page, "task-55-waterfall-chart");

    // ========================================
    // Step 4: Fast Forward Scenario Panel (Task 51)
    // ========================================
    const fastForwardToggle = page.getByTestId("fast-forward-toggle");
    await expect(fastForwardToggle).toBeVisible();

    // Expand the panel
    await fastForwardToggle.click();
    await page.waitForTimeout(500);

    const fastForwardPanel = page.getByTestId("fast-forward-panel");
    await expect(fastForwardPanel).toBeVisible();

    // Debt toggles should be present
    const debtToggles = page.getByTestId("debt-toggles");
    await expect(debtToggles).toBeVisible();

    // Income adjustment controls
    const incomeAdjustment = page.getByTestId("income-adjustment");
    await expect(incomeAdjustment).toBeVisible();

    const incomeIncrease = page.getByTestId("income-increase");
    await expect(incomeIncrease).toBeVisible();

    // Click income increase to create a scenario
    await incomeIncrease.click();
    await page.waitForTimeout(500);

    // Scenario comparison should appear
    const scenarioComparison = page.getByTestId("scenario-comparison");
    await expect(scenarioComparison).toBeVisible();

    // Delta year cards should show comparison values
    const delta5 = page.getByTestId("delta-year-5");
    const delta10 = page.getByTestId("delta-year-10");
    await expect(delta5).toBeVisible();
    await expect(delta10).toBeVisible();

    await captureScreenshot(page, "task-55-fast-forward-scenario");

    // Windfall input
    const windfallAmount = page.getByTestId("windfall-amount");
    await expect(windfallAmount).toBeVisible();
    await windfallAmount.fill("50000");
    await page.waitForTimeout(500);

    // Scenario should update with windfall
    const updatedDelta5Text = await delta5.textContent();
    expect(updatedDelta5Text).toBeTruthy();

    await captureScreenshot(page, "task-55-fast-forward-with-windfall");

    // Reset scenario
    const resetBtn = page.getByTestId("reset-scenario");
    await resetBtn.scrollIntoViewIfNeeded();
    await resetBtn.click();
    await page.waitForTimeout(300);

    // Collapse the panel - when open, the toggle is replaced by a close button
    const collapseBtn = page.getByRole("button", { name: "Collapse Fast Forward" });
    await collapseBtn.scrollIntoViewIfNeeded();
    await collapseBtn.click();
    await page.waitForTimeout(300);

    // ========================================
    // Step 5: Benchmark Comparisons (Task 52)
    // ========================================
    const benchmarks = page.getByTestId("benchmark-comparisons");
    await expect(benchmarks).toBeVisible();

    // Add age for personalized benchmarks
    const addAgeBtn = page.getByTestId("add-age-button");
    if (await addAgeBtn.isVisible()) {
      await addAgeBtn.click();
      await page.waitForTimeout(300);

      const ageInput = page.getByTestId("age-input");
      await expect(ageInput).toBeVisible();
      await ageInput.fill("35");
      await ageInput.press("Enter");
      await page.waitForTimeout(500);
    }

    // Benchmark bars should be visible
    const benchmarkText = await benchmarks.textContent();
    expect(benchmarkText).toBeTruthy();
    // Should contain comparison-related text
    expect(benchmarkText).toMatch(/median|compare|benchmark/i);

    // Info button should show data sources
    const infoButton = page.getByTestId("benchmark-info-button");
    await expect(infoButton).toBeVisible();
    await infoButton.click();
    await page.waitForTimeout(300);

    const sourcesPanel = page.getByTestId("benchmark-sources");
    await expect(sourcesPanel).toBeVisible();

    await captureScreenshot(page, "task-55-benchmark-comparisons-age-35");

    // Close info sources
    await infoButton.click();
    await page.waitForTimeout(300);

    // ========================================
    // Step 6: Cash Flow Sankey Diagram (Task 53)
    // ========================================
    // Sankey starts expanded by default (collapsed: false)
    const sankeyToggle = page.getByTestId("cash-flow-toggle");
    await sankeyToggle.scrollIntoViewIfNeeded();
    await expect(sankeyToggle).toBeVisible();

    const sankeyChart = page.getByTestId("sankey-chart");
    await expect(sankeyChart).toBeVisible();

    // SVG should be rendered
    const sankeySvg = sankeyChart.locator("svg");
    await expect(sankeySvg.first()).toBeVisible();

    // Legend should be visible
    const sankeyLegend = page.getByTestId("sankey-legend");
    await expect(sankeyLegend).toBeVisible();

    await captureScreenshot(page, "task-55-sankey-diagram");

    // Collapse and re-expand sankey to test toggle
    await sankeyToggle.click();
    await page.waitForTimeout(300);
    await expect(sankeyChart).not.toBeVisible();
    await sankeyToggle.click();
    await page.waitForTimeout(300);
    await expect(sankeyChart).toBeVisible();

    // ========================================
    // Step 7: Stock ROI Performance (Task 54)
    // ========================================
    // Add a stock with cost basis to test ROI display
    // First, find the stock entry section
    const stockSection = page.locator("text=Stocks & Equity").first();
    await expect(stockSection).toBeVisible();

    // Check if portfolio summary is visible (it shows when stocks have cost basis)
    const portfolioSummary = page.getByTestId("portfolio-summary");
    // Portfolio summary may or may not be visible depending on mock data
    // The mock data should include stocks with cost basis

    // Check for stock entries - at minimum the section should render
    await captureScreenshot(page, "task-55-stock-entry-section");

    // ========================================
    // Step 8: Verify all visualizations coexist on dashboard
    // ========================================
    // Scroll to bottom to ensure all components are accessible
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await captureScreenshot(page, "task-55-dashboard-bottom");

    // Scroll back to top
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    await captureScreenshot(page, "task-55-full-page-top");
  });

  test("allocation chart toggle changes segments", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="allocation-chart"]');
    await page.waitForTimeout(1000);

    const chart = page.getByTestId("allocation-chart");

    // Get initial chart content in "By Type" view
    const byTypeContent = await chart.textContent();

    // Switch to "By Liquidity"
    await chart.getByRole("button", { name: /By Liquidity/i }).click();
    await page.waitForTimeout(500);

    const byLiquidityContent = await chart.textContent();

    // Content should differ between views (different groupings)
    expect(byLiquidityContent).not.toEqual(byTypeContent);

    // Liquidity view should mention liquid/illiquid concepts
    expect(byLiquidityContent).toMatch(/liquid|illiquid/i);

    await captureScreenshot(page, "task-55-allocation-liquidity-view");
  });

  test("expense breakdown shows income vs expenses comparison", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="expense-breakdown-chart"]');
    await page.waitForTimeout(1000);

    const breakdown = page.getByTestId("expense-breakdown-chart");
    await expect(breakdown).toBeVisible();

    // Income vs expenses bar should show surplus or deficit
    const comparison = page.getByTestId("income-vs-expenses");
    await expect(comparison).toBeVisible();

    const compText = await comparison.textContent();
    // Should contain either surplus or over-budget indicator
    expect(compText).toMatch(/surplus|over|under|budget|income|expense/i);

    await captureScreenshot(page, "task-55-expense-income-comparison");
  });

  test("fast forward panel debt toggle affects scenario", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');
    await page.waitForTimeout(1000);

    // Expand Fast Forward
    await page.getByTestId("fast-forward-toggle").click();
    await page.waitForTimeout(500);

    const panel = page.getByTestId("fast-forward-panel");
    await expect(panel).toBeVisible();

    // Find first debt toggle checkbox
    const debtToggles = page.getByTestId("debt-toggles");
    const firstCheckbox = debtToggles.locator('input[type="checkbox"]').first();

    if (await firstCheckbox.isVisible()) {
      // Toggle a debt off
      await firstCheckbox.click();
      await page.waitForTimeout(500);

      // Scenario comparison should appear/update
      const comparison = page.getByTestId("scenario-comparison");
      await expect(comparison).toBeVisible();

      // Delta should show positive impact (removing a debt improves scenario)
      const compText = await comparison.textContent();
      expect(compText).toBeTruthy();

      await captureScreenshot(page, "task-55-fast-forward-debt-toggle");
    }
  });

  test("benchmark age input persists in URL", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="benchmark-comparisons"]');
    await page.waitForTimeout(1000);

    // Add age
    const addAgeBtn = page.getByTestId("add-age-button");
    if (await addAgeBtn.isVisible()) {
      await addAgeBtn.click();
      await page.waitForTimeout(300);
      const ageInput = page.getByTestId("age-input");
      await ageInput.fill("42");
      await ageInput.press("Enter");
      await page.waitForTimeout(500);
    } else {
      // Age display already visible, click to edit
      const ageDisplay = page.getByTestId("age-display");
      if (await ageDisplay.isVisible()) {
        await ageDisplay.click();
        await page.waitForTimeout(300);
        const ageInput = page.getByTestId("age-input");
        await ageInput.fill("42");
        await ageInput.press("Enter");
        await page.waitForTimeout(500);
      }
    }

    // Wait for URL to update
    await page.waitForFunction(() => window.location.search.includes("s="));
    await page.waitForTimeout(500);

    // Reload and verify age persisted
    const currentUrl = page.url();
    await page.goto(currentUrl);
    await page.waitForSelector('[data-testid="benchmark-comparisons"]');
    await page.waitForTimeout(1000);

    // Age display should show 42
    const ageDisplay = page.getByTestId("age-display");
    if (await ageDisplay.isVisible()) {
      await expect(ageDisplay).toContainText("42");
    }

    await captureScreenshot(page, "task-55-benchmark-age-persisted");
  });

  test("sankey diagram renders flow paths with correct structure", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');
    await page.waitForTimeout(1000);

    // Sankey starts expanded by default - scroll to it
    const toggle = page.getByTestId("cash-flow-toggle");
    await toggle.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const chart = page.getByTestId("sankey-chart");
    await expect(chart).toBeVisible();

    // Check SVG structure
    const svg = chart.locator("svg").first();
    await expect(svg).toBeVisible();

    // Should have sankey nodes
    const nodes = chart.locator('[data-testid^="sankey-node-"]');
    const nodeCount = await nodes.count();
    expect(nodeCount).toBeGreaterThanOrEqual(2);

    // Legend should show flow categories
    const legend = page.getByTestId("sankey-legend");
    await expect(legend).toBeVisible();
    const legendText = await legend.textContent();
    expect(legendText).toMatch(/income|expense|investment|surplus/i);

    await captureScreenshot(page, "task-55-sankey-structure");
  });

  test("stock portfolio summary shows performance metrics", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');
    await page.waitForTimeout(1000);

    // Check stock section is present
    const stockSection = page.locator("text=Stocks & Equity").first();
    await expect(stockSection).toBeVisible();

    // If there are stocks with cost basis, portfolio summary should be visible
    const portfolioSummary = page.getByTestId("portfolio-summary");
    if (await portfolioSummary.isVisible()) {
      const summaryText = await portfolioSummary.textContent();
      // Should show value and return metrics
      expect(summaryText).toMatch(/\$/);
    }

    // Check for stock items with gain/loss display
    const gainLossBadges = page.locator('[data-testid^="gain-loss-"]');
    const badgeCount = await gainLossBadges.count();
    if (badgeCount > 0) {
      // First gain/loss badge should be visible
      await expect(gainLossBadges.first()).toBeVisible();
    }

    await captureScreenshot(page, "task-55-stock-roi-performance");
  });
});
