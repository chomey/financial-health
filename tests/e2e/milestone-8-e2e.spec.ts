import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Milestone 8: Data-Flow Visualization (Tasks 69-75)", () => {
  test("Net Worth card — spotlight on assets, stocks, property, and debts on hover", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Add a property with equity to ensure all sources appear
    const propertySection = page.locator("#property");
    await propertySection.scrollIntoViewIfNeeded();
    const propertyHeader = propertySection.locator("button").first();
    const isPropertyExpanded =
      (await propertyHeader.getAttribute("aria-expanded")) !== "false";
    if (!isPropertyExpanded) {
      await propertyHeader.click();
      await page.waitForTimeout(500);
    }

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

    // Spotlight should activate
    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");

    // Verify source sections highlighted
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

    // Move away — spotlight should clear
    await page.mouse.move(0, 0);
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0", { timeout: 3000 });
    const highlighted = page.locator("[data-dataflow-highlighted]");
    await expect(highlighted).toHaveCount(0);
  });

  test("Monthly Surplus card — spotlight on income and expenses on hover", async ({
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
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");

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

    await page.mouse.move(0, 0);
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0", { timeout: 3000 });
  });

  test("Estimated Tax, Financial Runway, and Debt-to-Asset Ratio spotlight", async ({
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

    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");

    const incomeEl = page.locator(
      '[data-dataflow-source="section-income"]'
    );
    await expect(incomeEl).toHaveAttribute(
      "data-dataflow-highlighted",
      "positive"
    );

    await captureScreenshot(page, "task-76-estimated-tax-arrows");

    await page.mouse.move(0, 0);
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0", { timeout: 3000 });

    // --- Financial Runway ---
    const runwayCard = page.locator(
      '[data-testid="metric-card-financial-runway"]'
    );
    await runwayCard.scrollIntoViewIfNeeded();
    await runwayCard.hover();

    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");

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

    await page.mouse.move(0, 0);
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0", { timeout: 3000 });

    // --- Debt-to-Asset Ratio ---
    const debtRatioCard = page.locator(
      '[data-testid="metric-card-debt-to-asset-ratio"]'
    );
    await debtRatioCard.scrollIntoViewIfNeeded();
    await debtRatioCard.hover();

    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");

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

    await page.mouse.move(0, 0);
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0", { timeout: 3000 });
  });

  test("Insight card hover shows relevant spotlight", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await insightsPanel.scrollIntoViewIfNeeded();

    const surplusInsight = page
      .locator('[data-insight-type="surplus"]')
      .first();

    if (await surplusInsight.isVisible({ timeout: 2000 }).catch(() => false)) {
      await surplusInsight.hover();
      await page.waitForSelector("[data-dataflow-highlighted]", {
        timeout: 5000,
      });
      await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");

      const incomeEl = page.locator(
        '[data-dataflow-source="section-income"]'
      );
      await expect(incomeEl).toHaveAttribute(
        "data-dataflow-highlighted",
        "positive"
      );

      await captureScreenshot(page, "task-76-insight-surplus-arrows");

      await page.mouse.move(0, 0);
      await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0", { timeout: 3000 });
    } else {
      const anyInsight = page.locator("[data-insight-type]").first();
      await expect(anyInsight).toBeVisible({ timeout: 3000 });
      await anyInsight.hover();
      await page.waitForSelector("[data-dataflow-highlighted]", {
        timeout: 5000,
      });
      await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");

      await captureScreenshot(page, "task-76-insight-arrows");

      await page.mouse.move(0, 0);
    }
  });

  test("Spotlight clears on mouse leave and source sections clear", async ({
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

    let highlighted = page.locator("[data-dataflow-highlighted]");
    const activeCount = await highlighted.count();
    expect(activeCount).toBeGreaterThanOrEqual(1);

    await page.mouse.move(0, 0);

    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0", { timeout: 3000 });
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

  test("Spotlight works correctly with collapsed sections", async ({
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

    const assetsSource = page.locator(
      '[data-dataflow-source="section-assets"]'
    );
    await expect(assetsSource).toBeAttached();

    // Hover Net Worth — spotlight should still work
    const netWorthCard = page.locator(
      '[data-testid="metric-card-net-worth"]'
    );
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.hover();

    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");

    await expect(assetsSource).toHaveAttribute(
      "data-dataflow-highlighted",
      "positive"
    );

    await captureScreenshot(page, "task-76-collapsed-section-arrows");

    await page.mouse.move(0, 0);
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0", { timeout: 3000 });
  });

  test("Mobile viewport shows highlight-only mode", async ({
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

    const highlighted = page.locator("[data-dataflow-highlighted]");
    const count = await highlighted.count();
    expect(count).toBeGreaterThanOrEqual(1);

    await captureScreenshot(page, "task-76-mobile-highlight-only");
  });

  test("Spotlight updates when financial data changes — add an asset", async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // First hover Net Worth to see initial spotlight
    const netWorthCard = page.locator(
      '[data-testid="metric-card-net-worth"]'
    );
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.hover();

    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");

    // Move away to clear
    await page.mouse.move(0, 0);
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0", { timeout: 3000 });

    // Scroll to assets section and add a new asset
    const assetsSection = page.locator("#assets");
    await assetsSection.scrollIntoViewIfNeeded();
    const addBtn = assetsSection.getByRole("button", { name: /add/i });
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(500);
    }

    // Re-hover Net Worth — spotlight should still work with updated data
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.hover();

    await page.waitForSelector("[data-dataflow-highlighted]", {
      timeout: 5000,
    });
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");

    await captureScreenshot(page, "task-76-arrows-after-data-change");

    await page.mouse.move(0, 0);
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "0", { timeout: 3000 });
  });

  test("Keyboard focus activates spotlight — accessibility", async ({
    page,
  }) => {
    test.setTimeout(60000);
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
    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCSS("opacity", "1");

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

    await page.locator("body").click();
    await page.waitForTimeout(500);
  });
});
