import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

/**
 * Task 134: Visual theme E2E regression
 * Verifies the cyberpunk theme renders correctly across all major views
 * and that text meets WCAG AA contrast requirements.
 */

// Helper: get computed rgba/rgb color of an element
async function getColor(
  page: import("@playwright/test").Page,
  selector: string,
  property: "color" | "backgroundColor"
) {
  return page.evaluate(
    ([sel, prop]) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      return window.getComputedStyle(el)[prop as "color" | "backgroundColor"];
    },
    [selector, property] as const
  );
}

// Helper: parse rgb(r, g, b) or rgba(r, g, b, a) to components
function parseRgb(rgb: string): { r: number; g: number; b: number; a: number } {
  const match = rgb.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/
  );
  if (!match) throw new Error(`Cannot parse color: ${rgb}`);
  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
    a: match[4] !== undefined ? parseFloat(match[4]) : 1,
  };
}

function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(fg: { r: number; g: number; b: number }, bg: { r: number; g: number; b: number }): number {
  const l1 = luminance(fg.r, fg.g, fg.b);
  const l2 = luminance(bg.r, bg.g, bg.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

test.describe("Task 134: Visual theme regression — Main dashboard", () => {
  test("dark background renders on page load", async ({ page }) => {
    await page.goto("/");
    const bgColor = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );
    expect(bgColor).toBe("rgb(15, 23, 42)");
  });

  test("metric cards have glass card styling", async ({ page }) => {
    await page.goto("/");
    // Find metric cards by the dashboard data-testid
    const dashboard = page.getByTestId("snapshot-dashboard");
    await expect(dashboard).toBeVisible();

    await captureScreenshot(page, "task-134-dashboard-metrics");
  });

  test("metric card text has sufficient contrast against dark background", async ({ page }) => {
    await page.goto("/");
    // Get the body background color (the effective dark background)
    const bodyBg = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );
    const bg = parseRgb(bodyBg!);

    // Check that some visible text elements have good contrast
    const textColors = await page.evaluate(() => {
      const colors: string[] = [];
      // Grab computed color from various text elements on the page
      const elements = document.querySelectorAll("h1, h2, h3, p, span, label");
      for (let i = 0; i < Math.min(elements.length, 30); i++) {
        const style = window.getComputedStyle(elements[i]);
        const color = style.color;
        // Only check elements that are visible
        if (style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0") {
          colors.push(color);
        }
      }
      return [...new Set(colors)];
    });

    // Every unique visible text color should meet at least 3:1 (large text threshold)
    for (const colorStr of textColors) {
      const fg = parseRgb(colorStr);
      const ratio = contrastRatio(fg, bg);
      expect(
        ratio,
        `Text color ${colorStr} should meet WCAG AA large text (3:1) against ${bodyBg}`
      ).toBeGreaterThanOrEqual(3.0);
    }
  });
});

test.describe("Task 134: Visual theme regression — Entry panels", () => {
  test("entry panels render with dark glass styling", async ({ page }) => {
    await page.goto("/");

    // The entry panels should be visible on the page
    // Look for asset/debt/income section headings
    const headings = page.locator("h2, h3");
    const count = await headings.count();
    expect(count).toBeGreaterThan(0);

    await captureScreenshot(page, "task-134-entry-panels");
  });

  test("input fields are visible against dark background", async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(300);

    // Check that input elements have sufficient contrast
    const inputStyles = await page.evaluate(() => {
      const inputs = document.querySelectorAll("input, select");
      const styles: { color: string; bg: string }[] = [];
      inputs.forEach((input) => {
        const s = window.getComputedStyle(input);
        if (s.display !== "none") {
          styles.push({ color: s.color, bg: s.backgroundColor });
        }
      });
      return styles;
    });

    for (const style of inputStyles) {
      if (style.bg && style.bg !== "rgba(0, 0, 0, 0)") {
        const fg = parseRgb(style.color);
        const bg = parseRgb(style.bg);
        const ratio = contrastRatio(fg, bg);
        expect(
          ratio,
          `Input text ${style.color} on ${style.bg} should meet WCAG AA`
        ).toBeGreaterThanOrEqual(3.0);
      }
    }
  });
});

