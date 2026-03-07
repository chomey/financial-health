import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Soft cyberpunk theme", () => {
  test("page has dark background from theme", async ({ page }) => {
    await page.goto("/");

    // Body should have the dark slate-900 background
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    // #0f172a = rgb(15, 23, 42)
    expect(bgColor).toBe("rgb(15, 23, 42)");

    await captureScreenshot(page, "task-127-dark-theme-body");
  });

  test("page has light foreground text color", async ({ page }) => {
    await page.goto("/");

    const textColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).color;
    });
    // #e2e8f0 = rgb(226, 232, 240)
    expect(textColor).toBe("rgb(226, 232, 240)");
  });

  test("CSS custom properties are set on :root", async ({ page }) => {
    await page.goto("/");

    const accentPositive = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue("--accent-positive")
        .trim();
    });
    expect(accentPositive).toBe("#22d3ee");

    const accentNegative = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue("--accent-negative")
        .trim();
    });
    expect(accentNegative).toBe("#fb7185");

    const accentInfo = await page.evaluate(() => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue("--accent-info")
        .trim();
    });
    expect(accentInfo).toBe("#a78bfa");
  });

  test("full page screenshot with cyberpunk theme", async ({ page }) => {
    await page.goto("/");
    // Wait for the page to fully render
    await page.waitForTimeout(500);
    await captureScreenshot(page, "task-127-full-page-cyberpunk");
  });
});
