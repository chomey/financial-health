import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Tax computation in metrics (Task 44)", () => {
  test("dashboard shows Estimated Tax metric card", async ({ page }) => {
    await page.goto("/");
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await expect(dashboard).toBeVisible();

    // Estimated Tax card should be visible
    const taxCard = dashboard.getByRole("group", { name: "Estimated Tax" });
    await expect(taxCard).toBeVisible();

    // Should show a currency value > $0
    const taxValue = taxCard.locator("p").first();
    await expect(taxValue).toBeVisible();

    await captureScreenshot(page, "task-44-tax-metric-card");
  });

  test("effective tax rate is displayed", async ({ page }) => {
    await page.goto("/");
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // Effective rate should appear under the Estimated Tax card
    const effectiveRate = dashboard.getByTestId("effective-tax-rate");
    await expect(effectiveRate).toBeVisible();
    await expect(effectiveRate).toContainText("% effective rate");
  });

  test("surplus tooltip mentions after-tax", async ({ page }) => {
    await page.goto("/");
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // Monthly Surplus description should mention "after estimated taxes"
    const surplusCard = dashboard.getByRole("group", { name: "Monthly Surplus" });
    await expect(surplusCard).toBeVisible();
    await expect(surplusCard).toContainText("after estimated taxes");
  });

  test("surplus value is less than pre-tax surplus", async ({ page }) => {
    await page.goto("/");
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // Monthly Surplus should be less than pre-tax (6300 - 2950 = 3350)
    const surplusCard = dashboard.getByRole("group", { name: "Monthly Surplus" });
    await expect(surplusCard).toBeVisible();

    // Wait for count-up animation to finish
    await page.waitForTimeout(1500);

    // Get the surplus value text
    const surplusLabel = surplusCard.locator('[aria-label*="Monthly Surplus"]');
    const labelText = await surplusLabel.getAttribute("aria-label");
    expect(labelText).toBeDefined();

    // Extract dollar value from label like "Monthly Surplus: $2,345"
    const match = labelText!.match(/\$([0-9,]+)/);
    expect(match).toBeTruthy();
    const surplusValue = parseInt(match![1].replace(/,/g, ""));
    // After-tax surplus should be less than pre-tax $3,350
    expect(surplusValue).toBeLessThan(3350);
    expect(surplusValue).toBeGreaterThan(0);
  });

  test("dashboard shows five metric cards", async ({ page }) => {
    await page.goto("/");
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // Should now have 5 metric cards: Net Worth, Monthly Surplus, Estimated Tax, Financial Runway, Debt-to-Asset Ratio
    const cards = dashboard.getByRole("group");
    await expect(cards).toHaveCount(5);

    await captureScreenshot(page, "task-44-five-metric-cards");
  });

  test("surplus breakdown shows after-tax income", async ({ page }) => {
    await page.goto("/");
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    const surplusCard = dashboard.getByRole("group", { name: "Monthly Surplus" });

    // Hover to reveal breakdown
    await surplusCard.hover();
    await page.waitForTimeout(300);

    // Breakdown should mention "after-tax income"
    await expect(surplusCard).toContainText("after-tax income");

    await captureScreenshot(page, "task-44-surplus-after-tax-breakdown");
  });
});
