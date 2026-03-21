import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Retirement Income Gap Analysis", () => {
  test("retirement income chart shows coverage percentage on dashboard", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("fhs-wizard-done", "1");
      localStorage.setItem("fhs-default-mode", "advanced");
      localStorage.setItem("fhs-visited", "1");
    });
    await page.goto("/");
    await page.waitForSelector('[data-testid="dashboard-panel"]', { timeout: 15000 });

    // The retirement income chart shows the gap visually
    const chart = page.getByTestId("retirement-income-chart");
    await expect(chart).toBeVisible();

    // Coverage summary shows percentage
    const coverage = page.getByTestId("coverage-summary");
    await expect(coverage).toBeVisible();
    await expect(coverage).toContainText("retirement income covers");

    await captureScreenshot(page, "task-194-retirement-income-gap");
  });
});
