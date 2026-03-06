import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Data flow source registration", () => {
  test("all 6 section-level sources are registered via data-dataflow-source attributes", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-dataflow-source]');

    const sectionIds = [
      "section-assets",
      "section-debts",
      "section-income",
      "section-expenses",
      "section-property",
      "section-stocks",
    ];

    for (const id of sectionIds) {
      const el = page.locator(`[data-dataflow-source="${id}"]`);
      await expect(el).toBeAttached();
    }
  });

  test("sub-source items are registered for default data entries", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-dataflow-source]');

    // Default state has assets — check sub-sources exist with asset: prefix
    const assetSources = page.locator('[data-dataflow-source^="asset:"]');
    const assetCount = await assetSources.count();
    expect(assetCount).toBeGreaterThan(0);

    // Default state has debts
    const debtSources = page.locator('[data-dataflow-source^="debt:"]');
    const debtCount = await debtSources.count();
    expect(debtCount).toBeGreaterThan(0);

    // Default state has income
    const incomeSources = page.locator('[data-dataflow-source^="income:"]');
    const incomeCount = await incomeSources.count();
    expect(incomeCount).toBeGreaterThan(0);

    // Default state has expenses
    const expenseSources = page.locator('[data-dataflow-source^="expense:"]');
    const expenseCount = await expenseSources.count();
    expect(expenseCount).toBeGreaterThan(0);
  });

  test("collapsed section keeps data-dataflow-source attribute on header", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-dataflow-source="section-assets"]');

    // Collapse the assets section
    const collapseBtn = page.locator('#assets button[aria-label="Collapse Assets"]');
    await collapseBtn.click();

    // The collapsed header should still have the data-dataflow-source attribute
    const source = page.locator('[data-dataflow-source="section-assets"]');
    await expect(source).toBeAttached();

    // Verify it's the collapsed button (aria-expanded=false)
    await expect(source).toHaveAttribute("aria-expanded", "false");

    await captureScreenshot(page, "task-70-collapsed-section-source");
  });

  test("section source re-registers when expanded again", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-dataflow-source="section-debts"]');

    // Collapse debts section
    const collapseBtn = page.locator('#debts button[aria-label="Collapse Debts"]');
    await collapseBtn.click();

    // Verify collapsed source
    const collapsedSource = page.locator('[data-dataflow-source="section-debts"]');
    await expect(collapsedSource).toHaveAttribute("aria-expanded", "false");

    // Expand it again
    await collapsedSource.click();

    // Source should be re-registered on expanded div
    const expandedSource = page.locator('[data-dataflow-source="section-debts"]');
    await expect(expandedSource).toBeAttached();
    // Expanded sections use a div, not a button with aria-expanded
    await expect(expandedSource).not.toHaveAttribute("aria-expanded", "false");
  });

  test("SVG overlay still present and dormant without active targets", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-dataflow-source]');

    // Overlay should NOT be visible since no target is active
    const overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).not.toBeAttached();

    await captureScreenshot(page, "task-70-sources-registered-no-arrows");
  });
});
