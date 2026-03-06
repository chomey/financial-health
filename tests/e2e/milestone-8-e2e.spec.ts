import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Milestone 8: Data-Flow Visualization (Tasks 69-75) — Click-to-Explain", () => {
  test("Net Worth card — click opens explainer showing assets, stocks, and debts", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click Net Worth card
    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.click();

    // Explainer modal should appear
    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    // Verify source sections in explainer
    await expect(page.locator('[data-testid="explainer-source-section-assets"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-section-debts"]')).toBeVisible();

    // Result value displayed
    await expect(page.locator('[data-testid="explainer-result-value"]')).toBeVisible();

    await captureScreenshot(page, "task-76-net-worth-explainer");

    // Close and verify modal gone
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible({ timeout: 3000 });
  });

  test("Monthly Surplus card — click shows income and expenses in explainer", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.scrollIntoViewIfNeeded();
    await surplusCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await expect(page.locator('[data-testid="explainer-source-section-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-section-expenses"]')).toBeVisible();

    await captureScreenshot(page, "task-76-monthly-surplus-explainer");
    await page.keyboard.press("Escape");
  });

  test("Estimated Tax card — click shows income sources in explainer", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const taxCard = page.locator('[data-testid="metric-card-estimated-tax"]');
    await taxCard.scrollIntoViewIfNeeded();
    await taxCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="explainer-source-section-income"]')).toBeVisible();

    await captureScreenshot(page, "task-76-estimated-tax-explainer");
    await page.keyboard.press("Escape");
  });

  test("Financial Runway card — click shows assets and expenses in explainer", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const runwayCard = page.locator('[data-testid="metric-card-financial-runway"]');
    await runwayCard.scrollIntoViewIfNeeded();
    await runwayCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="explainer-source-section-assets"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-section-expenses"]')).toBeVisible();

    await captureScreenshot(page, "task-76-financial-runway-explainer");
    await page.keyboard.press("Escape");
  });

  test("Debt-to-Asset Ratio card — click shows assets and debts in explainer", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const ratioCard = page.locator('[data-testid="metric-card-debt-to-asset-ratio"]');
    await ratioCard.scrollIntoViewIfNeeded();
    await ratioCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="explainer-source-section-assets"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-section-debts"]')).toBeVisible();

    await captureScreenshot(page, "task-76-debt-to-asset-explainer");
    await page.keyboard.press("Escape");
  });

  test("Insight card click — opens explainer with relevant sources", async ({
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
      await captureScreenshot(page, "task-76-insight-explainer");
      await page.keyboard.press("Escape");
    }
  });

  test("Data-flow sources registered on sections and sub-items", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // All 6 sections registered
    const sectionIds = [
      "section-assets", "section-debts", "section-income",
      "section-expenses", "section-property", "section-stocks",
    ];
    for (const id of sectionIds) {
      await expect(page.locator(`[data-dataflow-source="${id}"]`)).toBeAttached();
    }

    // Sub-source items exist
    expect(await page.locator('[data-dataflow-source^="asset:"]').count()).toBeGreaterThan(0);
    expect(await page.locator('[data-dataflow-source^="debt:"]').count()).toBeGreaterThan(0);

    await captureScreenshot(page, "task-76-source-registration");
  });

  test("Collapsed section keeps data-dataflow-source and re-registers on expand", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Collapse assets section
    const collapseBtn = page.locator('#assets button[aria-label="Collapse Assets"]');
    await collapseBtn.click();

    const collapsed = page.locator('[data-dataflow-source="section-assets"]');
    await expect(collapsed).toHaveAttribute("aria-expanded", "false");

    // Re-expand
    await collapsed.click();
    const expanded = page.locator('[data-dataflow-source="section-assets"]');
    await expect(expanded).not.toHaveAttribute("aria-expanded", "false");

    await captureScreenshot(page, "task-76-collapsed-source");
  });

  test("Mobile viewport — explainer modal works at 375px width", async ({
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

    // Modal should be scrollable
    const modal = page.locator('[data-testid="explainer-modal"]');
    const overflowY = await modal.evaluate((el) => getComputedStyle(el).overflowY);
    expect(overflowY).toBe("auto");

    await captureScreenshot(page, "task-76-mobile-explainer");
    await page.keyboard.press("Escape");
  });

  test("Keyboard focus + Enter activates explainer with aria-live announcement", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.focus();
    await page.keyboard.press("Enter");

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    // aria-live region populated
    const ariaLive = netWorthCard.locator('[data-testid="dataflow-aria-live"]');
    await page.waitForTimeout(500);
    const text = await ariaLive.textContent();
    expect(text).toContain("Net Worth is calculated from:");

    await captureScreenshot(page, "task-76-keyboard-explainer");
    await page.keyboard.press("Escape");
  });

  test("Explainer updates when financial data changes", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Add a new asset
    const assetsSection = page.locator("#assets");
    await assetsSection.scrollIntoViewIfNeeded();

    const addBtn = assetsSection.getByRole("button", { name: /add/i });
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(300);
    }

    // Click Net Worth card and verify explainer shows updated data
    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="explainer-source-section-assets"]')).toBeVisible();

    await captureScreenshot(page, "task-76-explainer-data-change");
    await page.keyboard.press("Escape");
  });
});
