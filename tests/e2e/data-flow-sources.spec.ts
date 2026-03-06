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

    const assetSources = page.locator('[data-dataflow-source^="asset:"]');
    const assetCount = await assetSources.count();
    expect(assetCount).toBeGreaterThan(0);

    const debtSources = page.locator('[data-dataflow-source^="debt:"]');
    const debtCount = await debtSources.count();
    expect(debtCount).toBeGreaterThan(0);

    const incomeSources = page.locator('[data-dataflow-source^="income:"]');
    const incomeCount = await incomeSources.count();
    expect(incomeCount).toBeGreaterThan(0);

    const expenseSources = page.locator('[data-dataflow-source^="expense:"]');
    const expenseCount = await expenseSources.count();
    expect(expenseCount).toBeGreaterThan(0);
  });

  test("collapsed section keeps data-dataflow-source attribute on header", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-dataflow-source="section-assets"]');

    const collapseBtn = page.locator('#assets button[aria-label="Collapse Assets"]');
    await collapseBtn.click();

    const source = page.locator('[data-dataflow-source="section-assets"]');
    await expect(source).toBeAttached();
    await expect(source).toHaveAttribute("aria-expanded", "false");

    await captureScreenshot(page, "task-70-collapsed-section-source");
  });

  test("section source re-registers when expanded again", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-dataflow-source="section-debts"]');

    const collapseBtn = page.locator('#debts button[aria-label="Collapse Debts"]');
    await collapseBtn.click();

    const collapsedSource = page.locator('[data-dataflow-source="section-debts"]');
    await expect(collapsedSource).toHaveAttribute("aria-expanded", "false");

    await collapsedSource.click();

    const expandedSource = page.locator('[data-dataflow-source="section-debts"]');
    await expect(expandedSource).toBeAttached();
    await expect(expandedSource).not.toHaveAttribute("aria-expanded", "false");
  });

  test("no spotlight overlay (replaced by explainer modal)", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-dataflow-source]');

    await expect(page.locator('[data-testid="spotlight-overlay"]')).toHaveCount(0);
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible();

    await captureScreenshot(page, "task-70-sources-registered-no-modal");
  });
});
