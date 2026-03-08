import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Context-aware insights (Task 148)", () => {
  test("default CA state with TFSA+RRSP shows context-aware tax insight", async ({ page }) => {
    // Default state: CA user with TFSA, RRSP, Savings Account
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();

    // Should not show the generic fallback message
    const genericMessage = insightsPanel.locator("text=TFSA, RRSP, 401k");
    await expect(genericMessage).not.toBeVisible();

    await captureScreenshot(page, "task-148-insights-ca-with-tfsa-rrsp");
  });

  test("insights panel renders without errors in default CA state", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();

    const cards = insightsPanel.locator('[role="article"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(2);

    await captureScreenshot(page, "task-148-insights-panel-default");
  });
});
