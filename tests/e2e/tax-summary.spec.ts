import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Tax summary insights and projections (Task 45)", () => {
  test("tax insight appears under Estimated Tax card", async ({ page }) => {
    await page.goto("/");
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await expect(dashboard).toBeVisible();

    // Estimated Tax card should contain a tax insight with effective rate info
    const taxCard = dashboard.getByRole("group", { name: "Estimated Tax" });
    await expect(taxCard).toBeVisible();

    // Wait for animations to settle
    await page.waitForTimeout(1500);

    // The tax card should show the effective rate insight message
    await expect(taxCard).toContainText("effective tax rate");

    await captureScreenshot(page, "task-45-tax-insight");
  });

  test("projection chart is visible and rendering", async ({ page }) => {
    await page.goto("/");

    // The projection chart should be visible at the top of the page
    const chartSection = page.locator('[aria-label="Financial projections"]');
    await expect(chartSection).toBeVisible();

    await captureScreenshot(page, "task-45-projection-chart");
  });

  test("tax metric shows annual tax amount greater than zero", async ({ page }) => {
    await page.goto("/");
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    const taxCard = dashboard.getByRole("group", { name: "Estimated Tax" });
    await expect(taxCard).toBeVisible();

    // Wait for count-up animation
    await page.waitForTimeout(1500);

    // The tax value should be greater than $0
    const taxLabel = taxCard.locator('[aria-label*="Estimated Tax"]');
    const labelText = await taxLabel.getAttribute("aria-label");
    expect(labelText).toBeDefined();

    const match = labelText!.match(/\$([0-9,]+)/);
    expect(match).toBeTruthy();
    const taxValue = parseInt(match![1].replace(/,/g, ""));
    expect(taxValue).toBeGreaterThan(0);
  });

  test("effective rate sub-line is visible under tax card", async ({ page }) => {
    await page.goto("/");
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    const effectiveRate = dashboard.getByTestId("effective-tax-rate");
    await expect(effectiveRate).toBeVisible();
    await expect(effectiveRate).toContainText("% effective rate");
  });

  test("dashboard displays all five metric cards including tax", async ({ page }) => {
    await page.goto("/");
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // Verify all five cards exist
    await expect(dashboard.getByRole("group", { name: "Net Worth" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Monthly Surplus" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Estimated Tax" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Financial Runway" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Debt-to-Asset Ratio" })).toBeVisible();

    await captureScreenshot(page, "task-45-all-metrics-with-tax");
  });
});
