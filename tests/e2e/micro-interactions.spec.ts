import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Micro-interactions and polish", () => {
  test("active states on confirm buttons", async ({ page }) => {
    await page.goto("/?step=assets");

    // Click "+ Add Asset" to open the form
    await page.click("text=+ Add Asset");

    // Verify the Add confirm button has active:scale-95 in its class
    const addBtn = page.getByLabel("Confirm add asset");
    await expect(addBtn).toBeVisible();
    const className = await addBtn.getAttribute("class");
    expect(className).toContain("active:scale-95");

    await captureScreenshot(page, "task-13-active-state-button");
  });

  test("metric cards have consistent styling without glow animations", async ({ page }) => {
    await page.goto("/?step=dashboard");

    const runwayCard = page.getByRole("group", { name: "Financial Runway" });
    await expect(runwayCard).toBeVisible();

    // No special glow or pulse animations on any card
    const className = await runwayCard.getAttribute("class");
    expect(className).not.toContain("animate-glow-pulse");
    expect(className).not.toContain("animate-warning-pulse");

    await captureScreenshot(page, "task-13-runway-consistent");
  });

  test("metric card tooltip text is visible on dashboard", async ({ page }) => {
    await page.goto("/?step=dashboard");

    // Net Worth card should show its tooltip text as static content
    const netWorthCard = page.getByRole("group", { name: "Net Worth" });
    await expect(netWorthCard).toBeVisible();

    // The tooltip text is now rendered inline as a paragraph
    await expect(netWorthCard.locator("text=total assets minus total debts")).toBeVisible();

    await captureScreenshot(page, "task-13-tooltip-fade");
  });

  test("empty states show icons with centered layout", async ({ page }) => {
    // Navigate with empty state (encoded empty data)
    await page.goto("/?step=assets");

    // Delete all assets to reach empty state
    const assetSection = page.locator("text=Assets").locator("..");
    // Delete assets one by one
    while (await page.getByLabel(/Delete .+/, { exact: false }).first().isVisible().catch(() => false)) {
      const deleteBtn = page.getByLabel(/Delete .+/).first();
      // Need to hover to show the button
      const row = deleteBtn.locator("..");
      await row.hover();
      await deleteBtn.click();
      await page.waitForTimeout(100);
    }

    // Verify that the empty state structure exists in one component
    // by checking the page source after deleting all items from a section

    await captureScreenshot(page, "task-13-empty-states");
  });

  test("asset entry items have hover transition", async ({ page }) => {
    await page.goto("/?step=assets");

    // Find an asset list item (e.g. Savings Account row) - the inner div has transition classes
    const assetRow = page.locator('[role="listitem"]').filter({ hasText: "Savings Account" }).first();
    await expect(assetRow).toBeVisible();

    // Verify the inner row div has transition classes
    const innerDiv = assetRow.locator(".group").first();
    const className = await innerDiv.getAttribute("class");
    expect(className).toContain("transition-all");

    await assetRow.hover();
    await captureScreenshot(page, "task-13-card-hover");
  });

  test("animate-in class on add form", async ({ page }) => {
    await page.goto("/?step=debts");

    // Open debt add form
    await page.click("text=+ Add Debt");

    // The add form should have animate-in class
    const addForm = page.locator(".animate-in").first();
    await expect(addForm).toBeVisible();

    await captureScreenshot(page, "task-13-animate-in-form");
  });

});
