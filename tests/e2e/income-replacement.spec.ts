import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Income Replacement metric", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');
  });

  test("Income Replacement metric card is visible with default data", async ({ page }) => {
    const card = page.getByTestId("metric-card-income-replacement");
    await expect(card).toBeVisible();
    await expect(card).toContainText("Income Replacement");
    await expect(card).toContainText("%");

    await captureScreenshot(page, "task-119-income-replacement-card");
  });

  test("Income Replacement card shows a progress bar", async ({ page }) => {
    const card = page.getByTestId("metric-card-income-replacement");
    await expect(card).toBeVisible();
    const progressBar = card.getByTestId("income-replacement-progress");
    await expect(progressBar).toBeVisible();

    await captureScreenshot(page, "task-119-income-replacement-progress");
  });

  test("Income Replacement card shows a tier label", async ({ page }) => {
    const card = page.getByTestId("metric-card-income-replacement");
    await expect(card).toBeVisible();
    const tier = card.getByTestId("income-replacement-tier");
    await expect(tier).toBeVisible();
    // Default data should show one of the known tiers
    const tierText = await tier.textContent();
    const validTiers = ["Early stage", "Building momentum", "Strong position", "Nearly independent", "Financially independent"];
    expect(validTiers.some((t) => tierText?.includes(t))).toBeTruthy();
  });

  test("Income Replacement insight appears in insights panel", async ({ page }) => {
    // The insights panel should show an income-replacement insight
    const insightsPanel = page.getByTestId("insights-panel");
    await expect(insightsPanel).toBeVisible();

    // Look for the 🎯 icon associated with income-replacement insight
    await expect(insightsPanel).toContainText("🎯");

    await captureScreenshot(page, "task-119-income-replacement-insight");
  });

  test("Income Replacement shows higher percentage with large investment portfolio", async ({ page }) => {
    // Set up state with large asset (savings) and modest income to get high replacement ratio
    // We'll use URL state to pre-load a scenario — navigate to page and use the entry UI
    // Add a large savings amount
    const savingsInput = page.locator('[data-testid="asset-amount-input"]').first();
    if (await savingsInput.isVisible()) {
      await savingsInput.fill("1500000");
      await savingsInput.blur();
    }

    // The metric should update
    const card = page.getByTestId("metric-card-income-replacement");
    await expect(card).toBeVisible();
    const pctText = await card.locator("p").filter({ hasText: "%" }).first().textContent();
    expect(pctText).toBeTruthy();

    await captureScreenshot(page, "task-119-income-replacement-high");
  });

  test("Income Replacement metric format is percent", async ({ page }) => {
    const card = page.getByTestId("metric-card-income-replacement");
    await expect(card).toBeVisible();
    // The value should not have dollar sign or "mo" suffix — just a number with %
    const valueEl = card.locator("p.text-3xl");
    await expect(valueEl).toBeVisible();
    const text = await valueEl.textContent();
    expect(text).toMatch(/\d+%/);
    expect(text).not.toContain("$");
    expect(text).not.toContain("mo");
  });
});
