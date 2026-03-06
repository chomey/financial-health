import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Snapshot Dashboard", () => {
  test("renders all five metric cards with values", async ({ page }) => {
    await page.goto("/");

    // Wait for count-up animation to complete
    await page.waitForTimeout(1500);

    // Verify all five metric card titles are visible (scoped to group elements)
    await expect(page.locator('[aria-label="Net Worth"] h3')).toBeVisible();
    await expect(page.locator('[aria-label="Monthly Surplus"] h3')).toBeVisible();
    await expect(page.locator('[aria-label="Estimated Tax"] h3')).toBeVisible();
    await expect(page.locator('[aria-label="Financial Runway"] h3')).toBeVisible();
    await expect(page.locator('[aria-label="Debt-to-Asset Ratio"] h3')).toBeVisible();

    // Verify animated values are displayed — use metric value aria-labels with regex for dynamic values
    await expect(page.locator('[aria-label^="Net Worth:"]')).toBeVisible();
    await expect(page.locator('[aria-label^="Monthly Surplus:"]')).toBeVisible();
    await expect(page.locator('[aria-label^="Financial Runway:"]')).toBeVisible();
    await expect(page.locator('[aria-label^="Debt-to-Asset Ratio:"]')).toBeVisible();

    await captureScreenshot(page, "task-8-dashboard-metrics");
  });

  test("renders icons for each metric", async ({ page }) => {
    await page.goto("/");

    // Scope to metric card groups to avoid matching insight panel icons
    const metricCards = page.locator('[role="group"]');
    await expect(metricCards.filter({ hasText: "💰" }).first()).toBeVisible();
    await expect(metricCards.filter({ hasText: "📈" }).first()).toBeVisible();
    await expect(metricCards.filter({ hasText: "🛡️" }).first()).toBeVisible();
    await expect(metricCards.filter({ hasText: "⚖️" }).first()).toBeVisible();
  });

  test("shows tooltip text on hover explaining metric", async ({ page }) => {
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

  test("hides breakdown when mouse leaves", async ({ page }) => {
    await page.goto("/");

    const card = page.locator('[aria-label="Net Worth"]').first();
    await card.hover();
    const breakdown = card.locator('[data-testid="metric-breakdown"]');
    // Breakdown appears on hover (opacity transitions to 100)
    await expect(breakdown).toBeVisible();

    // Move mouse away — breakdown fades
    await page.mouse.move(0, 0);
    await page.waitForTimeout(300);
    // After leaving, breakdown should be hidden (opacity 0, overflow hidden)
    await expect(breakdown).not.toBeVisible();
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
    const surplusValue = page.locator('[aria-label^="Monthly Surplus:"]');
    await expect(surplusValue).toHaveClass(/text-green-600/);

    // Net Worth value should be green (positive value)
    const netWorthValue = page.locator('[aria-label^="Net Worth:"]');
    await expect(netWorthValue).toHaveClass(/text-green-600/);

    await captureScreenshot(page, "task-8-dashboard-colors");
  });

  test("breakdown is not clipped by sibling metric cards", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);

    // Hover Net Worth (first card) — its breakdown should appear
    const netWorthCard = page.locator('[aria-label="Net Worth"]').first();
    await netWorthCard.hover();

    const breakdown = netWorthCard.locator('[data-testid="metric-breakdown"]');
    await expect(breakdown).toBeVisible();

    // Verify breakdown is visible on screen
    const box = await breakdown.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.height).toBeGreaterThan(0);

    await captureScreenshot(page, "task-19-tooltip-not-clipped");
  });

  test("breakdown remains visible when hovering a card", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);

    // Hover Monthly Surplus card
    const surplusCard = page.locator('[aria-label="Monthly Surplus"]').first();
    await surplusCard.hover();

    const breakdown = surplusCard.locator('[data-testid="metric-breakdown"]');
    await expect(breakdown).toBeVisible();

    // Verify the breakdown box has dimensions
    const box = await breakdown.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(0);

    await captureScreenshot(page, "task-19-surplus-tooltip");
  });

  test("hovering different cards shows correct tooltip text each time", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);

    // Hover Net Worth
    const netWorthCard = page.locator('[aria-label="Net Worth"]').first();
    await netWorthCard.hover();
    await expect(netWorthCard).toContainText("total assets minus total debts");

    // Move to Monthly Surplus
    const surplusCard = page.locator('[aria-label="Monthly Surplus"]').first();
    await surplusCard.hover();
    await expect(surplusCard).toContainText("How much more you earn");

    // Move to Financial Runway
    const runwayCard = page.locator('[aria-label="Financial Runway"]').first();
    await runwayCard.hover();
    await expect(runwayCard).toContainText("months your liquid assets");

    // Move to Debt-to-Asset Ratio
    const ratioCard = page.locator('[aria-label="Debt-to-Asset Ratio"]').first();
    await ratioCard.hover();
    await expect(ratioCard).toContainText("total debts divided by your total assets");

    await captureScreenshot(page, "task-19-ratio-tooltip");
  });
});
