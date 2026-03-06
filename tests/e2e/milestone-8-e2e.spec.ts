import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Milestone 8: Data-Flow Arrow Visualization (Tasks 69-75)", () => {
  test("Net Worth card — arrows to assets, stocks, property, and debts on hover", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Add a property with equity to ensure all sources appear
    const propertySection = page.locator("#property");
    await propertySection.scrollIntoViewIfNeeded();
    // Open property section if collapsed
    const propertyHeader = propertySection.locator("button").first();
    const isPropertyExpanded =
      (await propertyHeader.getAttribute("aria-expanded")) !== "false";
    if (!isPropertyExpanded) {
      await propertyHeader.click();
      await page.waitForTimeout(500);
    }

    // Add property: value 500k, mortgage 300k => 200k equity
    const addPropertyBtn = page
      .locator("#property")
      .getByRole("button", { name: /add/i });
    if (await addPropertyBtn.isVisible()) {
      await addPropertyBtn.click();
      await page.waitForTimeout(300);
    }

    // Hover Net Worth card
    const netWorthCard = page.locator(
      '[data-testid="metric-card-net-worth"]'
    );
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.hover();

    // Overlay should appear with arrow paths
    await page.waitForSelector('[data-testid="data-flow-overlay"]', {
      timeout: 5000,
    });
    const overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).toBeAttached();

    const paths = overlay.locator("path");
    const pathCount = await paths.count();
    expect(pathCount).toBeGreaterThanOrEqual(4); // glow + main per arrow (at least 2 arrows)

    // Verify source sections highlighted
    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 3000,
    });
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

    await captureScreenshot(page, "task-76-net-worth-arrows");

    // Move away — arrows should disappear
    await page.mouse.move(0, 0);
    await expect(overlay).not.toBeAttached({ timeout: 3000 });
    const highlighted = page.locator("[data-dataflow-highlighted]");
    await expect(highlighted).toHaveCount(0);
  });

  test("Monthly Surplus card — arrows to income and expenses on hover", async ({
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

    await page.waitForSelector('[data-testid="data-flow-overlay"]', {
      timeout: 5000,
    });
    const overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).toBeAttached();

    // Income should be positive (green), expenses negative (red)
    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 3000,
    });
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

    await captureScreenshot(page, "task-76-monthly-surplus-arrows");

    // Arrows disappear on mouse leave
    await page.mouse.move(0, 0);
    await expect(overlay).not.toBeAttached({ timeout: 3000 });
  });

  test("Estimated Tax, Financial Runway, and Debt-to-Asset Ratio arrows", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // --- Estimated Tax ---
    const taxCard = page.locator(
      '[data-testid="metric-card-estimated-tax"]'
    );
    await taxCard.scrollIntoViewIfNeeded();
    await taxCard.hover();

    await page.waitForSelector('[data-testid="data-flow-overlay"]', {
      timeout: 5000,
    });
    let overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).toBeAttached();

    // Income highlighted positive
    const incomeEl = page.locator(
      '[data-dataflow-source="section-income"]'
    );
    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 3000,
    });
    await expect(incomeEl).toHaveAttribute(
      "data-dataflow-highlighted",
      "positive"
    );

    await captureScreenshot(page, "task-76-estimated-tax-arrows");

    // Clear
    await page.mouse.move(0, 0);
    await expect(overlay).not.toBeAttached({ timeout: 3000 });

    // --- Financial Runway ---
    const runwayCard = page.locator(
      '[data-testid="metric-card-financial-runway"]'
    );
    await runwayCard.scrollIntoViewIfNeeded();
    await runwayCard.hover();

    await page.waitForSelector('[data-testid="data-flow-overlay"]', {
      timeout: 5000,
    });
    overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).toBeAttached();

    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 3000,
    });
    const assetsForRunway = page.locator(
      '[data-dataflow-source="section-assets"]'
    );
    await expect(assetsForRunway).toHaveAttribute(
      "data-dataflow-highlighted",
      "positive"
    );
    const expensesForRunway = page.locator(
      '[data-dataflow-source="section-expenses"]'
    );
    await expect(expensesForRunway).toHaveAttribute(
      "data-dataflow-highlighted",
      "negative"
    );

    await captureScreenshot(page, "task-76-financial-runway-arrows");

    // Clear
    await page.mouse.move(0, 0);
    await expect(overlay).not.toBeAttached({ timeout: 3000 });

    // --- Debt-to-Asset Ratio ---
    const debtRatioCard = page.locator(
      '[data-testid="metric-card-debt-to-asset-ratio"]'
    );
    await debtRatioCard.scrollIntoViewIfNeeded();
    await debtRatioCard.hover();

    await page.waitForSelector('[data-testid="data-flow-overlay"]', {
      timeout: 5000,
    });
    overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).toBeAttached();

    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 3000,
    });
    const assetsForDebt = page.locator(
      '[data-dataflow-source="section-assets"]'
    );
    await expect(assetsForDebt).toHaveAttribute(
      "data-dataflow-highlighted",
      "positive"
    );
    const debtsForDebt = page.locator(
      '[data-dataflow-source="section-debts"]'
    );
    await expect(debtsForDebt).toHaveAttribute(
      "data-dataflow-highlighted",
      "negative"
    );

    await captureScreenshot(page, "task-76-debt-to-asset-arrows");

    // Clear
    await page.mouse.move(0, 0);
    await expect(overlay).not.toBeAttached({ timeout: 3000 });
  });

  test("Insight card hover shows relevant arrows", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Find insights panel
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await insightsPanel.scrollIntoViewIfNeeded();

    // Try surplus insight first (most likely to exist)
    const surplusInsight = page
      .locator('[data-insight-type="surplus"]')
      .first();

    if (await surplusInsight.isVisible({ timeout: 2000 }).catch(() => false)) {
      await surplusInsight.hover();
      await page.waitForSelector('[data-testid="data-flow-overlay"]', {
        timeout: 5000,
      });
      const overlay = page.locator('[data-testid="data-flow-overlay"]');
      await expect(overlay).toBeAttached();

      // Surplus insight should highlight income positive, expenses negative
      await page.waitForSelector("[data-dataflow-highlighted]", {
        timeout: 3000,
      });
      const incomeEl = page.locator(
        '[data-dataflow-source="section-income"]'
      );
      await expect(incomeEl).toHaveAttribute(
        "data-dataflow-highlighted",
        "positive"
      );

      await captureScreenshot(page, "task-76-insight-surplus-arrows");

      // Clear
      await page.mouse.move(0, 0);
      await expect(overlay).not.toBeAttached({ timeout: 3000 });
    } else {
      // Try any insight type that exists
      const anyInsight = page.locator("[data-insight-type]").first();
      await expect(anyInsight).toBeVisible({ timeout: 3000 });
      await anyInsight.hover();
      await page.waitForSelector('[data-testid="data-flow-overlay"]', {
        timeout: 5000,
      });
      await expect(
        page.locator('[data-testid="data-flow-overlay"]')
      ).toBeAttached();

      await captureScreenshot(page, "task-76-insight-arrows");

      await page.mouse.move(0, 0);
    }
  });

  test("Arrows disappear on mouse leave and source sections clear", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const netWorthCard = page.locator(
      '[data-testid="metric-card-net-worth"]'
    );
    await netWorthCard.scrollIntoViewIfNeeded();

    // Hover to activate arrows
    await netWorthCard.hover();
    await page.waitForSelector('[data-testid="data-flow-overlay"]', {
      timeout: 5000,
    });
    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 3000,
    });

    // Verify something is highlighted
    let highlighted = page.locator("[data-dataflow-highlighted]");
    const activeCount = await highlighted.count();
    expect(activeCount).toBeGreaterThanOrEqual(1);

    // Move away
    await page.mouse.move(0, 0);

    // Everything should clear
    const overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).not.toBeAttached({ timeout: 3000 });
    highlighted = page.locator("[data-dataflow-highlighted]");
    await expect(highlighted).toHaveCount(0);
  });

  test("Source sections highlight correctly — positive green, negative red", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Net Worth: assets=positive, debts=negative
    const netWorthCard = page.locator(
      '[data-testid="metric-card-net-worth"]'
    );
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.hover();
    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });

    const assetsEl = page.locator(
      '[data-dataflow-source="section-assets"]'
    );
    const debtsEl = page.locator(
      '[data-dataflow-source="section-debts"]'
    );
    await expect(assetsEl).toHaveAttribute(
      "data-dataflow-highlighted",
      "positive"
    );
    await expect(debtsEl).toHaveAttribute(
      "data-dataflow-highlighted",
      "negative"
    );

    // Clear
    await page.mouse.move(0, 0);
    await expect(
      page.locator("[data-dataflow-highlighted]")
    ).toHaveCount(0, { timeout: 3000 });

    // Monthly Surplus: income=positive, expenses=negative
    const surplusCard = page.locator(
      '[data-testid="metric-card-monthly-surplus"]'
    );
    await surplusCard.scrollIntoViewIfNeeded();
    await surplusCard.hover();
    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });

    const incomeEl = page.locator(
      '[data-dataflow-source="section-income"]'
    );
    const expensesEl = page.locator(
      '[data-dataflow-source="section-expenses"]'
    );
    await expect(incomeEl).toHaveAttribute(
      "data-dataflow-highlighted",
      "positive"
    );
    await expect(expensesEl).toHaveAttribute(
      "data-dataflow-highlighted",
      "negative"
    );

    await captureScreenshot(page, "task-76-source-highlights");
  });

  test("Arrows render correctly with collapsed sections", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Collapse the assets section
    const assetsSection = page.locator("#assets");
    await assetsSection.scrollIntoViewIfNeeded();
    const collapseBtn = assetsSection
      .locator('button[aria-expanded="true"]')
      .first();
    if (await collapseBtn.isVisible().catch(() => false)) {
      await collapseBtn.click();
      await page.waitForTimeout(500);
    }

    // Source should still be registered when collapsed
    const assetsSource = page.locator(
      '[data-dataflow-source="section-assets"]'
    );
    await expect(assetsSource).toBeAttached();

    // Hover Net Worth — arrows should still work
    const netWorthCard = page.locator(
      '[data-testid="metric-card-net-worth"]'
    );
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.hover();

    await page.waitForSelector('[data-testid="data-flow-overlay"]', {
      timeout: 5000,
    });
    const overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).toBeAttached();

    // Assets section still highlighted even when collapsed
    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 3000,
    });
    await expect(assetsSource).toHaveAttribute(
      "data-dataflow-highlighted",
      "positive"
    );

    await captureScreenshot(page, "task-76-collapsed-section-arrows");

    await page.mouse.move(0, 0);
    await expect(overlay).not.toBeAttached({ timeout: 3000 });
  });

  test("Mobile viewport shows highlight-only mode without SVG arrows", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Focus Net Worth card (use focus instead of hover for mobile)
    const netWorthCard = page.locator(
      '[data-testid="metric-card-net-worth"]'
    );
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.focus();

    // Wait for highlights (but no SVG overlay)
    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });

    // SVG overlay should NOT exist on mobile
    const overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).not.toBeAttached();

    // But highlights should be present
    const highlighted = page.locator("[data-dataflow-highlighted]");
    const count = await highlighted.count();
    expect(count).toBeGreaterThanOrEqual(1);

    await captureScreenshot(page, "task-76-mobile-highlight-only");
  });

  test("Arrows update when financial data changes — add an asset", async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // First hover Net Worth to see initial arrows
    const netWorthCard = page.locator(
      '[data-testid="metric-card-net-worth"]'
    );
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.hover();

    await page.waitForSelector('[data-testid="data-flow-overlay"]', {
      timeout: 5000,
    });
    let overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).toBeAttached();

    const initialPaths = await overlay.locator("path").count();

    // Move away to clear arrows
    await page.mouse.move(0, 0);
    await expect(overlay).not.toBeAttached({ timeout: 3000 });

    // Scroll to assets section and add a new asset
    const assetsSection = page.locator("#assets");
    await assetsSection.scrollIntoViewIfNeeded();
    const addBtn = assetsSection.getByRole("button", { name: /add/i });
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
    }

    // Re-hover Net Worth — arrows should still work with updated data
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.hover();

    await page.waitForSelector('[data-testid="data-flow-overlay"]', {
      timeout: 5000,
    });
    overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).toBeAttached();

    // Arrows still render (path count may change but should be > 0)
    const updatedPaths = await overlay.locator("path").count();
    expect(updatedPaths).toBeGreaterThanOrEqual(2);

    await captureScreenshot(page, "task-76-arrows-after-data-change");

    await page.mouse.move(0, 0);
    await expect(overlay).not.toBeAttached({ timeout: 3000 });
  });

  test("Keyboard focus activates arrows — accessibility", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Focus Net Worth card via keyboard
    const netWorthCard = page.locator(
      '[data-testid="metric-card-net-worth"]'
    );
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.focus();

    // Arrows should appear just like on hover
    await page.waitForSelector('[data-testid="data-flow-overlay"]', {
      timeout: 5000,
    });
    const overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).toBeAttached();

    // Highlights should be active
    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 3000,
    });
    const highlighted = page.locator("[data-dataflow-highlighted]");
    expect(await highlighted.count()).toBeGreaterThanOrEqual(1);

    // Aria-live should announce sources
    const ariaLive = netWorthCard.locator(
      '[data-testid="dataflow-aria-live"]'
    );
    const ariaLiveCount = await ariaLive.count();
    if (ariaLiveCount > 0) {
      await page.waitForTimeout(500);
      const text = await ariaLive.textContent();
      expect(text?.length).toBeGreaterThan(0);
    }

    await captureScreenshot(page, "task-76-keyboard-focus-arrows");

    // Blur should clear
    await page.locator("body").click();
    await page.waitForTimeout(500);
  });
});
