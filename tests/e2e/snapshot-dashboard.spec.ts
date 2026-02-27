import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Snapshot Dashboard", () => {
  test("renders all four metric cards with values", async ({ page }) => {
    await page.goto("/");

    // Wait for count-up animation to complete
    await page.waitForTimeout(1500);

    // Verify all four metric cards are visible
    await expect(page.getByText("Net Worth")).toBeVisible();
    await expect(page.getByText("Monthly Surplus")).toBeVisible();
    await expect(page.getByText("Financial Runway")).toBeVisible();
    await expect(page.getByText("Debt-to-Asset Ratio")).toBeVisible();

    // Verify animated values are displayed (after count-up completes)
    await expect(page.getByText("-$229,500")).toBeVisible();
    await expect(page.getByText("$3,350")).toBeVisible();
    await expect(page.getByText("22.2 mo")).toBeVisible();
    await expect(page.getByText("4.50")).toBeVisible();

    await captureScreenshot(page, "task-8-dashboard-metrics");
  });

  test("renders icons for each metric", async ({ page }) => {
    await page.goto("/");

    const dashboard = page.getByTestId("snapshot-dashboard");
    await expect(dashboard.getByText("💰")).toBeVisible();
    await expect(dashboard.getByText("📈")).toBeVisible();
    await expect(dashboard.getByText("🛡️")).toBeVisible();
    await expect(dashboard.getByText("⚖️")).toBeVisible();
  });

  test("shows tooltip on hover explaining metric", async ({ page }) => {
    await page.goto("/");

    // Hover over Net Worth card
    const netWorthCard = page.locator('[aria-label="Net Worth"]').first();
    await netWorthCard.hover();

    await expect(
      page.getByText(/Your total assets minus total debts/)
    ).toBeVisible();

    await captureScreenshot(page, "task-8-dashboard-tooltip");
  });

  test("shows tooltip for Monthly Surplus on hover", async ({ page }) => {
    await page.goto("/");

    const card = page.locator('[aria-label="Monthly Surplus"]').first();
    await card.hover();

    await expect(
      page.getByText(/How much more you earn than you spend/)
    ).toBeVisible();
  });

  test("hides tooltip when mouse leaves", async ({ page }) => {
    await page.goto("/");

    const card = page.locator('[aria-label="Net Worth"]').first();
    await card.hover();
    await expect(page.getByRole("tooltip")).toBeVisible();

    // Move mouse away
    await page.mouse.move(0, 0);
    await expect(page.getByRole("tooltip")).not.toBeVisible();
  });

  test("metric cards have hover lift effect", async ({ page }) => {
    await page.goto("/");

    // Wait for count-up
    await page.waitForTimeout(1500);

    const card = page.locator('[aria-label="Monthly Surplus"]').first();
    await card.hover();

    await captureScreenshot(page, "task-8-dashboard-card-hover");
  });

  test("uses encouraging color coding", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);

    // Monthly Surplus value should be green (positive metric)
    const surplusValue = page.getByLabel("Monthly Surplus: $3,350");
    await expect(surplusValue).toHaveClass(/text-green-600/);

    // Net Worth value should be rose (negative value)
    const netWorthValue = page.getByLabel("Net Worth: -$229,500");
    await expect(netWorthValue).toHaveClass(/text-rose-600/);

    await captureScreenshot(page, "task-8-dashboard-colors");
  });
});
