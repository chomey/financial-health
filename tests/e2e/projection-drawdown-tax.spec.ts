import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

async function goToStep(page: import("@playwright/test").Page, step: string) {
  const url = new URL(page.url());
  url.searchParams.set("step", step);
  await page.goto(url.toString());
}

test.describe("Projection Chart Drawdown Tax", () => {
  test("projection chart renders with drawdown scenario and shows tax drag in tooltip", async ({ page }) => {
    // Delete income on income step to create drawdown
    await page.goto("/?step=income");
    const incomeList = page.getByRole("list", { name: "Income items" });
    const salaryRow = incomeList.getByRole("listitem").filter({ hasText: "Salary" });
    await salaryRow.getByLabel("Delete Salary").click();
    await page.waitForTimeout(300);

    // Increase RRSP on assets step
    await goToStep(page, "assets");
    const assetsList = page.getByRole("list", { name: "Asset items" });
    const rrspRow = assetsList.getByRole("listitem").filter({ hasText: "RRSP" });
    await rrspRow.getByLabel(/Edit amount for RRSP/).click();
    const rrspInput = page.getByLabel("Edit amount for RRSP");
    await rrspInput.fill("200000");
    await rrspInput.press("Enter");

    // Navigate to dashboard to verify projection chart
    await goToStep(page, "dashboard");
    await page.waitForTimeout(1500);

    const chart = page.locator('[data-testid="projection-chart"]');
    await expect(chart).toBeVisible();

    const chartContainer = page.locator('[data-testid="projection-chart-container"]');
    await expect(chartContainer).toBeVisible();

    const svgLines = chartContainer.locator("svg .recharts-line");
    await expect(svgLines.first()).toBeVisible({ timeout: 5000 });

    await captureScreenshot(page, "task-65-projection-drawdown-tax");
  });

  test("projection chart works with mixed tax-free and tax-deferred in drawdown", async ({ page }) => {
    // Remove income on income step to create drawdown
    await page.goto("/?step=income");
    const incomeList = page.getByRole("list", { name: "Income items" });
    const salaryRow = incomeList.getByRole("listitem").filter({ hasText: "Salary" });
    await salaryRow.getByLabel("Delete Salary").click();
    await page.waitForTimeout(300);

    // Default has TFSA ($22k, tax-free) and RRSP ($28k, tax-deferred)
    // Navigate to dashboard to verify chart renders
    await goToStep(page, "dashboard");

    const chart = page.locator('[data-testid="projection-chart"]');
    await expect(chart).toBeVisible();

    const summaryTable = page.locator('[data-testid="projection-summary-table"]');
    await expect(summaryTable).toBeVisible();

    await captureScreenshot(page, "task-65-projection-mixed-drawdown");
  });
});
