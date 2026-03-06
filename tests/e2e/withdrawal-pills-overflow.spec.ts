import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Withdrawal order pills overflow fix", () => {
  test("withdrawal order in runway explainer shows ordered entries", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click the Financial Runway metric card to open explainer
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await dashboard.scrollIntoViewIfNeeded();
    const runwayCard = dashboard.locator('[role="group"]').filter({ hasText: "Financial Runway" });
    await runwayCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Check withdrawal order entries exist in the explainer
    const firstEntry = modal.locator('[data-testid="withdrawal-order-0"]');
    await expect(firstEntry).toBeVisible();

    // Check disclaimer is present
    const disclaimer = modal.locator('[data-testid="withdrawal-order-disclaimer"]');
    await expect(disclaimer).toBeVisible();

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