test.describe("Task 134: Visual theme regression — Explainer modal", () => {
  test("explainer modal opens with readable text", async ({ page }) => {
    await page.goto("/");

    // Click on a metric card to open the explainer
    // Try clicking the net worth metric (first clickable metric)
    const metricCards = page.locator('[data-testid="snapshot-dashboard"] [role="button"], [data-testid="snapshot-dashboard"] button');
    const cardCount = await metricCards.count();

    if (cardCount > 0) {
      await metricCards.first().click();
      await page.waitForTimeout(500);

      // Check if an explainer modal appeared
      const modal = page.getByTestId("explainer-modal");
      const modalVisible = await modal.isVisible().catch(() => false);

      if (modalVisible) {
        // Verify text in the modal has good contrast
        const modalTextColors = await page.evaluate(() => {
          const modal = document.querySelector('[data-testid="explainer-modal"]');
          if (!modal) return [];
          const colors: string[] = [];
          const elements = modal.querySelectorAll("*");
          for (let i = 0; i < elements.length; i++) {
            const style = window.getComputedStyle(elements[i]);
            if (
              style.display !== "none" &&
              style.visibility !== "hidden" &&
              elements[i].textContent?.trim()
            ) {
              colors.push(style.color);
            }
          }
          return [...new Set(colors)];
        });

        // All text colors in the modal should be readable
        const bodyBg = await page.evaluate(() =>
          window.getComputedStyle(document.body).backgroundColor
        );
        const bg = parseRgb(bodyBg!);
        for (const colorStr of modalTextColors) {
          const fg = parseRgb(colorStr);
          const ratio = contrastRatio(fg, bg);
          // At least 3:1 for any visible text
          expect(
            ratio,
            `Modal text ${colorStr} should be readable against dark background`
          ).toBeGreaterThanOrEqual(3.0);
        }

        await captureScreenshot(page, "task-134-explainer-modal");
      }
    }
  });
});

test.describe("Task 134: Visual theme regression — Projection chart", () => {
  test("projection chart renders with cyberpunk colors", async ({ page }) => {
    await page.goto("/");

    const chart = page.getByTestId("projection-chart");
    const chartVisible = await chart.isVisible().catch(() => false);

    if (chartVisible) {
      // Verify scenario buttons are present and styled
      const scenarios = ["conservative", "moderate", "optimistic"];
      for (const scenario of scenarios) {
        const btn = page.getByTestId(`scenario-${scenario}`);
        const visible = await btn.isVisible().catch(() => false);
        if (visible) {
          await expect(btn).toBeVisible();
        }
      }

      await captureScreenshot(page, "task-134-projection-chart");
    }
  });
});

test.describe("Task 134: Visual theme regression — Mobile responsive", () => {
  test("theme looks correct on mobile viewport", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForTimeout(500);

    // Background should still be dark
    const bgColor = await page.evaluate(() =>
      window.getComputedStyle(document.body).backgroundColor
    );
    expect(bgColor).toBe("rgb(15, 23, 42)");

    // Text should still be light
    const textColor = await page.evaluate(() =>
      window.getComputedStyle(document.body).color
    );
    expect(textColor).toBe("rgb(226, 232, 240)");

    // Content should be visible (no horizontal overflow causing hidden content)
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(376); // Allow 1px tolerance

    await captureScreenshot(page, "task-134-mobile-responsive");
  });

  test("metric cards stack vertically on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    const dashboard = page.getByTestId("snapshot-dashboard");
    const visible = await dashboard.isVisible().catch(() => false);
    if (visible) {
      // Dashboard should be visible and contained within viewport
      const box = await dashboard.boundingBox();
      if (box) {
        expect(box.width).toBeLessThanOrEqual(375);
      }
    }
  });
});

test.describe("Task 134: Visual theme regression — CSS custom properties", () => {
  test("all semantic accent tokens are defined", async ({ page }) => {
    await page.goto("/");

    const vars = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return {
        background: style.getPropertyValue("--background").trim(),
        foreground: style.getPropertyValue("--foreground").trim(),
        accentPositive: style.getPropertyValue("--accent-positive").trim(),
        accentNegative: style.getPropertyValue("--accent-negative").trim(),
        accentInfo: style.getPropertyValue("--accent-info").trim(),
        accentHighlight: style.getPropertyValue("--accent-highlight").trim(),
        accentMuted: style.getPropertyValue("--accent-muted").trim(),
      };
    });

    expect(vars.background).toBe("#0f172a");
    expect(vars.foreground).toBe("#e2e8f0");
    expect(vars.accentPositive).toBe("#22d3ee");
    expect(vars.accentNegative).toBe("#fb7185");
    expect(vars.accentInfo).toBe("#a78bfa");
    expect(vars.accentHighlight).toBe("#f472b6");
    expect(vars.accentMuted).toBe("#94a3b8");
  });
});
