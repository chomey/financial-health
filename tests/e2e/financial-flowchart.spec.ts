import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Financial Flowchart (Task 150)", () => {
  test.beforeEach(async ({ page }) => {
    // Prevent the mobile wizard from blocking UI interactions
    await page.addInitScript(() => {
      localStorage.setItem("fhs-wizard-done", "1");
    });
  });

  test("renders roadmap with 10 CA steps in default state", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Scroll to roadmap section
    await page.evaluate(() => {
      document.getElementById("roadmap")?.scrollIntoView({ behavior: "instant" });
    });

    const flowchart = page.locator('[data-testid="financial-flowchart"]');
    await expect(flowchart).toBeVisible();

    // Verify 10 step buttons rendered
    const stepButtons = flowchart.locator('[data-testid^="step-button-"]');
    await expect(stepButtons).toHaveCount(10);

    // Verify step 1 (Budget) is visible
    await expect(flowchart).toContainText("Budget & Essentials");

    // Verify progress bar is present
    const progressBar = flowchart.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();

    // Verify community credit is shown
    await expect(flowchart).toContainText("r/PersonalFinanceCanada");
    await expect(flowchart).toContainText("not financial advice");

    await captureScreenshot(page, "task-150-flowchart-ca-default");
  });

  test("auto-expands the current (first non-complete) step", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.evaluate(() => {
      document.getElementById("roadmap")?.scrollIntoView({ behavior: "instant" });
    });

    const flowchart = page.locator('[data-testid="financial-flowchart"]');
    await expect(flowchart).toBeVisible();

    // At least one step detail should be expanded by default
    const expandedDetails = flowchart.locator('[data-testid^="step-detail-"]');
    await expect(expandedDetails.first()).toBeVisible();
  });

  test("acknowledge checkbox marks step complete and persists in URL", async ({ page }) => {
    // Load with employer-match already acknowledged so we can test the checkbox state
    await page.goto("/?fca=ca-employer-match");
    await page.waitForLoadState("networkidle");

    const flowchart = page.locator('[data-testid="financial-flowchart"]');
    await expect(flowchart).toBeVisible();

    // URL should already have fca param
    await expect(page).toHaveURL(/fca=.*ca-employer-match/);

    // Expand the step to reveal the checkbox
    await flowchart.locator('[data-testid="step-button-ca-employer-match"]').click();
    const detailPanel = flowchart.locator('[data-testid="step-detail-ca-employer-match"]');
    await expect(detailPanel).toBeVisible();

    // Checkbox should be checked (step is pre-acknowledged)
    const ackCheckbox = flowchart.locator('[data-testid="ack-checkbox-ca-employer-match"]');
    await expect(ackCheckbox).toBeChecked();

    // Uncheck it — URL fca param should clear
    await ackCheckbox.click();
    await expect(ackCheckbox).not.toBeChecked();
    const urlAfterUncheck = page.url();
    expect(urlAfterUncheck).not.toMatch(/fca=.*ca-employer-match/);

    // Re-check — URL fca param should return
    await ackCheckbox.click();
    await expect(ackCheckbox).toBeChecked();
    await expect(page).toHaveURL(/fca=.*ca-employer-match/);
  });

  test("skip checkbox marks step as N/A and persists in URL", async ({ page }) => {
    // Load with employer-match already skipped so we can test the skip state
    await page.goto("/?fcs=ca-employer-match");
    await page.waitForLoadState("networkidle");

    const flowchart = page.locator('[data-testid="financial-flowchart"]');
    await expect(flowchart).toBeVisible();

    // URL should already have fcs param
    await expect(page).toHaveURL(/fcs=.*ca-employer-match/);

    // Step title should show N/A badge (step is skipped = complete)
    const stepTitle = flowchart.locator('[data-testid="step-button-ca-employer-match"]');
    await expect(stepTitle).toContainText("N/A");

    // Expand to see the skip checkbox
    await stepTitle.click();
    const detailPanel = flowchart.locator('[data-testid="step-detail-ca-employer-match"]');
    await expect(detailPanel).toBeVisible();

    // Skip checkbox should be checked
    const skipCheckbox = flowchart.locator('[data-testid="skip-checkbox-ca-employer-match"]');
    await expect(skipCheckbox).toBeChecked();

    // Uncheck skip — URL fcs param should clear
    await skipCheckbox.click();
    await expect(skipCheckbox).not.toBeChecked();
    const urlAfterUncheck = page.url();
    expect(urlAfterUncheck).not.toMatch(/fcs=.*ca-employer-match/);
  });

  test("undo button reverts acknowledge and clears URL param", async ({ page }) => {
    // Start with an acknowledged step in URL
    await page.goto("/?fca=ca-employer-match");
    await page.waitForLoadState("networkidle");

    await page.evaluate(() => {
      document.getElementById("roadmap")?.scrollIntoView({ behavior: "instant" });
    });

    const flowchart = page.locator('[data-testid="financial-flowchart"]');

    // Expand the step
    await flowchart.locator('[data-testid="step-button-ca-employer-match"]').click();

    const detailPanel = flowchart.locator('[data-testid="step-detail-ca-employer-match"]');
    await expect(detailPanel).toBeVisible();

    // Undo button should be visible since step is acknowledged
    const undoButton = flowchart.locator('[data-testid="undo-button-ca-employer-match"]');
    await expect(undoButton).toBeVisible();

    // Click undo
    await undoButton.click();

    // URL should no longer contain fca param for this step
    const url = page.url();
    expect(url).not.toMatch(/fca=.*ca-employer-match/);

    // Checkbox should be unchecked
    const ackCheckbox = flowchart.locator('[data-testid="ack-checkbox-ca-employer-match"]');
    await expect(ackCheckbox).not.toBeChecked();
  });

  test("roadmap nav link scrolls to roadmap section", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click the Roadmap nav link
    await page.locator("nav button", { hasText: "Roadmap" }).click();

    // Flowchart should become visible in viewport
    const flowchart = page.locator('[data-testid="financial-flowchart"]');
    await expect(flowchart).toBeInViewport({ ratio: 0.1 });

    await captureScreenshot(page, "task-150-flowchart-after-nav");
  });
});
