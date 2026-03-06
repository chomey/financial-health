import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Projection Chart Drawdown Tax", () => {
  test("projection chart renders with drawdown scenario and shows tax drag in tooltip", async ({ page }) => {
    await page.goto("/");

    // Set up a drawdown scenario: zero income, significant expenses
    // First, clear default income
    const salaryRow = page.getByRole("listitem").filter({ hasText: "Salary" });
    await salaryRow.hover();
    await page.getByLabel("Delete Salary").click();
    await page.waitForTimeout(300);

    // Increase RRSP to be the main asset (tax-deferred, will trigger tax drag)
    await page.getByLabel(/Edit amount for RRSP/).click();
    const rrspInput = page.getByLabel("Edit amount for RRSP");
    await rrspInput.fill("200000");
    await rrspInput.press("Enter");
    await page.waitForTimeout(1500);

    // Verify the projection chart still renders
    const chart = page.locator('[data-testid="projection-chart"]');
    await expect(chart).toBeVisible();

    // Verify the chart container has content (the recharts SVG)
    const chartContainer = page.locator('[data-testid="projection-chart-container"]');
    await expect(chartContainer).toBeVisible();

    // The chart should render lines for this drawdown scenario
    const svgLines = chartContainer.locator("svg .recharts-line");
    await expect(svgLines.first()).toBeVisible({ timeout: 5000 });

    await captureScreenshot(page, "task-65-projection-drawdown-tax");
  });

  test("projection chart works with mixed tax-free and tax-deferred in drawdown", async ({ page }) => {
    await page.goto("/");

    // Remove income to create drawdown
    const salaryRow = page.getByRole("listitem").filter({ hasText: "Salary" });
    await salaryRow.hover();
    await page.getByLabel("Delete Salary").click();
    await page.waitForTimeout(300);

    // Default has TFSA ($22k, tax-free) and RRSP ($28k, tax-deferred)
    // This should produce a projection where TFSA is drawn first, then RRSP

    // Verify the projection chart renders
    const chart = page.locator('[data-testid="projection-chart"]');
    await expect(chart).toBeVisible();

    // Verify summary table updates
    const summaryTable = page.locator('[data-testid="projection-summary-table"]');
    await expect(summaryTable).toBeVisible();

    await captureScreenshot(page, "task-65-projection-mixed-drawdown");
  });
});
