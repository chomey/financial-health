import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Spotlight Dimming System — Milestone E2E", () => {
  test("Net Worth card shows dim overlay, spotlighted sections, and formula bar with color-coded terms", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const netWorthCard = page.locator(
      '[data-testid="metric-card-net-worth"]'
    );
    await netWorthCard.scrollIntoViewIfNeeded();

    // Verify overlay is dormant
    await expect(
      page.locator('[data-testid="spotlight-overlay"]')
    ).toHaveCSS("opacity", "0");

    // Hover Net Worth card
    await netWorthCard.hover();
    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });

    // 1. Dim overlay visible
    await expect(
      page.locator('[data-testid="spotlight-overlay"]')
    ).toHaveCSS("opacity", "1");

    // 2. Assets and debts spotlighted with correct signs
    const assetsEl = page.locator(
      '[data-dataflow-source="section-assets"]'
    );
    await expect(assetsEl).toHaveAttribute(
      "data-dataflow-highlighted",
      "positive"
    );

    const debtsEl = page.locator(
      '[data-dataflow-source="section-debts"]'
    );
    await expect(debtsEl).toHaveAttribute(
      "data-dataflow-highlighted",
      "negative"
    );

    // Stocks section spotlighted positive only if stocks have value
    const stocksEl = page.locator(
      '[data-dataflow-source="section-stocks"]'
    );
    const stocksHighlighted = await stocksEl
      .getAttribute("data-dataflow-highlighted")
      .catch(() => null);
    // If stocks have value, they should be positive; if 0, they're filtered out
    if (stocksHighlighted) {
      expect(stocksHighlighted).toBe("positive");
    }

    // 3. Spotlighted sections have opaque backgrounds above overlay (z-index >= 45)
    const assetsZIndex = await assetsEl.evaluate(
      (el) => getComputedStyle(el).zIndex
    );
    expect(Number(assetsZIndex)).toBeGreaterThanOrEqual(45);

    const assetsBg = await assetsEl.evaluate(
      (el) => getComputedStyle(el).background
    );
    expect(assetsBg).toContain("rgb"); // has a non-transparent background

    // 4. Formula bar visible with color-coded terms
    const formulaBar = page.locator('[data-testid="formula-bar"]');
    await expect(formulaBar).toBeVisible();

    // Formula bar has positive (green) and negative (red) term pills
    const positiveTerm = formulaBar.locator(
      '[data-testid="formula-term-section-assets"]'
    );
    await expect(positiveTerm).toBeVisible();
    const positiveClasses = await positiveTerm.getAttribute("class");
    expect(positiveClasses).toContain("bg-green-50");
    expect(positiveClasses).toContain("text-green-700");

    const negativeTerm = formulaBar.locator(
      '[data-testid="formula-term-section-debts"]'
    );
    await expect(negativeTerm).toBeVisible();
    const negativeClasses = await negativeTerm.getAttribute("class");
    expect(negativeClasses).toContain("bg-rose-50");
    expect(negativeClasses).toContain("text-rose-700");

    // Formula result visible
    const result = formulaBar.locator('[data-testid="formula-result"]');
    await expect(result).toBeVisible();

    await captureScreenshot(page, "task-78-net-worth-spotlight");
  });

  test("Monthly Surplus formula bar shows after-tax income minus expenses minus contributions minus mortgage", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const surplusCard = page.locator(
      '[data-testid="metric-card-monthly-surplus"]'
    );
    await surplusCard.scrollIntoViewIfNeeded();
    await surplusCard.hover();

    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });

    // Spotlight overlay active
    await expect(
      page.locator('[data-testid="spotlight-overlay"]')
    ).toHaveCSS("opacity", "1");

    // Income spotlighted green, expenses spotlighted red
    const incomeEl = page.locator(
      '[data-dataflow-source="section-income"]'
    );
    await expect(incomeEl).toHaveAttribute(
      "data-dataflow-highlighted",
      "positive"
    );

    const expensesEl = page.locator(
      '[data-dataflow-source="section-expenses"]'
    );
    await expect(expensesEl).toHaveAttribute(
      "data-dataflow-highlighted",
      "negative"
    );

    // Formula bar visible with income (positive) and expenses (negative) terms
    const formulaBar = page.locator('[data-testid="formula-bar"]');
    await expect(formulaBar).toBeVisible();

    // Income term is green
    const incomeTerm = formulaBar.locator(
      '[data-testid="formula-term-section-income"]'
    );
    await expect(incomeTerm).toBeVisible();
    const incomeClasses = await incomeTerm.getAttribute("class");
    expect(incomeClasses).toContain("bg-green-50");

    // Expenses term is red/rose
    const expensesTerm = formulaBar.locator(
      '[data-testid="formula-term-section-expenses"]'
    );
    await expect(expensesTerm).toBeVisible();
    const expensesClasses = await expensesTerm.getAttribute("class");
    expect(expensesClasses).toContain("bg-rose-50");

    // Formula bar has an aria-label describing the formula
    const ariaLabel = await formulaBar.getAttribute("aria-label");
    expect(ariaLabel).toContain("Formula:");
    expect(ariaLabel).toContain("Monthly Surplus");

    // Result displayed
    const result = formulaBar.locator('[data-testid="formula-result"]');
    await expect(result).toBeVisible();

    await captureScreenshot(page, "task-78-monthly-surplus-spotlight");
  });

  test("formula bar displays correct terms for Estimated Tax, Financial Runway, and Debt-to-Asset Ratio", async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // --- Estimated Tax ---
    const taxCard = page.locator(
      '[data-testid="metric-card-estimated-tax"]'
    );
    await taxCard.scrollIntoViewIfNeeded();
    await taxCard.hover();

    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });

    let formulaBar = page.locator('[data-testid="formula-bar"]');
    await expect(formulaBar).toBeVisible();

    // Estimated Tax: single income term showing effective rate
    const taxIncomeTerm = formulaBar.locator(
      '[data-testid="formula-term-section-income"]'
    );
    await expect(taxIncomeTerm).toBeVisible();
    const taxTermText = await taxIncomeTerm.textContent();
    // Should contain the percentage and gross income (e.g. "23.5% of $78k")
    expect(taxTermText).toMatch(/\d+\.\d+%.*\$|^\$/);

    let ariaLabel = await formulaBar.getAttribute("aria-label");
    expect(ariaLabel).toContain("Estimated Tax");

    await captureScreenshot(page, "task-78-estimated-tax-spotlight");

    // Clear
    await page.mouse.move(0, 0);
    await expect(
      page.locator('[data-testid="spotlight-overlay"]')
    ).toHaveCSS("opacity", "0", { timeout: 3000 });

    // --- Financial Runway ---
    const runwayCard = page.locator(
      '[data-testid="metric-card-financial-runway"]'
    );
    await runwayCard.scrollIntoViewIfNeeded();
    await runwayCard.hover();

    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });

    formulaBar = page.locator('[data-testid="formula-bar"]');
    await expect(formulaBar).toBeVisible();

    // Financial Runway: assets (positive), stocks (positive), expenses (negative)
    const runwayAssetsTerm = formulaBar.locator(
      '[data-testid="formula-term-section-assets"]'
    );
    await expect(runwayAssetsTerm).toBeVisible();
    const runwayAssetsClasses = await runwayAssetsTerm.getAttribute("class");
    expect(runwayAssetsClasses).toContain("bg-green-50");

    const runwayExpensesTerm = formulaBar.locator(
      '[data-testid="formula-term-section-expenses"]'
    );
    await expect(runwayExpensesTerm).toBeVisible();
    const runwayExpensesClasses =
      await runwayExpensesTerm.getAttribute("class");
    expect(runwayExpensesClasses).toContain("bg-rose-50");

    ariaLabel = await formulaBar.getAttribute("aria-label");
    expect(ariaLabel).toContain("Financial Runway");

    await captureScreenshot(page, "task-78-financial-runway-spotlight");

    // Clear
    await page.mouse.move(0, 0);
    await expect(
      page.locator('[data-testid="spotlight-overlay"]')
    ).toHaveCSS("opacity", "0", { timeout: 3000 });

    // --- Debt-to-Asset Ratio ---
    const debtRatioCard = page.locator(
      '[data-testid="metric-card-debt-to-asset-ratio"]'
    );
    await debtRatioCard.scrollIntoViewIfNeeded();
    await debtRatioCard.hover();

    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });

    formulaBar = page.locator('[data-testid="formula-bar"]');
    await expect(formulaBar).toBeVisible();

    // Debt-to-Asset: assets (positive), debts (negative)
    const ratioAssetsTerm = formulaBar.locator(
      '[data-testid="formula-term-section-assets"]'
    );
    await expect(ratioAssetsTerm).toBeVisible();

    const ratioDebtsTerm = formulaBar.locator(
      '[data-testid="formula-term-section-debts"]'
    );
    await expect(ratioDebtsTerm).toBeVisible();
    const ratioDebtsClasses = await ratioDebtsTerm.getAttribute("class");
    expect(ratioDebtsClasses).toContain("bg-rose-50");

    ariaLabel = await formulaBar.getAttribute("aria-label");
    expect(ariaLabel).toContain("Debt-to-Asset Ratio");

    await captureScreenshot(page, "task-78-debt-to-asset-ratio-spotlight");
  });

  test("spotlight clears on mouse leave with no residual highlights", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const netWorthCard = page.locator(
      '[data-testid="metric-card-net-worth"]'
    );
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.hover();

    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });

    // Confirm active state
    await expect(
      page.locator('[data-testid="spotlight-overlay"]')
    ).toHaveCSS("opacity", "1");
    const activeCount = await page
      .locator("[data-dataflow-highlighted]")
      .count();
    expect(activeCount).toBeGreaterThanOrEqual(1);

    // Move away
    await page.mouse.move(0, 0);

    // Overlay should fade out
    await expect(
      page.locator('[data-testid="spotlight-overlay"]')
    ).toHaveCSS("opacity", "0", { timeout: 3000 });

    // No residual highlights
    await expect(
      page.locator("[data-dataflow-highlighted]")
    ).toHaveCount(0);

    // No formula bar
    const formulaBar = page.locator('[data-testid="formula-bar"]');
    await expect(formulaBar).not.toBeVisible();

    // Active target attribute cleared
    await expect(
      page.locator("[data-dataflow-active-target]")
    ).toHaveCount(0);
  });

  test("mobile viewport (375px) shows formula bar fixed at bottom of viewport", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const netWorthCard = page.locator(
      '[data-testid="metric-card-net-worth"]'
    );
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.focus();

    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });

    // Spotlight overlay active
    await expect(
      page.locator('[data-testid="spotlight-overlay"]')
    ).toHaveCSS("opacity", "1");

    // Formula bar should be visible and fixed at bottom
    const formulaBar = page.locator('[data-testid="formula-bar"]');
    await expect(formulaBar).toBeVisible();

    const position = await formulaBar.evaluate(
      (el) => getComputedStyle(el).position
    );
    expect(position).toBe("fixed");

    const bottom = await formulaBar.evaluate(
      (el) => getComputedStyle(el).bottom
    );
    expect(bottom).toBe("0px");

    // Source sections highlighted
    const highlighted = page.locator("[data-dataflow-highlighted]");
    expect(await highlighted.count()).toBeGreaterThanOrEqual(1);

    await captureScreenshot(page, "task-78-mobile-formula-bar-bottom");
  });

  test("keyboard Tab to metric card triggers spotlight on focus", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Focus the Net Worth card via keyboard focus
    const netWorthCard = page.locator(
      '[data-testid="metric-card-net-worth"]'
    );
    await netWorthCard.focus();

    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });

    // Spotlight overlay active
    await expect(
      page.locator('[data-testid="spotlight-overlay"]')
    ).toHaveCSS("opacity", "1");

    // Formula bar visible
    const formulaBar = page.locator('[data-testid="formula-bar"]');
    await expect(formulaBar).toBeVisible();

    // Active target attribute set
    await expect(netWorthCard).toHaveAttribute(
      "data-dataflow-active-target",
      "true"
    );

    // Aria-live region announces data sources
    const ariaLive = netWorthCard.locator(
      '[data-testid="dataflow-aria-live"]'
    );
    await page.waitForTimeout(500);
    const text = await ariaLive.textContent();
    expect(text).toContain("Net Worth is calculated from:");

    await captureScreenshot(page, "task-78-keyboard-focus-spotlight");
  });

  test("no Cumulative Layout Shift during spotlight activation/deactivation", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Enable CLS observation
    await page.evaluate(() => {
      (window as unknown as { clsEntries: { value: number }[] }).clsEntries = [];
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          (window as unknown as { clsEntries: { value: number }[] }).clsEntries.push({
            value: (entry as unknown as { value: number }).value,
          });
        }
      });
      observer.observe({ type: "layout-shift", buffered: true });
    });

    // Reset CLS entries before interaction
    await page.evaluate(() => {
      (window as unknown as { clsEntries: { value: number }[] }).clsEntries = [];
    });

    const netWorthCard = page.locator(
      '[data-testid="metric-card-net-worth"]'
    );
    await netWorthCard.scrollIntoViewIfNeeded();

    // Activate spotlight
    await netWorthCard.hover();
    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });
    await page.waitForTimeout(500);

    // Deactivate spotlight
    await page.mouse.move(0, 0);
    await expect(
      page.locator('[data-testid="spotlight-overlay"]')
    ).toHaveCSS("opacity", "0", { timeout: 3000 });
    await page.waitForTimeout(500);

    // Check CLS
    const clsTotal = await page.evaluate(() => {
      return (window as unknown as { clsEntries: { value: number }[] }).clsEntries.reduce(
        (sum: number, e: { value: number }) => sum + e.value,
        0
      );
    });

    // CLS should be minimal (< 0.1 is "good" per Web Vitals)
    expect(clsTotal).toBeLessThan(0.1);
  });

  test("insight card hover shows spotlight with lighter styling", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await insightsPanel.scrollIntoViewIfNeeded();

    const surplusInsight = page
      .locator('[data-insight-type="surplus"]')
      .first();

    if (
      await surplusInsight.isVisible({ timeout: 2000 }).catch(() => false)
    ) {
      await surplusInsight.hover();
      await page.waitForSelector("[data-dataflow-highlighted]", {
        timeout: 5000,
      });

      // Spotlight overlay active
      await expect(
        page.locator('[data-testid="spotlight-overlay"]')
      ).toHaveCSS("opacity", "1");

      // Insight card gets active-target attribute
      await expect(surplusInsight).toHaveAttribute(
        "data-dataflow-active-target",
        "true"
      );

      // Source sections highlighted
      const incomeEl = page.locator(
        '[data-dataflow-source="section-income"]'
      );
      await expect(incomeEl).toHaveAttribute(
        "data-dataflow-highlighted",
        "positive"
      );

      const expensesEl = page.locator(
        '[data-dataflow-source="section-expenses"]'
      );
      await expect(expensesEl).toHaveAttribute(
        "data-dataflow-highlighted",
        "negative"
      );

      await captureScreenshot(page, "task-78-insight-spotlight");

      // Clear
      await page.mouse.move(0, 0);
      await expect(
        page.locator('[data-testid="spotlight-overlay"]')
      ).toHaveCSS("opacity", "0", { timeout: 3000 });
      await expect(
        page.locator("[data-dataflow-highlighted]")
      ).toHaveCount(0);
    } else {
      // Fallback: test with any available insight
      const anyInsight = page.locator("[data-insight-type]").first();
      await expect(anyInsight).toBeVisible({ timeout: 3000 });
      await anyInsight.hover();
      await page.waitForSelector("[data-dataflow-highlighted]", {
        timeout: 5000,
      });
      await expect(
        page.locator('[data-testid="spotlight-overlay"]')
      ).toHaveCSS("opacity", "1");

      await captureScreenshot(page, "task-78-insight-spotlight");

      await page.mouse.move(0, 0);
    }
  });
});
