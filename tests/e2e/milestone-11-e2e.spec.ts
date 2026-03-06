import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Milestone 11: Unified Chart & Final Enhancements (Tasks 97-101)", () => {
  test.describe("1. Unified chart with mode tabs", () => {
    test("shows Keep Earning and Income Stops mode tabs on projection chart", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const chart = page.locator('[data-testid="projection-chart"]');
      await expect(chart).toBeVisible({ timeout: 5000 });

      // Mode tabs visible
      const modeTabs = chart.locator('[data-testid="chart-mode-tabs"]');
      await expect(modeTabs).toBeVisible();
      await expect(modeTabs.locator('[data-testid="mode-keep-earning"]')).toBeVisible();
      await expect(modeTabs.locator('[data-testid="mode-income-stops"]')).toBeVisible();

      // Default is Keep Earning — summary table visible
      await expect(chart.locator('[data-testid="projection-summary-table"]')).toBeVisible();

      await captureScreenshot(page, "task-101-unified-chart-keep-earning");
    });

    test("switches to Income Stops mode showing burndown content", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const chart = page.locator('[data-testid="projection-chart"]');
      await chart.locator('[data-testid="mode-income-stops"]').click();

      // Burndown elements visible
      await expect(chart.locator('[data-testid="burndown-summary"]')).toBeVisible();
      await expect(chart.locator('[data-testid="burndown-legend"]')).toBeVisible();
      await expect(chart.locator('[data-testid="burndown-starting-balances"]')).toBeVisible();
      await expect(chart.locator('[data-testid="burndown-withdrawal-order"]')).toBeVisible();

      // Keep Earning elements hidden
      await expect(chart.locator('[data-testid="projection-summary-table"]')).not.toBeVisible();

      await captureScreenshot(page, "task-101-unified-chart-income-stops");
    });
  });

  test.describe("2. 50-year chart with 40yr/50yr columns", () => {
    test("shows 40yr and 50yr columns in projection summary table", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const chart = page.locator('[data-testid="projection-chart"]');
      await expect(chart).toBeVisible({ timeout: 5000 });

      // Summary table should have 40yr and 50yr columns
      const summaryTable = chart.locator('[data-testid="projection-summary-table"]');
      await expect(summaryTable).toBeVisible();
      await expect(summaryTable).toContainText("40yr");
      await expect(summaryTable).toContainText("50yr");

      // No timeline selector buttons
      await expect(chart.locator("text=/^10 years$/")).not.toBeVisible();
      await expect(chart.locator("text=/^20 years$/")).not.toBeVisible();
      await expect(chart.locator("text=/^30 years$/")).not.toBeVisible();

      await captureScreenshot(page, "task-101-50yr-summary-table");
    });

    test("asset projections table shows 40yr and 50yr columns", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const chart = page.locator('[data-testid="projection-chart"]');
      const assetTable = chart.locator('[data-testid="asset-projections-table"]');
      await expect(assetTable).toBeVisible();
      await expect(assetTable).toContainText("40yr");
      await expect(assetTable).toContainText("50yr");
    });
  });

  test.describe("3. Dual bracket tables in tax explainer", () => {
    test("shows both federal and provincial bracket tables with subtotals", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Open tax explainer
      const taxCard = page.locator('[data-testid="metric-card-estimated-tax"]');
      await taxCard.scrollIntoViewIfNeeded();
      await taxCard.click();

      const modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      // Federal bracket table
      const federalTable = page.locator('[data-testid="tax-federal-brackets-table"]');
      await expect(federalTable).toBeVisible();
      await expect(page.locator('[data-testid="tax-federal-brackets-subtotal"]')).toBeVisible();

      // Provincial bracket table
      const provincialTable = page.locator('[data-testid="tax-provincial-brackets-table"]');
      await provincialTable.scrollIntoViewIfNeeded();
      await expect(provincialTable).toBeVisible();
      await expect(page.locator('[data-testid="tax-provincial-brackets-subtotal"]')).toBeVisible();

      await captureScreenshot(page, "task-101-dual-bracket-tables");
      await page.keyboard.press("Escape");
    });
  });

  test.describe("4. Investment income tax in explainer", () => {
    test("shows investment interest income section for taxable savings accounts", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Open tax explainer
      const taxCard = page.locator('[data-testid="metric-card-estimated-tax"]');
      await taxCard.scrollIntoViewIfNeeded();
      await taxCard.click();

      const modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      // Investment income section should be visible (default data has Savings Account with ROI)
      const investmentSection = modal.locator('[data-testid="tax-investment-income"]');
      await investmentSection.scrollIntoViewIfNeeded();
      await expect(investmentSection).toBeVisible();

      // Should show at least one account
      await expect(modal.locator('[data-testid="tax-investment-account-0"]')).toBeVisible();

      await captureScreenshot(page, "task-101-investment-income-tax");
      await page.keyboard.press("Escape");
    });
  });

  test.describe("5. Withdrawal tax merged into Financial Runway explainer", () => {
    test("shows withdrawal tax content with suggested order and disclaimer in runway explainer", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Open Financial Runway explainer
      const runwayCard = page.locator('[data-testid="metric-card-financial-runway"]');
      await runwayCard.scrollIntoViewIfNeeded();
      await runwayCard.click();

      const modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      // Withdrawal tax section visible
      const withdrawalTax = modal.locator('[data-testid="runway-withdrawal-tax"]');
      await expect(withdrawalTax).toBeVisible();

      // "Suggested" withdrawal order
      await expect(withdrawalTax.locator("text=Suggested Withdrawal Order")).toBeVisible();

      // Disclaimer
      const disclaimer = modal.locator('[data-testid="withdrawal-order-disclaimer"]');
      await expect(disclaimer).toBeVisible();
      await expect(disclaimer).toContainText("rough suggestion");

      // Chart note referencing Income Stops mode
      const chartNote = modal.locator('[data-testid="runway-chart-note"]');
      await expect(chartNote).toBeVisible();
      await expect(chartNote).toContainText("Income Stops");

      await captureScreenshot(page, "task-101-runway-withdrawal-tax");
      await page.keyboard.press("Escape");
    });
  });

  test.describe("6. $0 income tax explainer with bracket reference", () => {
    test("clicking Estimated Tax with $0 income opens explainer with bracket tables", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Remove salary income
      const salaryRow = page.getByRole("listitem").filter({ hasText: "Salary" });
      await salaryRow.hover();
      await page.getByLabel("Delete Salary").click();
      await page.waitForTimeout(300);

      // Also remove all assets to eliminate investment interest income
      await page.click('button:has-text("Assets")');
      await page.waitForTimeout(300);
      for (const label of ["Savings Account", "TFSA", "RRSP"]) {
        const row = page.getByRole("listitem").filter({ hasText: label });
        if (await row.count() > 0) {
          await row.hover();
          await page.getByLabel(`Delete ${label}`).click();
          await page.waitForTimeout(200);
        }
      }
      await page.click('button:has-text("Dashboard")');
      await page.waitForTimeout(300);

      // Tax card should show $0
      const taxCard = page.locator('[data-testid="metric-card-estimated-tax"]');
      await expect(taxCard).toContainText("CA$0");

      // Click to open explainer
      await taxCard.click();
      const modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      // Zero income message
      await expect(page.locator('[data-testid="tax-zero-income-message"]')).toBeVisible();

      // Federal bracket table still visible for reference
      await expect(page.locator('[data-testid="tax-federal-brackets-table"]')).toBeVisible();

      // Fill bars should NOT be visible (no income to fill)
      await expect(page.locator('[data-testid^="tax-federal-brackets-fill-"]')).not.toBeVisible();

      await captureScreenshot(page, "task-101-zero-income-tax-explainer");
      await page.keyboard.press("Escape");
    });
  });

  test.describe("7. Modal close mechanisms", () => {
    test("Escape, X button, and backdrop all close explainer modal", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const modal = page.locator('[data-testid="explainer-modal"]');

      // Test 1: Escape closes modal
      const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
      await netWorthCard.scrollIntoViewIfNeeded();
      await netWorthCard.click();
      await expect(modal).toBeVisible({ timeout: 3000 });
      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible({ timeout: 3000 });

      // Test 2: X button closes modal
      const taxCard = page.locator('[data-testid="metric-card-estimated-tax"]');
      await taxCard.scrollIntoViewIfNeeded();
      await taxCard.click();
      await expect(modal).toBeVisible({ timeout: 3000 });
      await page.locator('[data-testid="explainer-close"]').click();
      await expect(modal).not.toBeVisible({ timeout: 3000 });

      // Test 3: Backdrop click closes modal
      const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
      await surplusCard.scrollIntoViewIfNeeded();
      await surplusCard.click();
      await expect(modal).toBeVisible({ timeout: 3000 });
      await page.locator('[data-testid="explainer-backdrop"]').click({
        position: { x: 10, y: 10 },
      });
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("8. ROI tax treatment toggle", () => {
    test("visible on savings, hidden on TFSA, cycles correctly", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForSelector('[aria-label="Asset items"]');

      // Savings Account should show toggle
      const savingsItem = page.locator('[role="listitem"]').filter({ hasText: "Savings Account" });
      const savingsToggle = savingsItem.locator('[data-testid^="roi-tax-treatment-"]');
      await expect(savingsToggle).toBeVisible();
      await expect(savingsToggle).toContainText("Interest income");

      // TFSA should NOT show toggle
      const tfsaItem = page.locator('[role="listitem"]').filter({ hasText: "TFSA" });
      const tfsaToggle = tfsaItem.locator('[data-testid^="roi-tax-treatment-"]');
      await expect(tfsaToggle).toHaveCount(0);

      // Toggle cycles
      await savingsToggle.click();
      await expect(savingsToggle).toContainText("Capital gains");
      await savingsToggle.click();
      await expect(savingsToggle).toContainText("Interest income");

      await captureScreenshot(page, "task-101-roi-tax-toggle");
    });
  });

  test.describe("9. Source summary cards — scrollable with frozen total", () => {
    test("shows all items in scrollable list with sticky total", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Open Net Worth explainer
      const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
      await netWorthCard.scrollIntoViewIfNeeded();
      await netWorthCard.click();

      const modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      // Items container is scrollable
      const assetsItems = page.locator('[data-testid="source-summary-items-section-assets"]');
      await expect(assetsItems).toBeVisible();
      const overflowY = await assetsItems.evaluate((el) => getComputedStyle(el).overflowY);
      expect(overflowY).toBe("auto");

      // Total row has sticky positioning
      const totalRow = page.locator('[data-testid="source-summary-total-row-section-assets"]');
      await expect(totalRow).toBeVisible();
      const position = await totalRow.evaluate((el) => getComputedStyle(el).position);
      expect(position).toBe("sticky");

      await captureScreenshot(page, "task-101-scrollable-source-cards");
      await page.keyboard.press("Escape");
    });
  });

  test.describe("Full multi-step journey", () => {
    test("complete flow across unified chart, tax explainer, and runway features", async ({
      page,
    }) => {
      test.setTimeout(120000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Step 1: Unified chart — verify mode tabs and switch to Income Stops
      const chart = page.locator('[data-testid="projection-chart"]');
      await expect(chart.locator('[data-testid="chart-mode-tabs"]')).toBeVisible();

      // Verify 50yr columns in Keep Earning mode
      const summaryTable = chart.locator('[data-testid="projection-summary-table"]');
      await expect(summaryTable).toContainText("40yr");
      await expect(summaryTable).toContainText("50yr");

      // Switch to Income Stops
      await chart.locator('[data-testid="mode-income-stops"]').click();
      await expect(chart.locator('[data-testid="burndown-summary"]')).toBeVisible();
      await expect(chart.locator('[data-testid="burndown-withdrawal-order"]')).toBeVisible();

      // Switch back
      await chart.locator('[data-testid="mode-keep-earning"]').click();

      // Step 2: Tax explainer with dual bracket tables
      const taxCard = page.locator('[data-testid="metric-card-estimated-tax"]');
      await taxCard.scrollIntoViewIfNeeded();
      await taxCard.click();
      let modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      // Federal and provincial tables
      await expect(page.locator('[data-testid="tax-federal-brackets-table"]')).toBeVisible();
      const provincialTable = page.locator('[data-testid="tax-provincial-brackets-table"]');
      await provincialTable.scrollIntoViewIfNeeded();
      await expect(provincialTable).toBeVisible();

      // Investment income section
      const investmentSection = modal.locator('[data-testid="tax-investment-income"]');
      await investmentSection.scrollIntoViewIfNeeded();
      await expect(investmentSection).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible({ timeout: 3000 });

      // Step 3: Financial Runway with merged withdrawal tax
      const runwayCard = page.locator('[data-testid="metric-card-financial-runway"]');
      await runwayCard.scrollIntoViewIfNeeded();
      await runwayCard.click();
      modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      // Withdrawal tax merged in
      await expect(modal.locator('[data-testid="runway-withdrawal-tax"]')).toBeVisible();
      await expect(modal.locator('[data-testid="runway-chart-note"]')).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible({ timeout: 3000 });

      // Step 4: ROI tax treatment toggle
      const savingsItem = page.locator('[role="listitem"]').filter({ hasText: "Savings Account" });
      const toggle = savingsItem.locator('[data-testid^="roi-tax-treatment-"]');
      await expect(toggle).toBeVisible();

      // Step 5: Remove income and assets to verify $0 tax explainer
      const salaryRow = page.getByRole("listitem").filter({ hasText: "Salary" });
      await salaryRow.hover();
      await page.getByLabel("Delete Salary").click();
      await page.waitForTimeout(300);

      // Remove all assets to eliminate investment interest income
      await page.click('button:has-text("Assets")');
      await page.waitForTimeout(300);
      for (const label of ["Savings Account", "TFSA", "RRSP"]) {
        const row = page.getByRole("listitem").filter({ hasText: label });
        if (await row.count() > 0) {
          await row.hover();
          await page.getByLabel(`Delete ${label}`).click();
          await page.waitForTimeout(200);
        }
      }
      await page.click('button:has-text("Dashboard")');
      await page.waitForTimeout(300);

      await taxCard.scrollIntoViewIfNeeded();
      await taxCard.click();
      modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });
      await expect(page.locator('[data-testid="tax-zero-income-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="tax-federal-brackets-table"]')).toBeVisible();
      await page.keyboard.press("Escape");

      await captureScreenshot(page, "task-101-full-journey-complete");
    });
  });
});
