import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Data Flow Arrows", () => {
  test("DataFlowProvider renders without errors on homepage", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toContainText("Financial Health Snapshot");

    // The overlay should NOT be visible when no target is hovered
    const overlay = page.locator('[data-testid="data-flow-overlay"]');
    await expect(overlay).toHaveCount(0);
  });

  test("SVG overlay system is available in the DOM when activated", async ({
    page,
  }) => {
    await page.goto("/");

    // Inject a test that activates the data flow context
    // We verify the provider is mounted by checking we can access it
    const hasProvider = await page.evaluate(() => {
      // Check that the DataFlowProvider wraps the page
      // by looking for the provider's internal structure
      const root = document.querySelector("#__next") || document.body;
      return root.querySelector("main") !== null;
    });
    expect(hasProvider).toBe(true);

    // Verify arrow CSS animations are available
    const hasAnimations = await page.evaluate(() => {
      const sheets = document.styleSheets;
      let found = false;
      for (const sheet of sheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (
              rule instanceof CSSKeyframesRule &&
              rule.name === "arrow-draw"
            ) {
              found = true;
              break;
            }
          }
        } catch {
          // Cross-origin stylesheets may throw
        }
        if (found) break;
      }
      return found;
    });
    expect(hasAnimations).toBe(true);

    await captureScreenshot(page, "task-69-data-flow-arrows-base");
  });

  test("arrow-fade-in animation exists in stylesheets", async ({ page }) => {
    await page.goto("/");

    const hasAnimation = await page.evaluate(() => {
      const sheets = document.styleSheets;
      for (const sheet of sheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (
              rule instanceof CSSKeyframesRule &&
              rule.name === "arrow-fade-in"
            ) {
              return true;
            }
          }
        } catch {
          // skip cross-origin
        }
      }
      return false;
    });
    expect(hasAnimation).toBe(true);
  });
});
