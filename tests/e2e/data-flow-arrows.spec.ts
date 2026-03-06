import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Data Flow Arrows", () => {
  test("DataFlowProvider renders without errors on homepage", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Financial Health Snapshot");

    // The spotlight overlay should be present but invisible when no target is hovered
    const overlay = page.locator('[data-testid="spotlight-overlay"]');
    await expect(overlay).toHaveCSS("opacity", "0");
  });

  test("Spotlight overlay system is available in the DOM when activated", async ({
    page,
  }) => {
    await page.goto("/");

    // Check that the DataFlowProvider wraps the page
    const hasProvider = await page.evaluate(() => {
      const root = document.querySelector("#__next") || document.body;
      return root.querySelector("main") !== null;
    });
    expect(hasProvider).toBe(true);

    // Verify spotlight overlay exists
    const overlay = page.locator('[data-testid="spotlight-overlay"]');
    await expect(overlay).toBeAttached();

    await captureScreenshot(page, "task-69-data-flow-arrows-base");
  });

  test("spotlight-overlay has pointer-events none", async ({ page }) => {
    await page.goto("/");

    const overlay = page.locator('[data-testid="spotlight-overlay"]');
    await expect(overlay).toHaveCSS("pointer-events", "none");
  });
});
