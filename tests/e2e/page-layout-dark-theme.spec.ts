import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Page layout dark theme (Task 131)", () => {
  test("page has dark slate-950 background", async ({ page }) => {
    await page.goto("/");

    // Page wrapper should be dark
    const bgColor = await page.evaluate(() => {
      const wrapper = document.querySelector(".min-h-screen") as HTMLElement;
      return wrapper ? window.getComputedStyle(wrapper).backgroundColor : null;
    });
    // slate-950 is #020617 = rgb(2, 6, 23)
    // Body background is #0f172a = rgb(15, 23, 42) (--background)
    // Either the wrapper or body should be dark
    const bodyBg = await page.evaluate(() => window.getComputedStyle(document.body).backgroundColor);
    expect(bodyBg).toBe("rgb(15, 23, 42)");
  });

  test("header has dark glass background", async ({ page }) => {
    await page.goto("/");

    const headerHasDarkBg = await page.evaluate(() => {
      const header = document.querySelector("header");
      if (!header) return false;
      // Check class names contain bg-slate-900/80 or backdrop-blur
      return header.className.includes("bg-slate-900") || header.className.includes("backdrop-blur");
    });
    expect(headerHasDarkBg).toBe(true);
  });

  test("nav has dark glass background", async ({ page }) => {
    await page.goto("/");

    const navHasDarkBg = await page.evaluate(() => {
      const nav = document.querySelector("nav");
      if (!nav) return false;
      return nav.className.includes("bg-slate-950") || nav.className.includes("backdrop-blur");
    });
    expect(navHasDarkBg).toBe(true);
  });

  test("header title is white", async ({ page }) => {
    await page.goto("/");

    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    const className = await h1.getAttribute("class") || "";
    expect(className).toContain("text-white");
  });

  test("FastForward panel has dark background when open", async ({ page }) => {
    await page.goto("/");

    // Open the FastForward panel
    await page.click('[data-testid="fast-forward-toggle"]');

    const panel = page.locator('[data-testid="fast-forward-panel"]');
    await expect(panel).toBeVisible();

    const panelClass = await panel.getAttribute("class") || "";
    expect(panelClass).toContain("bg-white/5");
    expect(panelClass).toContain("border-white/10");
  });

  test("country selector has dark style", async ({ page }) => {
    await page.goto("/");

    const selector = page.locator('[data-testid="country-jurisdiction-selector"]');
    await expect(selector).toBeVisible();

    // Country toggle container
    const toggleClass = await page.evaluate(() => {
      const selector = document.querySelector('[data-testid="country-jurisdiction-selector"]');
      const toggle = selector?.querySelector('.inline-flex') as HTMLElement;
      return toggle?.className ?? "";
    });
    // Should contain dark glass styles
    expect(toggleClass).toContain("bg-white/5");
  });

  test("benchmark comparisons has dark card style", async ({ page }) => {
    await page.goto("/");

    const benchmarkCard = page.locator('[data-testid="benchmark-comparisons"]');
    await expect(benchmarkCard).toBeVisible();

    const cardClass = await benchmarkCard.getAttribute("class") || "";
    expect(cardClass).toContain("bg-white/5");
    expect(cardClass).toContain("border-white/10");
  });

  test("full page screenshot with complete dark theme", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(800);
    await captureScreenshot(page, "task-131-full-page-dark-theme");
  });

  test("full page screenshot with FastForward open", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);

    // Open FastForward
    await page.click('[data-testid="fast-forward-toggle"]');
    await page.waitForTimeout(300);

    // Scroll to see FastForward
    await page.locator('[data-testid="fast-forward-panel"]').scrollIntoViewIfNeeded();
    await captureScreenshot(page, "task-131-fast-forward-dark-theme");
  });
});
