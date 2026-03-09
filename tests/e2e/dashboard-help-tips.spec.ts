import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

// Navigate directly to the dashboard phase
async function goToDashboard(page: import("@playwright/test").Page) {
  await page.goto("/?step=dashboard");
  await page.waitForSelector("[data-testid='snapshot-dashboard']", { timeout: 30000 });
  await page.waitForTimeout(500);
}

test.describe("Dashboard HelpTip contextual help (Task 170)", () => {
  test.setTimeout(60000);

  test("metric cards show help tip buttons for key cards", async ({ page }) => {
    await goToDashboard(page);

    // Metric cards with helpText should show help tip buttons
    const helpButtons = await page.locator("[data-testid='snapshot-dashboard'] [data-testid='help-tip-button']").all();
    // Net Worth, Monthly Cash Flow, Financial Runway all have helpText in MOCK_METRICS
    expect(helpButtons.length).toBeGreaterThanOrEqual(1);

    await captureScreenshot(page, "task-170-dashboard-metric-cards");
  });

  test("clicking a metric card help tip shows popover", async ({ page }) => {
    await goToDashboard(page);

    const firstHelpBtn = page.locator("[data-testid='snapshot-dashboard'] [data-testid='help-tip-button']").first();
    await expect(firstHelpBtn).toBeVisible();
    await firstHelpBtn.click();

    const popover = page.locator("[data-testid='help-tip-popover']").first();
    await expect(popover).toBeVisible();

    await captureScreenshot(page, "task-170-dashboard-help-tip-open");
  });

  test("Financial Projection section has a help tip button", async ({ page }) => {
    await goToDashboard(page);

    const projectionSection = page.locator("[data-testid='projection-chart']");
    await expect(projectionSection).toBeVisible();
    const helpButtons = projectionSection.locator("[data-testid='help-tip-button']");
    await expect(helpButtons.first()).toBeVisible();

    await captureScreenshot(page, "task-170-projection-chart-help-tip");
  });

  test("Money Steps section has a help tip button", async ({ page }) => {
    await goToDashboard(page);

    const flowchartSection = page.locator("[data-testid='financial-flowchart']");
    await expect(flowchartSection).toBeVisible();
    const helpButtons = flowchartSection.locator("[data-testid='help-tip-button']");
    await expect(helpButtons.first()).toBeVisible();

    await captureScreenshot(page, "task-170-money-steps-help-tip");
  });

  test("Net Worth card has help tip with correct content", async ({ page }) => {
    await goToDashboard(page);

    // Find the Net Worth metric card
    const netWorthCard = page.locator("[data-testid='metric-card-net-worth']");
    await expect(netWorthCard).toBeVisible();

    const helpBtn = netWorthCard.locator("[data-testid='help-tip-button']");
    await expect(helpBtn).toBeVisible();
    await helpBtn.click();

    const popover = page.locator("[data-testid='help-tip-popover']").first();
    await expect(popover).toBeVisible();
    // Should mention assets/debts
    const text = await popover.textContent();
    expect(text).toMatch(/assets|debts/i);

    await captureScreenshot(page, "task-170-net-worth-help-tip");
  });
});
