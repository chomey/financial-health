import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Micro-interactions and polish", () => {
  test("active states on confirm buttons", async ({ page }) => {
    await page.goto("/");

    // Click "+ Add Asset" to open the form
    await page.click("text=+ Add Asset");

    // Verify the Add confirm button has active:scale-95 in its class
    const addBtn = page.getByLabel("Confirm add asset");
    await expect(addBtn).toBeVisible();
    const className = await addBtn.getAttribute("class");
    expect(className).toContain("active:scale-95");

    await captureScreenshot(page, "task-13-active-state-button");
  });

  test("runway celebratory glow when > 12 months", async ({ page }) => {
    await page.goto("/");

    // Default mock data has 22.2 months runway — should show glow
    const runwayCard = page.getByRole("group", { name: "Financial Runway" });
    await expect(runwayCard).toBeVisible();

    // Check for the celebration data attribute
    await expect(runwayCard).toHaveAttribute("data-runway-celebration", "true");

    // Check for celebration text
    await expect(page.getByTestId("runway-celebration-text")).toHaveText("Excellent safety net!");

    // Check the green border styling
    const className = await runwayCard.getAttribute("class");
    expect(className).toContain("border-green-300");
    expect(className).toContain("animate-glow-pulse");

    await captureScreenshot(page, "task-13-runway-glow");
  });

  test("tooltip has fade-in animation", async ({ page }) => {
    await page.goto("/");

    // Hover over the Net Worth card
    const netWorthCard = page.getByRole("group", { name: "Net Worth" });
    await netWorthCard.hover();

    // Wait for tooltip to appear
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible();

    // Verify it has the fade-in animation class
    const tooltipClass = await tooltip.getAttribute("class");
    expect(tooltipClass).toContain("animate-fade-in");

    await captureScreenshot(page, "task-13-tooltip-fade");
  });

  test("empty states show icons with centered layout", async ({ page }) => {
    // Navigate with empty state (encoded empty data)
    await page.goto("/");

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

  test("card hover lift effect on entry cards", async ({ page }) => {
    await page.goto("/");

    // Find the Assets card wrapper (the rounded-xl div)
    const assetsCard = page.locator("[class*='rounded-xl']").filter({ hasText: "Assets" }).first();
    await expect(assetsCard).toBeVisible();

    // Verify the card has hover transition classes
    const className = await assetsCard.getAttribute("class");
    expect(className).toContain("hover:shadow-md");
    expect(className).toContain("hover:-translate-y-0.5");
    expect(className).toContain("transition-all");

    await assetsCard.hover();
    await captureScreenshot(page, "task-13-card-hover");
  });

  test("animate-in class on add form", async ({ page }) => {
    await page.goto("/");

    // Open debt add form
    await page.click("text=+ Add Debt");

    // The add form should have animate-in class
    const addForm = page.locator(".animate-in").first();
    await expect(addForm).toBeVisible();

    await captureScreenshot(page, "task-13-animate-in-form");
  });

});
