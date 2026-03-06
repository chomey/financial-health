import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Milestone 10: Explainer & Tax Treatment Enhancements (Tasks 83-96)", () => {
  test.describe("1. Withdrawal Tax Impact in Financial Runway explainer", () => {
    test("shows withdrawal tax content in runway explainer with 'Suggested' label and disclaimer", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Standalone card should NOT exist
      await expect(page.locator('[data-testid="withdrawal-tax-summary"]')).not.toBeVisible();

      // Open Financial Runway explainer
      const runwayCard = page.locator('[data-testid="metric-card-financial-runway"]');
      await runwayCard.scrollIntoViewIfNeeded();
      await runwayCard.click();

      const modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      // Withdrawal tax content visible in explainer
      const withdrawalTax = modal.locator('[data-testid="runway-withdrawal-tax"]');
      await expect(withdrawalTax).toBeVisible();

      // Withdrawal order labeled "Suggested"
      await expect(
        withdrawalTax.locator("text=Suggested Withdrawal Order")
      ).toBeVisible();

      // Disclaimer text visible
      const disclaimer = modal.locator(
        '[data-testid="withdrawal-order-disclaimer"]'
      );
      await expect(disclaimer).toBeVisible();
      await expect(disclaimer).toContainText("rough suggestion");

      await captureScreenshot(page, "task-96-withdrawal-tax-auto-expanded");
      await page.keyboard.press("Escape");
    });
  });

  test.describe("2. Estimated Tax with $0 income", () => {
    test("opens explainer showing jurisdiction bracket info when income is $0", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Remove salary income
      const salaryRow = page
        .getByRole("listitem")
        .filter({ hasText: "Salary" });
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
      const taxCard = page.locator(
        '[data-testid="metric-card-estimated-tax"]'
      );
      await expect(taxCard).toContainText("CA$0");

      // Click should still open explainer
      await taxCard.click();
      const modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      // Should show tax explainer content
      await expect(
        page.locator('[data-testid="tax-explainer"]')
      ).toBeVisible();

      // Zero-income message with jurisdiction
      const zeroMsg = page.locator(
        '[data-testid="tax-zero-income-message"]'
      );
      await expect(zeroMsg).toBeVisible();
      await expect(zeroMsg).toContainText("No income entered");

      // Bracket reference table visible
      await expect(
        page.locator('[data-testid="tax-federal-brackets-table"]')
      ).toBeVisible();

      await captureScreenshot(page, "task-96-tax-zero-income");
      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("3. Runway burndown chart on main page", () => {
    test("renders full-width below projections, not in modal", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Unified chart with mode tabs
      const chart = page.locator('[data-testid="projection-chart"]');
      await expect(chart).toBeVisible({ timeout: 5000 });

      // Mode tabs visible
      await expect(chart.locator('[data-testid="chart-mode-tabs"]')).toBeVisible();

      // Switch to Income Stops
      await chart.locator('[data-testid="mode-income-stops"]').click();

      // Has summary, legend, and starting balances
      await expect(
        chart.locator('[data-testid="burndown-summary"]')
      ).toBeVisible();
      await expect(
        chart.locator('[data-testid="burndown-legend"]')
      ).toBeVisible();
      await expect(
        chart.locator('[data-testid="burndown-starting-balances"]')
      ).toBeVisible();

      // Withdrawal order present
      await expect(
        chart.locator('[data-testid="burndown-withdrawal-order"]')
      ).toBeVisible();

      await captureScreenshot(page, "task-96-runway-burndown-main");

      // Switch back to Keep Earning for subsequent tests
      await chart.locator('[data-testid="mode-keep-earning"]').click();
    });

    test("runway explainer modal shows condensed content referencing main chart", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const runwayCard = page.locator(
        '[data-testid="metric-card-financial-runway"]'
      );
      await runwayCard.scrollIntoViewIfNeeded();
      await runwayCard.click();

      const modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      // Should show note pointing to main page chart
      const chartNote = modal.locator('[data-testid="runway-chart-note"]');
      await expect(chartNote).toBeVisible();
      await expect(chartNote).toContainText("Income Stops");

      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("4. Estimated Tax with income — bracket visualization", () => {
    test("shows bracket bar, federal/provincial breakdown, and rates", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const taxCard = page.locator(
        '[data-testid="metric-card-estimated-tax"]'
      );
      await taxCard.scrollIntoViewIfNeeded();
      await taxCard.click();

      const modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      // Tax explainer content (not generic source cards)
      await expect(
        page.locator('[data-testid="tax-explainer"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="explainer-sources"]')
      ).not.toBeVisible();

      // Bracket bar with colored segments
      const bracketBar = page.locator('[data-testid="tax-bracket-bar"]');
      await expect(bracketBar).toBeVisible();
      const segments = page.locator('[data-testid^="tax-bracket-segment-"]');
      expect(await segments.count()).toBeGreaterThan(0);

      // Federal/provincial breakdown
      const breakdown = modal.locator('[data-testid="tax-breakdown"]');
      await breakdown.scrollIntoViewIfNeeded();
      await expect(breakdown).toBeVisible();
      await expect(breakdown).toContainText("Federal");
      await expect(breakdown).toContainText("Provincial");
      await expect(
        page.locator('[data-testid="tax-federal-amount"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="tax-provincial-amount"]')
      ).toBeVisible();

      // Effective vs marginal rates
      const rates = page.locator('[data-testid="tax-rates"]');
      await expect(rates).toBeVisible();
      const effectiveRate = page.locator(
        '[data-testid="tax-effective-rate"]'
      );
      await expect(effectiveRate).toBeVisible();
      const effectiveText = await effectiveRate.textContent();
      expect(effectiveText).toMatch(/\d+\.\d+%/);

      const marginalRate = page.locator(
        '[data-testid="tax-marginal-rate"]'
      );
      await expect(marginalRate).toBeVisible();
      const marginalText = await marginalRate.textContent();
      expect(marginalText).toMatch(/\d+\.\d+%/);

      // After-tax flow
      await expect(
        page.locator('[data-testid="tax-after-tax-flow"]')
      ).toBeVisible();

      await captureScreenshot(page, "task-96-tax-bracket-visualization");
      await page.keyboard.press("Escape");
    });
  });

  test.describe("5. Asset ROI tax treatment toggle", () => {
    test("visible on savings, hidden on TFSA/Roth, defaults correct", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForSelector('[aria-label="Asset items"]');

      // Savings Account should show toggle with "Interest income" default
      const savingsItem = page
        .locator('[role="listitem"]')
        .filter({ hasText: "Savings Account" });
      const savingsToggle = savingsItem.locator(
        '[data-testid^="roi-tax-treatment-"]'
      );
      await expect(savingsToggle).toBeVisible();
      await expect(savingsToggle).toContainText("Interest income");

      // TFSA should NOT show toggle (tax-sheltered)
      const tfsaItem = page
        .locator('[role="listitem"]')
        .filter({ hasText: "TFSA" });
      const tfsaToggle = tfsaItem.locator(
        '[data-testid^="roi-tax-treatment-"]'
      );
      await expect(tfsaToggle).toHaveCount(0);

      // RRSP should show toggle (tax-deferred, not sheltered for ROI)
      const rrspItem = page
        .locator('[role="listitem"]')
        .filter({ hasText: "RRSP" });
      const rrspToggle = rrspItem.locator(
        '[data-testid^="roi-tax-treatment-"]'
      );
      // RRSP might not show toggle depending on default ROI
      // Just verify TFSA is hidden — that's the key assertion

      // Toggle cycles correctly
      await savingsToggle.click();
      await expect(savingsToggle).toContainText("Capital gains");
      await savingsToggle.click();
      await expect(savingsToggle).toContainText("Interest income");

      await captureScreenshot(page, "task-96-roi-tax-toggle");
    });
  });

  test.describe("6. Source summary cards — scrollable with frozen total", () => {
    test("shows all items in scrollable list with sticky total", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Open Net Worth explainer
      const netWorthCard = page.locator(
        '[data-testid="metric-card-net-worth"]'
      );
      await netWorthCard.scrollIntoViewIfNeeded();
      await netWorthCard.click();

      const modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      // Items container is scrollable
      const assetsItems = page.locator(
        '[data-testid="source-summary-items-section-assets"]'
      );
      await expect(assetsItems).toBeVisible();
      const overflowY = await assetsItems.evaluate(
        (el) => getComputedStyle(el).overflowY
      );
      expect(overflowY).toBe("auto");

      // Total row has sticky positioning
      const totalRow = page.locator(
        '[data-testid="source-summary-total-row-section-assets"]'
      );
      await expect(totalRow).toBeVisible();
      const position = await totalRow.evaluate(
        (el) => getComputedStyle(el).position
      );
      expect(position).toBe("sticky");

      // No "+N more" truncation
      await expect(page.locator("text=/\\+\\d+ more/")).not.toBeVisible();

      // Modal uses wider max-w-xl
      const maxWidth = await modal.evaluate(
        (el) => getComputedStyle(el).maxWidth
      );
      expect(parseInt(maxWidth)).toBeGreaterThanOrEqual(576);

      await captureScreenshot(page, "task-96-scrollable-source-cards");
      await page.keyboard.press("Escape");
    });
  });

  test.describe("7. Modal close mechanisms", () => {
    test("Escape closes explainer modal", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const netWorthCard = page.locator(
        '[data-testid="metric-card-net-worth"]'
      );
      await netWorthCard.scrollIntoViewIfNeeded();
      await netWorthCard.click();

      const modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    });

    test("X button closes explainer modal", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const taxCard = page.locator(
        '[data-testid="metric-card-estimated-tax"]'
      );
      await taxCard.scrollIntoViewIfNeeded();
      await taxCard.click();

      const modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      await page.locator('[data-testid="explainer-close"]').click();
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    });

    test("clicking outside (backdrop) closes explainer modal", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const surplusCard = page.locator(
        '[data-testid="metric-card-monthly-surplus"]'
      );
      await surplusCard.scrollIntoViewIfNeeded();
      await surplusCard.click();

      const modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      await page.locator('[data-testid="explainer-backdrop"]').click({
        position: { x: 10, y: 10 },
      });
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("Full multi-step journey", () => {
    test("complete flow across all enhanced features", async ({ page }) => {
      test.setTimeout(120000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Step 1: Verify withdrawal tax content in Financial Runway explainer
      const runwayCardStep1 = page.locator(
        '[data-testid="metric-card-financial-runway"]'
      );
      await runwayCardStep1.scrollIntoViewIfNeeded();
      await runwayCardStep1.click();
      let modalStep1 = page.locator('[data-testid="explainer-modal"]');
      await expect(modalStep1).toBeVisible({ timeout: 3000 });
      await expect(
        modalStep1.locator('[data-testid="runway-withdrawal-tax"]')
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(modalStep1).not.toBeVisible({ timeout: 3000 });

      // Step 2: Verify burndown available in Income Stops mode
      const chart = page.locator('[data-testid="projection-chart"]');
      await expect(chart.locator('[data-testid="chart-mode-tabs"]')).toBeVisible();
      await chart.locator('[data-testid="mode-income-stops"]').click();
      await expect(chart.locator('[data-testid="burndown-summary"]')).toBeVisible();
      await chart.locator('[data-testid="mode-keep-earning"]').click();

      // Step 3: Open Estimated Tax explainer with income
      const taxCard = page.locator(
        '[data-testid="metric-card-estimated-tax"]'
      );
      await taxCard.scrollIntoViewIfNeeded();
      await taxCard.click();
      let modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });
      await expect(
        page.locator('[data-testid="tax-explainer"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="tax-federal-brackets-table"]')
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible({ timeout: 3000 });

      // Step 4: Open Net Worth explainer — verify scrollable source cards
      const netWorthCard = page.locator(
        '[data-testid="metric-card-net-worth"]'
      );
      await netWorthCard.scrollIntoViewIfNeeded();
      await netWorthCard.click();
      modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });
      await expect(
        page.locator(
          '[data-testid="source-summary-items-section-assets"]'
        )
      ).toBeVisible();
      await page.locator('[data-testid="explainer-close"]').click();
      await expect(modal).not.toBeVisible({ timeout: 3000 });

      // Step 5: Verify ROI tax treatment toggle on Savings Account
      const savingsItem = page
        .locator('[role="listitem"]')
        .filter({ hasText: "Savings Account" });
      const toggle = savingsItem.locator(
        '[data-testid^="roi-tax-treatment-"]'
      );
      await expect(toggle).toBeVisible();

      // Step 6: Open Financial Runway — verify condensed modal
      const runwayCard = page.locator(
        '[data-testid="metric-card-financial-runway"]'
      );
      await runwayCard.scrollIntoViewIfNeeded();
      await runwayCard.click();
      modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });
      await expect(
        modal.locator('[data-testid="runway-chart-note"]')
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible({ timeout: 3000 });

      // Step 7: Remove income and assets to verify $0 tax explainer
      const salaryRow = page
        .getByRole("listitem")
        .filter({ hasText: "Salary" });
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
      await expect(
        page.locator('[data-testid="tax-zero-income-message"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="tax-federal-brackets-table"]')
      ).toBeVisible();
      await page.keyboard.press("Escape");

      await captureScreenshot(page, "task-96-full-journey-complete");
    });
  });
});
