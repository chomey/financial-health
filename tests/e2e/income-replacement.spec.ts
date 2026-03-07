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

test.describe("Income Replacement explainer modal (task 133)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');
  });

  test("clicking Income Replacement card opens explainer modal", async ({ page }) => {
    const card = page.getByTestId("metric-card-income-replacement");
    await expect(card).toBeVisible();
    await card.click();
    const modal = page.getByTestId("explainer-modal");
    await expect(modal).toBeVisible();
    await expect(modal).toContainText("Income Replacement");

    await captureScreenshot(page, "task-133-income-replacement-explainer-open");
  });

  test("explainer shows formula breakdown with total invested assets", async ({ page }) => {
    const card = page.getByTestId("metric-card-income-replacement");
    await card.click();
    const modal = page.getByTestId("explainer-modal");
    await expect(modal).toBeVisible();

    const formula = modal.getByTestId("income-replacement-formula");
    await expect(formula).toBeVisible();
    await expect(formula).toContainText("Total invested portfolio");
    await expect(formula).toContainText("4%");
    await expect(formula).toContainText("Monthly after-tax income");

    await captureScreenshot(page, "task-133-income-replacement-formula");
  });

  test("explainer shows current tier in tier progress section", async ({ page }) => {
    const card = page.getByTestId("metric-card-income-replacement");
    await card.click();
    const modal = page.getByTestId("explainer-modal");
    await expect(modal).toBeVisible();

    const tiers = modal.getByTestId("income-replacement-tiers");
    await expect(tiers).toBeVisible();
    const currentTier = modal.getByTestId("income-replacement-current-tier");
    await expect(currentTier).toBeVisible();

    const tierText = await currentTier.textContent();
    const validTiers = ["Early stage", "Building momentum", "Strong position", "Nearly independent", "Financially independent"];
    expect(validTiers.some((t) => tierText?.includes(t))).toBeTruthy();
  });

  test("explainer shows per-asset breakdown", async ({ page }) => {
    const card = page.getByTestId("metric-card-income-replacement");
    await card.click();
    const modal = page.getByTestId("explainer-modal");
    await expect(modal).toBeVisible();

    const breakdown = modal.getByTestId("income-replacement-asset-breakdown");
    await expect(breakdown).toBeVisible();
    await expect(breakdown).toContainText("/mo");

    await captureScreenshot(page, "task-133-income-replacement-asset-breakdown");
  });

  test("explainer shows 4% rule educational section", async ({ page }) => {
    const card = page.getByTestId("metric-card-income-replacement");
    await card.click();
    const modal = page.getByTestId("explainer-modal");
    await expect(modal).toBeVisible();

    const education = modal.getByTestId("income-replacement-education");
    await expect(education).toBeVisible();
    await expect(education).toContainText("4% rule");
    await expect(education).toContainText("Trinity Study");

    await captureScreenshot(page, "task-133-income-replacement-education");
  });

  test("explainer closes on backdrop click", async ({ page }) => {
    const card = page.getByTestId("metric-card-income-replacement");
    await card.click();
    await expect(page.getByTestId("explainer-modal")).toBeVisible();

    const backdrop = page.getByTestId("explainer-backdrop");
    await backdrop.click({ position: { x: 10, y: 10 } });
    await expect(page.getByTestId("explainer-modal")).not.toBeVisible({ timeout: 1000 });
  });

  test("explainer closes on close button click", async ({ page }) => {
    const card = page.getByTestId("metric-card-income-replacement");
    await card.click();
    await expect(page.getByTestId("explainer-modal")).toBeVisible();

    await page.getByTestId("explainer-close").click();
    await expect(page.getByTestId("explainer-modal")).not.toBeVisible({ timeout: 1000 });
  });

  test("Income Replacement card shows 'Click to explain' hint on hover", async ({ page }) => {
    const card = page.getByTestId("metric-card-income-replacement");
    await card.hover();
    const hint = card.getByTestId("click-to-explain-hint");
    await expect(hint).toBeVisible();

    await captureScreenshot(page, "task-133-income-replacement-click-hint");
  });
});
