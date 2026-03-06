import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Withdrawal order pills overflow fix", () => {
  test("withdrawal order pills wrap instead of overflowing", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The default state should have a withdrawal tax summary with pills
    const summary = page.locator('[data-testid="withdrawal-tax-summary"]');
    await expect(summary).toBeVisible();

    // Check withdrawal order container uses flex-wrap
    const pillsContainer = summary.locator("text=Suggested withdrawal order:").locator("..").locator("div").first();
    await expect(pillsContainer).toBeVisible();
    const classes = await pillsContainer.getAttribute("class");
    expect(classes).toContain("flex-wrap");

    await captureScreenshot(page, "task-95-withdrawal-pills-wrap");
  });

  test("burndown chart withdrawal order pills have truncation", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // The burndown chart should be visible on the page
    const burndown = page.locator('[data-testid="runway-burndown-main"]');
    await expect(burndown).toBeVisible();

    // Check withdrawal order section exists in burndown
    const withdrawalOrder = burndown.locator('[data-testid="burndown-withdrawal-order"]');
    await expect(withdrawalOrder).toBeVisible();

    // Check that pills container uses flex-wrap
    const pillsContainer = withdrawalOrder.locator("div.flex");
    await expect(pillsContainer).toBeVisible();
    const classes = await pillsContainer.getAttribute("class");
    expect(classes).toContain("flex-wrap");

    await captureScreenshot(page, "task-95-burndown-pills-wrap");
  });
});
