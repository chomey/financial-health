import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Insights Panel", () => {
  test("renders insights section below metric cards", async ({ page }) => {
    await page.goto("/");
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();
    await expect(insightsPanel.locator("h3")).toHaveText("Insights");
    await captureScreenshot(page, "task-9-insights-panel");
  });

  test("displays multiple insight cards with messages", async ({ page }) => {
    await page.goto("/");
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    const cards = insightsPanel.locator('[role="article"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(5);
  });

  test("shows runway insight with shield icon", async ({ page }) => {
    await page.goto("/");
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel.locator("text=22 months")).toBeVisible();
    await expect(insightsPanel.locator("text=strong safety net")).toBeVisible();
  });

  test("shows surplus insight", async ({ page }) => {
    await page.goto("/");
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel.locator("text=$3,350 surplus")).toBeVisible();
  });

  test("insight cards have entrance animation classes", async ({ page }) => {
    await page.goto("/");
    // Wait for entrance animations to complete
    await page.waitForTimeout(1500);
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    const firstCard = insightsPanel.locator('[role="article"]').first();
    await expect(firstCard).toHaveClass(/opacity-100/);
    await captureScreenshot(page, "task-9-insights-animated");
  });

  test("insight cards have hover effect", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(1500);
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    const firstCard = insightsPanel.locator('[role="article"]').first();
    await firstCard.hover();
    await captureScreenshot(page, "task-9-insight-hover");
  });
});
