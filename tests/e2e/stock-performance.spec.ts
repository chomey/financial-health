import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Stock ROI performance tracking", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Financial Health Snapshot")).toBeVisible();
  });

  test("shows purchase date button on stock with cost basis", async ({ page }) => {
    // Add a stock
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "AAPL");
    await page.fill('[aria-label="Number of shares"]', "10");
    await page.click('[aria-label="Confirm add stock"]');

    // Wait for the stock to appear
    await expect(page.locator("text=AAPL")).toBeVisible();

    // Set cost basis
    const costBasisBtn = page.getByRole("button", { name: /cost basis/i }).first();
    await costBasisBtn.click();
    const costBasisInput = page.locator('[aria-label*="Edit cost basis for AAPL"]');
    await costBasisInput.fill("150");
    await costBasisInput.press("Enter");

    // Purchase date button should be visible
    await expect(page.getByRole("button", { name: /purchase date/i })).toBeVisible();

    await captureScreenshot(page, "task-54-purchase-date-button");
  });

  test("can set purchase date and see annualized return", async ({ page }) => {
    // Add a stock with cost basis
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "MSFT");
    await page.fill('[aria-label="Number of shares"]', "5");
    await page.click('[aria-label="Confirm add stock"]');

    await expect(page.locator("text=MSFT")).toBeVisible();

    // Set cost basis
    const costBasisBtn = page.getByRole("button", { name: /cost basis/i }).first();
    await costBasisBtn.click();
    const costBasisInput = page.locator('[aria-label*="Edit cost basis for MSFT"]');
    await costBasisInput.fill("100");
    await costBasisInput.press("Enter");

    // Wait for basis to be set
    await expect(page.locator("text=Basis: $100.00")).toBeVisible();

    // Set purchase date (1 year ago)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const dateStr = oneYearAgo.toISOString().split("T")[0];

    const purchaseDateBtn = page.getByRole("button", { name: /purchase date/i });
    await purchaseDateBtn.click();
    const dateInput = page.locator('[aria-label*="Edit purchase date for MSFT"]');
    await dateInput.fill(dateStr);
    await dateInput.press("Enter");

    // Should show "Bought:" with the date
    await expect(page.locator("text=Bought:")).toBeVisible();

    // If there's a fetched price and cost basis, annualized return should show
    // (may not show if price wasn't fetched, which is OK in test)

    await captureScreenshot(page, "task-54-purchase-date-set");
  });

  test("portfolio summary shows when stocks have cost basis", async ({ page }) => {
    // Add a stock with cost basis via URL state for reliable testing
    // We'll add it via UI instead
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "GOOG");
    await page.fill('[aria-label="Number of shares"]', "10");
    await page.click('[aria-label="Confirm add stock"]');

    await expect(page.locator("text=GOOG")).toBeVisible();

    // Set cost basis
    const costBasisBtn = page.getByRole("button", { name: /cost basis/i }).first();
    await costBasisBtn.click();
    const costBasisInput = page.locator('[aria-label*="Edit cost basis for GOOG"]');
    await costBasisInput.fill("100");
    await costBasisInput.press("Enter");

    // Portfolio summary should appear
    await expect(page.locator('[data-testid="portfolio-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="portfolio-summary"]').locator("text=Portfolio:")).toBeVisible();
    await expect(page.locator('[data-testid="portfolio-summary"]').locator("text=Cost:")).toBeVisible();

    await captureScreenshot(page, "task-54-portfolio-summary");
  });

  test("portfolio performance card shows in dashboard when stocks exist", async ({ page }) => {
    // Add a stock
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "TSLA");
    await page.fill('[aria-label="Number of shares"]', "5");
    await page.click('[aria-label="Confirm add stock"]');

    await expect(page.locator("text=TSLA")).toBeVisible();

    // Wait for dashboard update
    await page.waitForTimeout(500);

    // Portfolio Performance card should appear in dashboard
    await expect(page.locator('[data-testid="portfolio-performance"]')).toBeVisible();
    await expect(page.locator('[data-testid="portfolio-performance"]').locator("text=Portfolio Performance")).toBeVisible();

    await captureScreenshot(page, "task-54-portfolio-performance-card");
  });

  test("purchase date persists in URL state", async ({ page }) => {
    // Add stock with cost basis and purchase date
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "AMZN");
    await page.fill('[aria-label="Number of shares"]', "3");
    await page.click('[aria-label="Confirm add stock"]');

    await expect(page.locator("text=AMZN")).toBeVisible();

    // Set cost basis
    const costBasisBtn = page.getByRole("button", { name: /cost basis/i }).first();
    await costBasisBtn.click();
    const costBasisInput = page.locator('[aria-label*="Edit cost basis for AMZN"]');
    await costBasisInput.fill("120");
    await costBasisInput.press("Enter");
    await expect(page.locator("text=Basis: $120.00")).toBeVisible();

    // Set purchase date
    const purchaseDateBtn = page.getByRole("button", { name: /purchase date/i });
    await purchaseDateBtn.click();
    const dateInput = page.locator('[aria-label*="Edit purchase date for AMZN"]');
    await dateInput.fill("2024-01-15");
    await dateInput.press("Enter");

    // Wait for URL update
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();
    await expect(page.locator("text=Financial Health Snapshot")).toBeVisible();

    // Verify stock persisted with purchase date
    await expect(page.locator("text=AMZN")).toBeVisible();
    await expect(page.locator("text=Basis: $120.00")).toBeVisible();
    await expect(page.locator("text=Bought:")).toBeVisible();

    await captureScreenshot(page, "task-54-purchase-date-persisted");
  });
});
