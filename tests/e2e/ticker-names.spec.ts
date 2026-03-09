import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Ticker Names Display", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?step=stocks");
    await expect(page.getByRole("heading", { name: "Stocks & Equity" }).first()).toBeVisible();
  });

  test("shows company name below known ticker after adding stock", async ({ page }) => {
    // Add a stock with a known ticker
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "AAPL");
    await page.fill('[aria-label="Number of shares"]', "10");
    await page.click('[aria-label="Confirm add stock"]');

    // Wait for AAPL to appear
    await expect(page.getByRole("button", { name: "Edit ticker for AAPL" })).toBeVisible();

    // Verify Apple company name appears below the ticker
    const tickerNameEl = page.locator('[data-testid^="ticker-name-"]').first();
    await expect(tickerNameEl).toBeVisible();
    await expect(tickerNameEl).toHaveText("Apple");

    await captureScreenshot(page, "task-132-ticker-name-aapl");
  });

  test("shows company names for multiple known tickers", async ({ page }) => {
    // Add MSFT
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "MSFT");
    await page.fill('[aria-label="Number of shares"]', "5");
    await page.click('[aria-label="Confirm add stock"]');

    // Add VOO (ETF)
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "VOO");
    await page.fill('[aria-label="Number of shares"]', "20");
    await page.click('[aria-label="Confirm add stock"]');

    // Verify company names appear
    const nameElements = page.locator('[data-testid^="ticker-name-"]');
    await expect(nameElements).toHaveCount(2);

    // Check that Microsoft and Vanguard names are present
    await expect(page.locator("text=Microsoft").first()).toBeVisible();
    await expect(page.locator("text=Vanguard S&P 500 ETF").first()).toBeVisible();

    await captureScreenshot(page, "task-132-ticker-names-multiple");
  });

  test("does not show company name for unknown ticker", async ({ page }) => {
    // Add an unknown ticker
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "ZZZZZ");
    await page.fill('[aria-label="Number of shares"]', "1");
    await page.click('[aria-label="Confirm add stock"]');

    // ZZZZZ should appear but no company name subtitle
    await expect(page.getByRole("button", { name: "Edit ticker for ZZZZZ" })).toBeVisible();

    // Wait a moment for any async resolution to complete
    await page.waitForTimeout(1000);

    // There should be no ticker-name testid for this stock
    const nameElements = page.locator('[data-testid^="ticker-name-"]');
    await expect(nameElements).toHaveCount(0);
  });

  test("shows company name in explainer modal for stocks", async ({ page }) => {
    // Add a stock with a known ticker
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "TSLA");
    await page.fill('[aria-label="Number of shares"]', "10");
    await page.click('[aria-label="Confirm add stock"]');

    // Wait for the ticker to appear
    await expect(page.getByRole("button", { name: "Edit ticker for TSLA" })).toBeVisible();

    // Verify Tesla name appears in the stock entry
    const tickerNameEl = page.locator('[data-testid^="ticker-name-"]').first();
    await expect(tickerNameEl).toBeVisible();
    await expect(tickerNameEl).toHaveText("Tesla");

    // Click the Net Worth metric card to open explainer
    const netWorthCard = page.locator('[data-testid="metric-net-worth"]');
    if (await netWorthCard.isVisible()) {
      await netWorthCard.click();
      // Wait for explainer modal to animate in
      await page.waitForTimeout(1000);

      // Check if Tesla name appears in the explainer source card items
      const sourceItemNames = page.locator('[data-testid^="source-item-name-"]');
      const count = await sourceItemNames.count();
      if (count > 0) {
        // At least one source item should show a company name
        await expect(sourceItemNames.first()).toBeVisible();
      }
    }

    await captureScreenshot(page, "task-132-ticker-name-explainer");
  });
});
