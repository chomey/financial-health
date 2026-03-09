import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Cash Flow Sankey — Investment Interest Income", () => {
  test("shows investment interest income node for income-type assets", async ({ page }) => {
    await page.goto("/");
    // Sankey is expanded by default
    await expect(page.getByTestId("sankey-chart")).toBeVisible();

    // Look for investment return node label (shows account name)
    const interestLabel = page.getByTestId("sankey-label-inv-return-0");
    await expect(interestLabel).toBeVisible();
    await expect(interestLabel).toContainText("Savings Account");

    await captureScreenshot(page, "task-105-sankey-investment-returns");
  });

  test("shows Interest Income legend entry when investment returns present", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("sankey-chart")).toBeVisible();

    const legendEntry = page.getByTestId("sankey-legend-investment-income");
    await expect(legendEntry).toBeVisible();
    await expect(legendEntry).toContainText("Interest Income");

    await captureScreenshot(page, "task-105-sankey-legend-interest");
  });

  test("investment-income node has teal color distinct from employment income", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("sankey-chart")).toBeVisible();

    // Check that the investment-income node rect exists with the correct fill color
    const invReturnNode = page.getByTestId("sankey-node-inv-return-0");
    await expect(invReturnNode).toBeVisible();
    const fill = await invReturnNode.getAttribute("fill");
    // Should be teal (#14b8a6), not emerald (#10b981)
    expect(fill).toBe("#14b8a6");
  });
});
