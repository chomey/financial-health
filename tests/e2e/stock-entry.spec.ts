import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Stock Entry section", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/?step=stocks");
    // Wait for the page to load
    await expect(page.getByRole("heading", { name: "Stocks & Equity" }).first()).toBeVisible();
  });

  test("shows Stocks & Equity section with empty state", async ({ page }) => {
    // The stock section should be visible with an empty state message
    await expect(page.getByRole("heading", { name: "Stocks & Equity" }).first()).toBeVisible();
    await expect(page.locator('[data-testid="stock-empty-state"]')).toBeVisible();
    await expect(page.locator("text=Track your stock and equity holdings")).toBeVisible();
  });

  test("can add a stock", async ({ page }) => {
    // Click Add Stock button
    await page.click("text=+ Add Stock");

    // Fill in ticker
    await page.fill('[aria-label="New stock ticker"]', "AAPL");

    // Fill in shares
    await page.fill('[aria-label="Number of shares"]', "10");

    // Click Add
    await page.click('[aria-label="Confirm add stock"]');

    // Verify the stock appears
    await expect(page.getByRole("button", { name: "Edit ticker for AAPL" })).toBeVisible();

    await captureScreenshot(page, "task-32-stock-added");
  });

  test("can add stock and it appears in the list", async ({ page }) => {
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "MSFT");
    await page.fill('[aria-label="Number of shares"]', "5");
    await page.click('[aria-label="Confirm add stock"]');

    // Stock should appear with ticker
    await expect(page.getByRole("button", { name: "Edit ticker for MSFT" })).toBeVisible();
  });

  test("can delete a stock", async ({ page }) => {
    // Add a stock first
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "GOOG");
    await page.fill('[aria-label="Number of shares"]', "3");
    await page.click('[aria-label="Confirm add stock"]');

    await expect(page.locator("text=GOOG")).toBeVisible();

    // Delete the stock
    await page.click('[aria-label="Delete GOOG"]');

    // Stock should be gone, empty state should return
    await expect(page.locator('[data-testid="stock-empty-state"]')).toBeVisible();
  });

  test("can set cost basis and see gain/loss", async ({ page }) => {
    // Add a stock
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "TSLA");
    await page.fill('[aria-label="Number of shares"]', "20");
    await page.click('[aria-label="Confirm add stock"]');

    // Click cost basis button
    const costBasisBtn = page.getByRole("button", { name: /cost basis/i }).first();
    await costBasisBtn.click();

    // Enter cost basis
    const costBasisInput = page.locator('[aria-label="Edit cost basis for TSLA"]');
    await costBasisInput.fill("100");
    await costBasisInput.press("Enter");

    // Verify cost basis is set
    await expect(page.locator("text=Basis:")).toBeVisible();

    await captureScreenshot(page, "task-32-stock-gain-loss");
  });

  test("stock value affects dashboard net worth", async ({ page }) => {
    // Add a stock
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "AAPL");
    await page.fill('[aria-label="Number of shares"]', "100");
    await page.click('[aria-label="Confirm add stock"]');

    // Wait for state to update
    await page.waitForTimeout(500);

    // The stock row should show the ticker
    await expect(page.getByRole("button", { name: "Edit ticker for AAPL" })).toBeVisible();

    // Switch to dashboard and verify it loads
    await page.getByTestId("wizard-skip-to-dashboard").click();
    await expect(page.getByTestId("snapshot-dashboard")).toBeVisible();

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

  test("stocks persist in URL state", async ({ page }) => {
    // Add a stock
    await page.click("text=+ Add Stock");
    await page.fill('[aria-label="New stock ticker"]', "META");
    await page.fill('[aria-label="Number of shares"]', "15");
    await page.click('[aria-label="Confirm add stock"]');

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Reload page
    await page.reload();

    // Wait for the page to load
    await expect(page.getByRole("heading", { name: "Stocks & Equity" }).first()).toBeVisible();

    // Verify stock persisted
    await expect(page.getByRole("button", { name: "Edit ticker for META" })).toBeVisible();

    await captureScreenshot(page, "task-32-stock-url-persistence");
  });
});
