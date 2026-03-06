import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Whiteboard SVG Annotations in Explainer Modal", () => {
  test("connector lines render between source cards and result", async ({ page }) => {
    await page.goto("/");

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Connector lines should be present for each source
    const connector0 = page.locator('[data-testid="explainer-connector-0"]');
    await expect(connector0).toBeVisible();

    // Connector SVGs should have path elements with non-empty d attributes
    const connectorPath = connector0.locator("path");
    const d = await connectorPath.getAttribute("d");
    expect(d).toBeTruthy();
    expect(d!.length).toBeGreaterThan(5);

    // Should have arrowhead markers
    const marker = connector0.locator("marker");
    await expect(marker).toHaveCount(1);

    await captureScreenshot(page, "task-81-connector-lines");
  });

  test("connector lines use correct colors (green for positive, red for negative)", async ({ page }) => {
    await page.goto("/");

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // First connector (positive/assets) should be green
    const connector0Path = page.locator('[data-testid="explainer-connector-0"] path');
    const stroke0 = await connector0Path.getAttribute("stroke");
    expect(stroke0).toBe("#059669");

    // Find a negative connector (debts)
    const connector1Path = page.locator('[data-testid="explainer-connector-1"] path');
    if (await connector1Path.count() > 0) {
      const stroke1 = await connector1Path.getAttribute("stroke");
      expect(stroke1).toBe("#e11d48");
    }
  });

  test("sum bar renders with hand-drawn SVG path", async ({ page }) => {
    await page.goto("/");

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Sum bar SVG should be visible
    const sumBar = page.locator('[data-testid="explainer-sum-bar"]');
    await expect(sumBar).toBeVisible();

    // Sum bar path should have the animate-draw-sum-bar class
    const sumBarPath = sumBar.locator("path");
    const className = await sumBarPath.getAttribute("class");
    expect(className).toContain("animate-draw-sum-bar");

    // Path should have round linecap and linejoin
    expect(await sumBarPath.getAttribute("stroke-linecap")).toBe("round");
    expect(await sumBarPath.getAttribute("stroke-linejoin")).toBe("round");
  });

  test("oval annotations have opacity 0.7 and round stroke caps", async ({ page }) => {
    await page.goto("/");

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Check oval path attributes
    const ovalPath = page.locator('[data-testid="source-summary-oval-section-assets"] path');
    await expect(ovalPath).toBeVisible();

    expect(await ovalPath.getAttribute("opacity")).toBe("0.7");
    expect(await ovalPath.getAttribute("stroke-linecap")).toBe("round");
    expect(await ovalPath.getAttribute("stroke-linejoin")).toBe("round");
  });

  test("result value and equals sign are visible after animation", async ({ page }) => {
    await page.goto("/");

    const netWorthCard = page.locator('[data-testid="metric-card-net-worth"]');
    await netWorthCard.scrollIntoViewIfNeeded();
    await netWorthCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Wait for animations to complete (result appears at ~1200ms)
    await page.waitForTimeout(1500);

    const resultArea = page.locator('[data-testid="explainer-result-area"]');
    await expect(resultArea).toBeVisible();

    const resultValue = page.locator('[data-testid="explainer-result-value"]');
    await expect(resultValue).toBeVisible();
    const text = await resultValue.textContent();
    expect(text).toBeTruthy();
    // Should contain a dollar sign and numbers
    expect(text).toMatch(/\$/);

    await captureScreenshot(page, "task-81-whiteboard-result");
  });

  test("whiteboard modal for Monthly Surplus shows full layout", async ({ page }) => {
    await page.goto("/");

    const surplusCard = page.locator('[data-testid="metric-card-monthly-surplus"]');
    await surplusCard.scrollIntoViewIfNeeded();
    await surplusCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible();

    // Wait for all animations
    await page.waitForTimeout(1500);

    // Should have source cards, connectors, operators, sum bar, result
    await expect(page.locator('[data-testid="explainer-sources"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-sum-bar"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-result-area"]')).toBeVisible();

    await captureScreenshot(page, "task-81-whiteboard-surplus");
  });
});
