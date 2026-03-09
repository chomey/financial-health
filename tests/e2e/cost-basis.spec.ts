import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Cost basis percent on taxable assets", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?step=assets");
    await page.waitForSelector('[aria-label="Asset items"]');
  });

  test("shows cost basis badge for taxable assets (Brokerage)", async ({ page }) => {
    // Add a Brokerage asset
    await page.click('text="+ Add Asset"');
    await page.fill('[aria-label="New asset category"]', "Brokerage");
    await page.fill('[aria-label="New asset amount"]', "50000");
    await page.click('[aria-label="Confirm add asset"]');

    // Cost basis badge should be visible for the new Brokerage asset
    const costBasisBadge = page.locator('[data-testid^="cost-basis-badge-"]').last();
    await expect(costBasisBadge).toBeVisible();
    await expect(costBasisBadge).toContainText("Cost basis %");
  });

  test("does not show cost basis badge for tax-free assets (TFSA)", async ({ page }) => {
    // The default state includes a TFSA
    const tfsaRow = page.locator('[aria-label="Asset items"]').locator('text="TFSA"');
    await expect(tfsaRow).toBeVisible();

    // TFSA is tax-free — no cost basis badge in its row
    // Find the details section for TFSA
    const assetItems = page.locator('[role="listitem"]');
    const tfsaItem = assetItems.filter({ hasText: "TFSA" });
    const costBasisBadge = tfsaItem.locator('[data-testid^="cost-basis-badge-"]');
    await expect(costBasisBadge).toHaveCount(0);
  });

  test("can set cost basis percent and see unrealized gains badge", async ({ page }) => {
    // Add a Brokerage asset
    await page.click('text="+ Add Asset"');
    await page.fill('[aria-label="New asset category"]', "Brokerage");
    await page.fill('[aria-label="New asset amount"]', "100000");
    await page.click('[aria-label="Confirm add asset"]');

    // Wait for the asset to be added and cost basis badge to appear
    const costBasisBadge = page.locator('[data-testid^="cost-basis-badge-"]').last();
    await expect(costBasisBadge).toBeVisible();
    await costBasisBadge.click();

    // Wait for input to appear and fill
    const input = page.locator('input[aria-label^="Edit cost basis percent for Brokerage"]');
    await expect(input).toBeVisible();
    await input.fill("60");
    await input.press("Enter");

    // Wait for the badge to update after commit
    await expect(costBasisBadge).toContainText("60% cost basis");

    // Unrealized gains badge should appear
    const gainsBadge = page.locator('[data-testid^="unrealized-gains-"]').last();
    await expect(gainsBadge).toBeVisible();
    await expect(gainsBadge).toContainText("$40,000 unrealized gains");

    await captureScreenshot(page, "task-67-cost-basis-set");
  });

  test("cost basis percent persists through URL reload", async ({ page }) => {
    // Add a Brokerage asset and set cost basis
    await page.click('text="+ Add Asset"');
    await page.fill('[aria-label="New asset category"]', "Brokerage");
    await page.fill('[aria-label="New asset amount"]', "80000");
    await page.click('[aria-label="Confirm add asset"]');

    const costBasisBadge = page.locator('[data-testid^="cost-basis-badge-"]').last();
    await expect(costBasisBadge).toBeVisible();
    await costBasisBadge.click();

    const input = page.locator('input[aria-label^="Edit cost basis percent for Brokerage"]');
    await expect(input).toBeVisible();
    await input.fill("75");
    await input.press("Enter");

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Get the URL and reload
    const url = page.url();
    await page.goto(url);
    await page.waitForSelector('[aria-label="Asset items"]');

    // Should still show cost basis badge
    const reloadedBadge = page.locator('[data-testid^="cost-basis-badge-"]').last();
    await expect(reloadedBadge).toContainText("75% cost basis");

    // Unrealized gains should show
    const gainsBadge = page.locator('[data-testid^="unrealized-gains-"]').last();
    await expect(gainsBadge).toContainText("$20,000 unrealized gains");

    await captureScreenshot(page, "task-67-cost-basis-persisted");
  });
});
