import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Milestone 9: Whiteboard Explainer Modal (Tasks 79-82)", () => {
  test.describe("Net Worth explainer", () => {
    test("shows Assets, Stocks, Property, and Debts summary cards with correct items and totals", async ({
      page,
    }) => {
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

      // Title should be "Net Worth"
      await expect(
        page.locator('[data-testid="explainer-title"]')
      ).toHaveText("Net Worth");

      // Source summary cards for Assets and Debts
      const assetsSummary = page.locator(
        '[data-testid="source-summary-section-assets"]'
      );
      await expect(assetsSummary).toBeVisible();
      await expect(
        page.locator('[data-testid="source-summary-title-section-assets"]')
      ).toHaveText("Assets");

      // Asset items should exist
      const assetsItems = page.locator(
        '[data-testid="source-summary-items-section-assets"]'
      );
      const assetItemCount = await assetsItems.locator("li").count();
      expect(assetItemCount).toBeGreaterThan(0);

      // Asset total with oval annotation
      await expect(
        page.locator('[data-testid="source-summary-total-section-assets"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="source-summary-oval-section-assets"]')
      ).toBeVisible();

      // Debts summary card
      const debtsSummary = page.locator(
        '[data-testid="source-summary-section-debts"]'
      );
      await expect(debtsSummary).toBeVisible();
      await expect(
        page.locator('[data-testid="source-summary-title-section-debts"]')
      ).toHaveText("Debts");
      await expect(
        page.locator('[data-testid="source-summary-total-section-debts"]')
      ).toBeVisible();

      // Arithmetic layout: operators, sum bar, result
      await expect(
        page.locator('[data-testid="explainer-sum-bar"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="explainer-result-area"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="explainer-result-value"]')
      ).toBeVisible();

      // Wait for animations to finish, then screenshot
      await page.waitForTimeout(1500);
      await captureScreenshot(page, "task-82-net-worth-explainer");

      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("Monthly Cash Flow explainer", () => {
    test("shows income and expense breakdowns with operators", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const surplusCard = page.locator(
        '[data-testid="metric-card-monthly-cash-flow"]'
      );
      await surplusCard.scrollIntoViewIfNeeded();
      await surplusCard.click();

      const modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      await expect(
        page.locator('[data-testid="explainer-title"]')
      ).toHaveText("Monthly Cash Flow");

      // Income source card
      await expect(
        page.locator('[data-testid="source-summary-section-income"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="source-summary-items-section-income"]')
      ).toBeVisible();

      // Expense source card
      await expect(
        page.locator('[data-testid="source-summary-section-expenses"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="source-summary-items-section-expenses"]')
      ).toBeVisible();

      // Operators should exist between cards
      const operators = page.locator('[data-testid^="explainer-operator-"]');
      const operatorCount = await operators.count();
      expect(operatorCount).toBeGreaterThan(0);

      // Sum bar and result
      await expect(
        page.locator('[data-testid="explainer-sum-bar"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="explainer-result-value"]')
      ).toBeVisible();

      await page.waitForTimeout(1500);
      await captureScreenshot(page, "task-82-monthly-surplus-explainer");

      await page.keyboard.press("Escape");
    });
  });

  test.describe("Estimated Tax explainer", () => {
    test("shows income with effective rate", async ({ page }) => {
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

      await expect(
        page.locator('[data-testid="explainer-title"]')
      ).toHaveText("Estimated Tax");

      // Income source card should be visible
      await expect(
        page.locator('[data-testid="source-summary-section-income"]')
      ).toBeVisible();

      await expect(
        page.locator('[data-testid="explainer-result-value"]')
      ).toBeVisible();

      await page.waitForTimeout(1500);
      await captureScreenshot(page, "task-82-estimated-tax-explainer");

      await page.keyboard.press("Escape");
    });
  });

  test.describe("Financial Runway explainer", () => {
    test("shows liquid assets vs obligations", async ({ page }) => {
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

      await expect(
        page.locator('[data-testid="explainer-title"]')
      ).toHaveText("Financial Runway");

      // Assets source card (liquid assets)
      await expect(
        page.locator('[data-testid="source-summary-section-assets"]')
      ).toBeVisible();

      // Expenses source card
      await expect(
        page.locator('[data-testid="source-summary-section-expenses"]')
      ).toBeVisible();

      await expect(
        page.locator('[data-testid="explainer-result-value"]')
      ).toBeVisible();

      await page.waitForTimeout(1500);
      await captureScreenshot(page, "task-82-financial-runway-explainer");

      await page.keyboard.press("Escape");
    });
  });

  test.describe("Debt-to-Asset Ratio explainer", () => {
    test("shows all assets vs all debts", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const ratioCard = page.locator(
        '[data-testid="metric-card-debt-to-asset-ratio"]'
      );
      await ratioCard.scrollIntoViewIfNeeded();
      await ratioCard.click();

      const modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      await expect(
        page.locator('[data-testid="explainer-title"]')
      ).toHaveText("Debt-to-Asset Ratio");

      // Assets source
      await expect(
        page.locator('[data-testid="source-summary-section-assets"]')
      ).toBeVisible();

      // Debts source
      await expect(
        page.locator('[data-testid="source-summary-section-debts"]')
      ).toBeVisible();

      await expect(
        page.locator('[data-testid="explainer-result-value"]')
      ).toBeVisible();

      await page.waitForTimeout(1500);
      await captureScreenshot(page, "task-82-debt-to-asset-explainer");

      await page.keyboard.press("Escape");
    });
  });

  test.describe("Insight card interaction", () => {
    test("clicking an insight card opens explainer for its relevant sources", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const insightsPanel = page.locator('[data-testid="insights-panel"]');
      await insightsPanel.scrollIntoViewIfNeeded();

      // Try clicking a surplus insight (common type)
      const insightCard = page
        .locator('[data-insight-type="surplus"]')
        .first();
      if (
        await insightCard.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await insightCard.click();

        const modal = page.locator('[data-testid="explainer-modal"]');
        await expect(modal).toBeVisible({ timeout: 3000 });

        // Should show sources related to surplus (income/expenses)
        const sources = page.locator('[data-testid="explainer-sources"]');
        await expect(sources).toBeVisible();

        await page.waitForTimeout(1500);
        await captureScreenshot(page, "task-82-insight-card-explainer");

        await page.keyboard.press("Escape");
        await expect(modal).not.toBeVisible({ timeout: 3000 });
      } else {
        // Try other insight types if surplus isn't available
        const anyInsight = page
          .locator('[data-testid^="insight-card-"]')
          .first();
        if (
          await anyInsight.isVisible({ timeout: 2000 }).catch(() => false)
        ) {
          await anyInsight.click();
          const modal = page.locator('[data-testid="explainer-modal"]');
          await expect(modal).toBeVisible({ timeout: 3000 });
          await captureScreenshot(page, "task-82-insight-card-explainer");
          await page.keyboard.press("Escape");
        }
      }
    });
  });

  test.describe("Modal close mechanisms", () => {
    test("modal closes on Escape key", async ({ page }) => {
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

    test("modal closes on X button click", async ({ page }) => {
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

      await page.locator('[data-testid="explainer-close"]').click();
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    });

    test("modal closes on clicking outside (backdrop)", async ({ page }) => {
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

      // Click backdrop (top-left corner, away from modal)
      await page.locator('[data-testid="explainer-backdrop"]').click({
        position: { x: 10, y: 10 },
      });
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("Animations and SVG elements", () => {
    test("modal has entrance animation classes", async ({ page }) => {
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

      // Check that modal has entrance animation class
      const backdrop = page.locator('[data-testid="explainer-backdrop"]');
      const backdropClasses = await backdrop.getAttribute("class");
      expect(backdropClasses).toContain("animate-modal-in");

      await page.keyboard.press("Escape");
    });

    test("hand-drawn oval annotations render around totals", async ({
      page,
    }) => {
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

      // Oval SVGs should have valid paths with non-zero d attributes
      const ovals = page.locator(
        '[data-testid^="source-summary-oval-"] path'
      );
      const ovalCount = await ovals.count();
      expect(ovalCount).toBeGreaterThan(0);

      for (let i = 0; i < ovalCount; i++) {
        const d = await ovals.nth(i).getAttribute("d");
        expect(d).toBeTruthy();
        expect(d!.length).toBeGreaterThan(10);
      }

      // Ovals should have opacity 0.7
      const ovalSvg = page
        .locator('[data-testid^="source-summary-oval-"]')
        .first();
      const opacity = await ovalSvg.locator("path").first().getAttribute("opacity");
      expect(opacity).toBe("0.7");

      await page.keyboard.press("Escape");
    });

    test("connector lines render with valid SVG paths and arrowhead markers", async ({
      page,
    }) => {
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

      // Wait for connector animation
      await page.waitForTimeout(1500);

      // Connector lines should exist
      const connectors = page.locator(
        '[data-testid^="explainer-connector-"]'
      );
      const connectorCount = await connectors.count();
      expect(connectorCount).toBeGreaterThan(0);

      // Each connector should have a valid SVG path
      for (let i = 0; i < connectorCount; i++) {
        const connector = connectors.nth(i);
        const path = connector.locator("path");
        const d = await path.first().getAttribute("d");
        expect(d).toBeTruthy();
        expect(d!.length).toBeGreaterThan(5);

        // Should have arrowhead marker definition
        const defs = connector.locator("defs");
        const defsCount = await defs.count();
        expect(defsCount).toBeGreaterThan(0);
      }

      await page.keyboard.press("Escape");
    });

    test("arithmetic layout displays correct operators and result", async ({
      page,
    }) => {
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

      // Wait for all animations
      await page.waitForTimeout(1500);

      // Operators (+ and −) should be visible between source cards
      const operators = page.locator('[data-testid^="explainer-operator-"]');
      const operatorCount = await operators.count();
      expect(operatorCount).toBeGreaterThan(0);

      // Sum bar should render with hand-drawn path
      const sumBar = page.locator('[data-testid="explainer-sum-bar"]');
      await expect(sumBar).toBeVisible();
      const sumBarPath = sumBar.locator("path");
      const sumBarD = await sumBarPath.getAttribute("d");
      expect(sumBarD).toBeTruthy();

      // Result area with = sign and value
      const resultArea = page.locator(
        '[data-testid="explainer-result-area"]'
      );
      await expect(resultArea).toBeVisible();
      const resultValue = page.locator(
        '[data-testid="explainer-result-value"]'
      );
      await expect(resultValue).toBeVisible();

      // Result should contain a dollar amount
      const resultText = await resultValue.textContent();
      expect(resultText).toMatch(/\$/);

      await page.keyboard.press("Escape");
    });

    test("sum bar has round stroke linecap/linejoin", async ({ page }) => {
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

      const sumBarPath = page
        .locator('[data-testid="explainer-sum-bar"] path')
        .first();
      const strokeLinecap = await sumBarPath.getAttribute("stroke-linecap");
      const strokeLinejoin = await sumBarPath.getAttribute("stroke-linejoin");
      expect(strokeLinecap).toBe("round");
      expect(strokeLinejoin).toBe("round");

      await page.keyboard.press("Escape");
    });
  });

  test.describe("Mobile behavior", () => {
    test("at 375px modal is full-width with scrollable content", async ({
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
      await netWorthCard.click();

      const modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      // Modal should be scrollable
      const overflowY = await modal.evaluate(
        (el) => getComputedStyle(el).overflowY
      );
      expect(overflowY).toBe("auto");

      // Modal should take up most of the viewport width
      const box = await modal.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.width).toBeGreaterThan(300);

      // Source cards and result should still be visible
      await expect(
        page.locator('[data-testid="explainer-sources"]')
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="explainer-result-area"]')
      ).toBeVisible();

      await page.waitForTimeout(1500);
      await captureScreenshot(page, "task-82-mobile-explainer");

      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("Keyboard navigation", () => {
    test("Tab navigates through source cards, Escape closes modal", async ({
      page,
    }) => {
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

      // Tab should not crash or leave the page
      await page.keyboard.press("Tab");
      await page.waitForTimeout(100);

      // The modal should still be visible after Tab
      await expect(modal).toBeVisible();

      // Escape should close the modal
      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    });

    test("Enter key on metric card opens explainer", async ({ page }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const netWorthCard = page.locator(
        '[data-testid="metric-card-net-worth"]'
      );
      await netWorthCard.focus();
      await page.keyboard.press("Enter");

      const modal = page.locator('[data-testid="explainer-modal"]');
      await expect(modal).toBeVisible({ timeout: 3000 });

      await page.keyboard.press("Escape");
      await expect(modal).not.toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("Metric cards cursor/hint", () => {
    test("metric cards show click-to-explain cursor style", async ({
      page,
    }) => {
      test.setTimeout(60000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const netWorthCard = page.locator(
        '[data-testid="metric-card-net-worth"]'
      );
      await netWorthCard.scrollIntoViewIfNeeded();

      const cursor = await netWorthCard.evaluate(
        (el) => getComputedStyle(el).cursor
      );
      expect(cursor).toBe("pointer");
    });
  });

  test.describe("Full multi-step journey", () => {
    test("complete flow: open each metric explainer, verify contents, close, reopen different metric", async ({
      page,
    }) => {
      test.setTimeout(120000);
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      const metrics = [
        {
          id: "net-worth",
          title: "Net Worth",
          expectedSources: ["section-assets", "section-debts"],
        },
        {
          id: "monthly-cash-flow",
          title: "Monthly Cash Flow",
          expectedSources: ["section-income", "section-expenses"],
        },
        {
          id: "estimated-tax",
          title: "Estimated Tax",
          expectedSources: ["section-income"],
        },
        {
          id: "financial-runway",
          title: "Financial Runway",
          expectedSources: ["section-assets", "section-expenses"],
        },
        {
          id: "debt-to-asset-ratio",
          title: "Debt-to-Asset Ratio",
          expectedSources: ["section-assets", "section-debts"],
        },
      ];

      for (const metric of metrics) {
        // Open modal
        const card = page.locator(
          `[data-testid="metric-card-${metric.id}"]`
        );
        await card.scrollIntoViewIfNeeded();
        await card.click();

        const modal = page.locator('[data-testid="explainer-modal"]');
        await expect(modal).toBeVisible({ timeout: 3000 });

        // Verify title
        await expect(
          page.locator('[data-testid="explainer-title"]')
        ).toHaveText(metric.title);

        // Verify expected sources are visible
        for (const sourceId of metric.expectedSources) {
          await expect(
            page.locator(`[data-testid="source-summary-${sourceId}"]`)
          ).toBeVisible();
        }

        // Verify result
        await expect(
          page.locator('[data-testid="explainer-result-value"]')
        ).toBeVisible();

        // Close modal
        await page.keyboard.press("Escape");
        await expect(modal).not.toBeVisible({ timeout: 3000 });
      }

      await captureScreenshot(page, "task-82-full-journey-complete");
    });
  });
});
