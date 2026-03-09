import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Cash Flow Sankey Diagram", () => {
  test("renders section in dashboard expanded by default", async ({ page }) => {
    await page.goto("/");
    const sankey = page.getByTestId("cash-flow-sankey");
    await expect(sankey).toBeVisible();
    // Should be expanded by default
    const toggle = page.getByTestId("cash-flow-toggle");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  test("shows Sankey chart when expanded", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByTestId("cash-flow-toggle");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    // Should show the chart with default data (has income)
    const chart = page.getByTestId("sankey-chart");
    await expect(chart).toBeVisible();
    await captureScreenshot(page, "task-53-sankey-expanded");
  });

  test("shows SVG with income and expense nodes", async ({ page }) => {
    await page.goto("/");
    // Chart is expanded by default
    // Check for income node (Salary from default data)
    const salaryLabel = page.getByTestId("sankey-label-income-i1");
    await expect(salaryLabel).toBeVisible();
    await expect(salaryLabel).toHaveText("Salary");
    // Check for expense nodes
    const rentLabel = page.getByTestId("sankey-label-expense-e1");
    await expect(rentLabel).toBeVisible();
  });

  test("shows tooltip on link hover", async ({ page }) => {
    await page.goto("/");
    // Hover over the after-tax pool node
    const poolNode = page.getByTestId("sankey-node-after-tax");
    await poolNode.hover();
    const tooltip = page.getByTestId("sankey-tooltip");
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toContainText("After-Tax Income");
    await captureScreenshot(page, "task-53-sankey-tooltip");
  });

  test("shows legend with flow categories", async ({ page }) => {
    await page.goto("/");
    const legend = page.getByTestId("sankey-legend");
    await expect(legend).toBeVisible();
    await expect(legend.getByText("Income", { exact: true })).toBeVisible();
    await expect(legend.getByText("Taxes", { exact: true })).toBeVisible();
    await expect(legend.getByText("Expenses", { exact: true })).toBeVisible();
    await expect(legend.getByText("Surplus", { exact: true })).toBeVisible();
  });

  test("collapses when toggle is clicked", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByTestId("cash-flow-toggle");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    // Chart should not be visible
    await expect(page.getByTestId("sankey-chart")).not.toBeVisible();
  });

  test("positioned in dashboard cashflow section", async ({ page }) => {
    await page.goto("/");
    const cashflowSection = page.locator("#section-dash-cashflow");
    const sankey = cashflowSection.getByTestId("cash-flow-sankey");
    await expect(sankey).toBeVisible();
  });
});
