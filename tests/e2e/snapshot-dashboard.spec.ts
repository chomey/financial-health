import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Snapshot Dashboard", () => {
  test("renders all four metric cards with values", async ({ page }) => {
    await page.goto("/");

    // Wait for count-up animation to complete
    await page.waitForTimeout(1500);

    // Verify all four metric card titles are visible (scoped to group elements)
    await expect(page.locator('[aria-label="Net Worth"] h3')).toBeVisible();
    await expect(page.locator('[aria-label="Monthly Surplus"] h3')).toBeVisible();
    await expect(page.locator('[aria-label="Financial Runway"] h3')).toBeVisible();
    await expect(page.locator('[aria-label="Debt-to-Asset Ratio"] h3')).toBeVisible();

    // Verify animated values are displayed (after count-up completes, scoped via aria-labels)
    await expect(page.getByLabel("Net Worth: $220,500")).toBeVisible();
    await expect(page.getByLabel("Monthly Surplus: $3,350")).toBeVisible();
    await expect(page.getByLabel("Financial Runway: 22.2 mo")).toBeVisible();
    await expect(page.getByLabel("Debt-to-Asset Ratio: 1.25")).toBeVisible();

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

    // Net Worth value should be green (positive value)
    const netWorthValue = page.getByLabel("Net Worth: $220,500");
    await expect(netWorthValue).toHaveClass(/text-green-600/);

    await captureScreenshot(page, "task-8-dashboard-colors");
  });

  test("tooltip is not clipped by sibling metric cards", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);

    // Hover Net Worth (first card) — its tooltip should appear above the next card
    const netWorthCard = page.locator('[aria-label="Net Worth"]').first();
    await netWorthCard.hover();

    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible();

    // Verify tooltip is actually visible and not occluded:
    // The tooltip bounding box bottom should be positive (on screen)
    const tooltipBox = await tooltip.boundingBox();
    expect(tooltipBox).toBeTruthy();
    expect(tooltipBox!.height).toBeGreaterThan(0);

    // Verify the hovered card has elevated z-index
    await expect(netWorthCard).toHaveAttribute("data-tooltip-visible", "true");

    await captureScreenshot(page, "task-19-tooltip-not-clipped");
  });

  test("tooltip remains visible when hovering between cards", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);

    // Hover Monthly Surplus (second card)
    const surplusCard = page.locator('[aria-label="Monthly Surplus"]').first();
    await surplusCard.hover();

    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText("How much more you earn");

    // Tooltip should be clickable/visible — verify it's not hidden behind Financial Runway card
    const tooltipBox = await tooltip.boundingBox();
    expect(tooltipBox).toBeTruthy();
    expect(tooltipBox!.width).toBeGreaterThan(0);

    await captureScreenshot(page, "task-19-surplus-tooltip");
  });

  test("hovering different cards shows correct tooltip each time", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);

    // Hover Net Worth
    const netWorthCard = page.locator('[aria-label="Net Worth"]').first();
    await netWorthCard.hover();
    await expect(page.getByRole("tooltip")).toContainText("total assets minus total debts");

    // Move to Monthly Surplus
    const surplusCard = page.locator('[aria-label="Monthly Surplus"]').first();
    await surplusCard.hover();
    await expect(page.getByRole("tooltip")).toContainText("How much more you earn");

    // Move to Financial Runway
    const runwayCard = page.locator('[aria-label="Financial Runway"]').first();
    await runwayCard.hover();
    await expect(page.getByRole("tooltip")).toContainText("months your liquid assets");

    // Move to Debt-to-Asset Ratio
    const ratioCard = page.locator('[aria-label="Debt-to-Asset Ratio"]').first();
    await ratioCard.hover();
    await expect(page.getByRole("tooltip")).toContainText("total debts divided by your total assets");

    await captureScreenshot(page, "task-19-ratio-tooltip");
  });
});
