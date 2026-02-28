import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Cash Flow Sankey Diagram", () => {
  test("renders collapsible section in dashboard", async ({ page }) => {
    await page.goto("/");
    const sankey = page.getByTestId("cash-flow-sankey");
    await expect(sankey).toBeVisible();
    // Should be collapsed by default
    const toggle = page.getByTestId("cash-flow-toggle");
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  test("expands to show Sankey chart on click", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByTestId("cash-flow-toggle");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    // Should show the chart with default data (has income)
    const chart = page.getByTestId("sankey-chart");
    await expect(chart).toBeVisible();
    await captureScreenshot(page, "task-53-sankey-expanded");
  });

  test("shows SVG with income and expense nodes", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("cash-flow-toggle").click();
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
    await page.getByTestId("cash-flow-toggle").click();
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
    await page.getByTestId("cash-flow-toggle").click();
    const legend = page.getByTestId("sankey-legend");
    await expect(legend).toBeVisible();
    await expect(legend.getByText("Income", { exact: true })).toBeVisible();
    await expect(legend.getByText("Taxes", { exact: true })).toBeVisible();
    await expect(legend.getByText("Expenses", { exact: true })).toBeVisible();
    await expect(legend.getByText("Surplus", { exact: true })).toBeVisible();
  });

  test("collapses back when toggle is clicked again", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByTestId("cash-flow-toggle");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    // Chart should not be visible
    await expect(page.getByTestId("sankey-chart")).not.toBeVisible();
  });

  test("positioned in dashboard column after waterfall chart", async ({ page }) => {
    await page.goto("/");
    const dashboard = page.getByRole("region", { name: "Financial dashboard" });
    const sankey = dashboard.getByTestId("cash-flow-sankey");
    await expect(sankey).toBeVisible();
  });
});
