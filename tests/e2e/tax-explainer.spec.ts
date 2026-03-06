import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Tax Explainer Modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-estimated-tax"]');
  });

  test("clicking Estimated Tax card opens tax-specific explainer", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="explainer-modal"]');

    // Should show tax explainer, not generic source cards
    await expect(page.locator('[data-testid="tax-explainer"]')).toBeVisible();
    // Generic source cards should NOT be present
    await expect(page.locator('[data-testid="explainer-sources"]')).not.toBeVisible();
  });

  test("shows bracket bar with colored segments", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    const bracketBar = page.locator('[data-testid="tax-bracket-bar"]');
    await expect(bracketBar).toBeVisible();

    // At least one bracket segment should exist
    const segments = page.locator('[data-testid^="tax-bracket-segment-"]');
    const count = await segments.count();
    expect(count).toBeGreaterThan(0);

    // Segments should have background colors
    const firstSegment = segments.first();
    const bgColor = await firstSegment.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("shows federal and provincial breakdown", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    const modal = page.locator('[data-testid="explainer-modal"]');
    const breakdown = modal.locator('[data-testid="tax-breakdown"]');
    await breakdown.scrollIntoViewIfNeeded();
    await expect(breakdown).toBeVisible();
    await expect(breakdown).toContainText("Federal");
    await expect(breakdown).toContainText("Provincial");
    await expect(breakdown).toContainText("Ontario");

    // Federal and provincial amounts should be displayed
    await expect(page.locator('[data-testid="tax-federal-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="tax-provincial-amount"]')).toBeVisible();
  });

  test("shows effective and marginal rates", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    const rates = page.locator('[data-testid="tax-rates"]');
    await expect(rates).toBeVisible();

    const effectiveRate = page.locator('[data-testid="tax-effective-rate"]');
    await expect(effectiveRate).toBeVisible();
    const effectiveText = await effectiveRate.textContent();
    expect(effectiveText).toMatch(/\d+\.\d+%/);

    const marginalRate = page.locator('[data-testid="tax-marginal-rate"]');
    await expect(marginalRate).toBeVisible();
    const marginalText = await marginalRate.textContent();
    expect(marginalText).toMatch(/\d+\.\d+%/);
  });

  test("shows after-tax income flow", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    const flow = page.locator('[data-testid="tax-after-tax-flow"]');
    await expect(flow).toBeVisible();
    await expect(flow).toContainText("Gross");
    await expect(flow).toContainText("Tax");
    await expect(flow).toContainText("After-tax");
  });

  test("modal closes on Escape key", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible();
  });

  test("captures screenshot of tax explainer", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');
    await captureScreenshot(page, "task-84-tax-explainer");
  });
});
