import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Charts dark cyberpunk theme (Task 130)", () => {
  test("projection chart has dark glass card", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    const projectionChart = page.getByTestId("projection-chart");
    await expect(projectionChart).toBeVisible();
    const className = await projectionChart.getAttribute("class");
    expect(className).toContain("border-white/10");
    expect(className).toContain("bg-white/5");
    expect(className).toContain("backdrop-blur-sm");
  });

  test("donut chart has dark glass card", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    const donutChart = page.getByTestId("donut-chart");
    await expect(donutChart).toBeVisible();
    const className = await donutChart.getAttribute("class");
    expect(className).toContain("border-white/10");
    expect(className).toContain("bg-white/5");
  });

  test("expense breakdown chart has dark glass card", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    const expenseChart = page.getByTestId("expense-breakdown-chart");
    await expect(expenseChart).toBeVisible();
    const className = await expenseChart.getAttribute("class");
    expect(className).toContain("border-white/10");
    expect(className).toContain("bg-white/5");
  });

  test("screenshot: charts with dark theme", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(800);
    await captureScreenshot(page, "task-130-charts-dark-theme");
  });

  test("screenshot: projection chart close-up", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(800);

    const projectionChart = page.getByTestId("projection-chart");
    await projectionChart.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await captureScreenshot(page, "task-130-projection-chart-dark");
  });
});
