import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Retirement Readiness Score", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("fhs-wizard-done", "1");
      localStorage.setItem("fhs-default-mode", "advanced");
      localStorage.setItem("fhs-visited", "1");
    });
  });

  test("shows retirement readiness score on dashboard", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="dashboard-panel"]', { timeout: 15000 });

    const scoreCard = page.getByTestId("retirement-readiness-score");
    await expect(scoreCard).toBeVisible();
    await expect(scoreCard).toContainText("Retirement Readiness");

    // Score value should be a number
    const scoreValue = page.getByTestId("readiness-score-value");
    await expect(scoreValue).toBeVisible();
    const text = await scoreValue.textContent();
    expect(parseInt(text ?? "0")).toBeGreaterThanOrEqual(0);

    // Tier label should be visible
    const tier = page.getByTestId("readiness-tier");
    await expect(tier).toBeVisible();

    await captureScreenshot(page, "task-193-retirement-readiness");
  });

  test("shows component breakdowns", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="retirement-readiness-score"]', { timeout: 15000 });

    const card = page.getByTestId("retirement-readiness-score");
    // Should contain all 5 component labels
    await expect(card).toContainText("Income Replacement");
    await expect(card).toContainText("Emergency Runway");
    await expect(card).toContainText("Government Benefits");
    await expect(card).toContainText("Debt Position");
    await expect(card).toContainText("Tax Diversification");
  });
});
