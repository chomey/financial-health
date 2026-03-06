import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Explainer Modal System — Milestone E2E (replaces spotlight dimming)", () => {
  test("Net Worth card click opens explainer modal with source cards and hand-drawn ovals", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();

    // No modal initially
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible();

    // Click Net Worth card
    await netWorthCard.click();

    // Explainer modal should appear
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    // Title and value displayed
    await expect(page.locator('[data-testid="explainer-title"]')).toContainText("Net Worth");
    await expect(page.locator('[data-testid="explainer-value"]')).toBeVisible();

    // Assets (positive) and debts (negative) source cards
    await expect(page.locator('[data-testid="explainer-source-section-assets"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-section-debts"]')).toBeVisible();

    // Positive source card has green left border
    const assetsCard = page.locator('[data-testid="explainer-source-section-assets"]');
    const assetsClasses = await assetsCard.getAttribute("class");
    expect(assetsClasses).toContain("border-l-green-500");

    // Negative source card has red left border
    const debtsCard = page.locator('[data-testid="explainer-source-section-debts"]');
    const debtsClasses = await debtsCard.getAttribute("class");
    expect(debtsClasses).toContain("border-l-rose-500");

    // Hand-drawn oval SVG paths exist
    await expect(page.locator('[data-testid="explainer-oval-section-assets"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-oval-section-debts"]')).toBeVisible();

    // Result section with equals sign
    await expect(page.locator('[data-testid="explainer-result-value"]')).toBeVisible();

    await captureScreenshot(page, "task-78-net-worth-explainer");
  });

  test("Monthly Surplus explainer shows income and expenses with operators", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.scrollIntoViewIfNeeded();
    await surplusCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    // Income and expenses sources
    await expect(page.locator('[data-testid="explainer-source-section-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-section-expenses"]')).toBeVisible();

    // Operator between sources
    const operator = page.locator('[data-testid^="explainer-operator-"]').first();
    await expect(operator).toBeVisible();

    // Result value
    await expect(page.locator('[data-testid="explainer-result-value"]')).toBeVisible();

    await captureScreenshot(page, "task-78-monthly-surplus-explainer");
  });

  test("explainer modals work for Estimated Tax, Financial Runway, and Debt-to-Asset Ratio", async ({
    page,
  }) => {
    test.setTimeout(90000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // --- Estimated Tax ---
    const taxCard = page.locator('[data-testid="metric-card-estimated-tax"]');
    await taxCard.scrollIntoViewIfNeeded();
    await taxCard.click();
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="explainer-title"]')).toContainText("Estimated Tax");
    await captureScreenshot(page, "task-78-estimated-tax-explainer");
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible({ timeout: 3000 });

    // --- Financial Runway ---
    const runwayCard = page.locator('[data-testid="metric-card-financial-runway"]');
    await runwayCard.scrollIntoViewIfNeeded();
    await runwayCard.click();
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="explainer-title"]')).toContainText("Financial Runway");
    await captureScreenshot(page, "task-78-financial-runway-explainer");
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible({ timeout: 3000 });

    // --- Debt-to-Asset Ratio ---
    const debtRatioCard = page.locator('[data-testid="metric-card-debt-to-asset-ratio"]');
    await debtRatioCard.scrollIntoViewIfNeeded();
    await debtRatioCard.click();
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="explainer-title"]')).toContainText("Debt-to-Asset Ratio");
    await captureScreenshot(page, "task-78-debt-to-asset-ratio-explainer");
    await page.keyboard.press("Escape");
  });

  test("explainer modal closes via close button, Escape key, and backdrop click", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();

    // Close via X button
    await netWorthCard.click();
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="explainer-close"]').click();
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible({ timeout: 3000 });

    // Close via Escape
    await netWorthCard.click();
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible({ timeout: 3000 });

    // Close via backdrop click
    await netWorthCard.click();
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="explainer-backdrop"]').click({ position: { x: 10, y: 10 } });
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible({ timeout: 3000 });
  });

  test("mobile viewport (375px) shows explainer modal with scrollable content", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    // Modal should be visible and scrollable
    const modal = page.locator('[data-testid="explainer-modal"]');
    const overflowY = await modal.evaluate((el) => getComputedStyle(el).overflowY);
    expect(overflowY).toBe("auto");

    await captureScreenshot(page, "task-78-mobile-explainer-modal");
  });

  test("keyboard Enter opens explainer and aria-live announces sources", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.focus();
    await page.keyboard.press("Enter");

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    // Aria-live region announces data sources
    const ariaLive = netWorthCard.locator('[data-testid="dataflow-aria-live"]');
    await page.waitForTimeout(500);
    const text = await ariaLive.textContent();
    expect(text).toContain("Net Worth is calculated from:");

    await captureScreenshot(page, "task-78-keyboard-explainer");
  });

  test("no CLS during explainer modal open/close", async ({
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

    await page.evaluate(() => {
      (window as unknown as { clsEntries: { value: number }[] }).clsEntries = [];
    });

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();

    // Open modal
    await netWorthCard.click();
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await page.waitForTimeout(500);

    // Close modal
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible({ timeout: 3000 });
    await page.waitForTimeout(500);

    const clsTotal = await page.evaluate(() => {
      return (window as unknown as { clsEntries: { value: number }[] }).clsEntries.reduce(
        (sum: number, e: { value: number }) => sum + e.value,
        0
      );
    });

    expect(clsTotal).toBeLessThan(0.1);
  });

  test("insight card click opens explainer modal", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await insightsPanel.scrollIntoViewIfNeeded();

    const surplusInsight = page.locator('[data-insight-type="surplus"]').first();

    if (await surplusInsight.isVisible({ timeout: 2000 }).catch(() => false)) {
      await surplusInsight.click();
      await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

      await captureScreenshot(page, "task-78-insight-explainer");

      await page.keyboard.press("Escape");
    } else {
      const anyInsight = page.locator("[data-insight-type]").first();
      await expect(anyInsight).toBeVisible({ timeout: 3000 });
      await anyInsight.click();
      await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

      await captureScreenshot(page, "task-78-insight-explainer");

      await page.keyboard.press("Escape");
    }
  });
});
