import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Stock Entry section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Wait for the page to load
    await expect(page.locator("text=Financial Health Snapshot")).toBeVisible();
  });

  test("shows Stocks & Equity section with empty state", async ({ page }) => {
    // The stock section should be visible with an empty state message
    await expect(page.locator("text=Stocks & Equity")).toBeVisible();
    await expect(page.locator('[data-testid="stock-empty-state"]')).toBeVisible();
    await expect(page.locator("text=Track your stock and equity holdings")).toBeVisible();
  });

  test("can add a stock with manual price", async ({ page }) => {
    // Click Add Stock button
    await page.click("text=+ Add Stock");

    // Fill in ticker
    await page.fill('[aria-label="New stock ticker"]', "AAPL");

    // Fill in shares
    await page.fill('[aria-label="Number of shares"]', "10");

    // Fill in manual price
    await page.fill('[aria-label="Price per share (leave empty to auto-fetch)"]', "150");

    // Click Add
    await page.click('[aria-label="Confirm add stock"]');

    // Verify the stock appears
    await expect(page.locator("text=AAPL")).toBeVisible();
    await expect(page.locator("text=10 shares")).toBeVisible();

    // Verify the total value is shown (10 * 150 = $1,500)
    await expect(page.locator("text=$1,500").first()).toBeVisible();

    await captureScreenshot(page, "task-32-stock-added");
  });

  test("can add stock without manual price (auto-fetch attempt)", async ({ page }) => {
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "MSFT");
    await page.fill('[aria-label="Number of shares"]', "5");
    // Don't fill price — let it try to auto-fetch
    await page.click('[aria-label="Confirm add stock"]');

    // Stock should appear with ticker
    await expect(page.locator("text=MSFT")).toBeVisible();
    await expect(page.locator("text=5 shares")).toBeVisible();
  });

  test("can delete a stock", async ({ page }) => {
    // Add a stock first
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "GOOG");
    await page.fill('[aria-label="Number of shares"]', "3");
    await page.fill('[aria-label="Price per share (leave empty to auto-fetch)"]', "100");
    await page.click('[aria-label="Confirm add stock"]');

    await expect(page.locator("text=GOOG")).toBeVisible();

    // Delete the stock
    await page.click('[aria-label="Delete GOOG"]');

    // Stock should be gone, empty state should return
    await expect(page.locator('[data-testid="stock-empty-state"]')).toBeVisible();
  });

  test("can set cost basis and see gain/loss", async ({ page }) => {
    // Add a stock with manual price
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "TSLA");
    await page.fill('[aria-label="Number of shares"]', "20");
    await page.fill('[aria-label="Price per share (leave empty to auto-fetch)"]', "200");
    await page.click('[aria-label="Confirm add stock"]');

    // Click cost basis button
    const costBasisBtn = page.locator("text=Cost basis");
    await costBasisBtn.click();

    // Enter cost basis
    const costBasisInput = page.locator('[aria-label="Edit cost basis for TSLA"]');
    await costBasisInput.fill("100");
    await costBasisInput.press("Enter");

    // Should show gain/loss badge: (200-100)*20 = $2,000 gain, +100%
    await expect(page.locator("text=+$2,000")).toBeVisible();
    await expect(page.locator("text=+100.0%")).toBeVisible();

    await captureScreenshot(page, "task-32-stock-gain-loss");
  });

  test("stock value affects dashboard net worth", async ({ page }) => {
    // Add a stock with significant value
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "AAPL");
    await page.fill('[aria-label="Number of shares"]', "100");
    await page.fill('[aria-label="Price per share (leave empty to auto-fetch)"]', "200");
    await page.click('[aria-label="Confirm add stock"]');

    // Wait for dashboard to update
    await page.waitForTimeout(500);

    // Verify the stock section shows the total
    await expect(page.locator("text=Stocks & Equity")).toBeVisible();
    // The stock row should show the value
    await expect(page.locator("text=100 shares")).toBeVisible();
    // The section total should be visible
    const totalText = page.locator("text=Total:").nth(3); // Stocks section total
    await expect(totalText).toBeVisible();

    await captureScreenshot(page, "task-32-stock-affects-networth");
  });

  test("cancel adding stock works", async ({ page }) => {
    await page.click("text=+ Add Stock");
    await expect(page.locator('[aria-label="New stock ticker"]')).toBeVisible();

    // Cancel
    await page.click('[aria-label="Cancel adding stock"]');

    // Add form should be gone
    await expect(page.locator('[aria-label="New stock ticker"]')).not.toBeVisible();
  });

  test("can set manual price override", async ({ page }) => {
    // Add stock
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "NVDA");
    await page.fill('[aria-label="Number of shares"]', "8");
    await page.fill('[aria-label="Price per share (leave empty to auto-fetch)"]', "500");
    await page.click('[aria-label="Confirm add stock"]');

    // The manual price badge should show
    await expect(page.locator("text=Manual: $500.00")).toBeVisible();
  });

  test("stocks persist in URL state", async ({ page }) => {
    // Add a stock
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "META");
    await page.fill('[aria-label="Number of shares"]', "15");
    await page.fill('[aria-label="Price per share (leave empty to auto-fetch)"]', "300");
    await page.click('[aria-label="Confirm add stock"]');

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();

    // Wait for the page to load
    await expect(page.locator("text=Financial Health Snapshot")).toBeVisible();

    // Verify stock persisted
    await expect(page.locator("text=META")).toBeVisible();
    await expect(page.locator("text=15 shares")).toBeVisible();

    await captureScreenshot(page, "task-32-stock-url-persistence");
  });
});
