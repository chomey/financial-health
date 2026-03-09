import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Financial Flowchart (Task 150)", () => {
  test("renders roadmap with 10 CA steps in default state", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Scroll to roadmap section
    await page.evaluate(() => {
      document.getElementById("section-dash-roadmap")?.scrollIntoView({ behavior: "instant" });
    });

    const flowchart = page.locator('[data-testid="financial-flowchart"]');
    await expect(flowchart).toBeVisible();

    // Verify 10 step elements rendered
    const steps = flowchart.locator('[data-testid^="flowchart-step-"]');
    await expect(steps).toHaveCount(10);

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

  test("clicking a step opens its detail modal", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await page.evaluate(() => {
      document.getElementById("section-dash-roadmap")?.scrollIntoView({ behavior: "instant" });
    });

    const flowchart = page.locator('[data-testid="financial-flowchart"]');
    await expect(flowchart).toBeVisible();

    // Click the first step to open its modal
    await flowchart.locator('[data-testid^="flowchart-step-"]').first().click();

    // Modal is portaled to body, so look on page level
    const modal = page.locator('[data-testid^="step-modal-"]');
    await expect(modal.first()).toBeVisible();
    const detail = page.locator('[data-testid^="step-detail-"]');
    await expect(detail.first()).toBeVisible();
  });

  test("acknowledge checkbox marks step complete and persists across reload", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const flowchart = page.locator('[data-testid="financial-flowchart"]');
    await flowchart.scrollIntoViewIfNeeded();
    await expect(flowchart).toBeVisible();

    // Click the employer-match step to open its modal
    await flowchart.locator('[data-testid="flowchart-step-ca-employer-match"]').click();
    const modal = page.locator('[data-testid="step-modal-ca-employer-match"]');
    await expect(modal).toBeVisible();

    // Checkbox should be unchecked initially
    const ackCheckbox = page.locator('[data-testid="ack-checkbox-ca-employer-match"]');
    await expect(ackCheckbox).not.toBeChecked();

    // Check it
    await ackCheckbox.click();
    await expect(ackCheckbox).toBeChecked();

    // Reload with the same URL to verify persistence in s= param
    const urlWithState = page.url();
    await page.goto(urlWithState);
    await page.waitForLoadState("networkidle");

    // Re-open the modal and verify checkbox is still checked
    const flowchart2 = page.locator('[data-testid="financial-flowchart"]');
    await flowchart2.scrollIntoViewIfNeeded();
    await flowchart2.locator('[data-testid="flowchart-step-ca-employer-match"]').click();
    await expect(page.locator('[data-testid="step-modal-ca-employer-match"]')).toBeVisible();
    await expect(page.locator('[data-testid="ack-checkbox-ca-employer-match"]')).toBeChecked();
  });

  test("skip checkbox marks step as N/A and persists across reload", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const flowchart = page.locator('[data-testid="financial-flowchart"]');
    await flowchart.scrollIntoViewIfNeeded();
    await expect(flowchart).toBeVisible();

    // Click the employer-match step to open its modal
    await flowchart.locator('[data-testid="flowchart-step-ca-employer-match"]').click();
    const modal = page.locator('[data-testid="step-modal-ca-employer-match"]');
    await expect(modal).toBeVisible();

    // Skip checkbox should be unchecked initially
    const skipCheckbox = page.locator('[data-testid="skip-checkbox-ca-employer-match"]');
    await expect(skipCheckbox).not.toBeChecked();

    // Check skip
    await skipCheckbox.click();
    await expect(skipCheckbox).toBeChecked();

    // Reload with the same URL to verify persistence in s= param
    const urlWithState = page.url();
    await page.goto(urlWithState);
    await page.waitForLoadState("networkidle");

    // Re-open the modal and verify skip checkbox is still checked
    const flowchart2 = page.locator('[data-testid="financial-flowchart"]');
    await flowchart2.scrollIntoViewIfNeeded();
    await flowchart2.locator('[data-testid="flowchart-step-ca-employer-match"]').click();
    await expect(page.locator('[data-testid="step-modal-ca-employer-match"]')).toBeVisible();
    await expect(page.locator('[data-testid="skip-checkbox-ca-employer-match"]')).toBeChecked();
  });

  test("undo button reverts acknowledge and clears URL param", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const flowchart = page.locator('[data-testid="financial-flowchart"]');
    await flowchart.scrollIntoViewIfNeeded();
    await expect(flowchart).toBeVisible();

    // Click the employer-match step to open its modal
    await flowchart.locator('[data-testid="flowchart-step-ca-employer-match"]').click();
    const modal = page.locator('[data-testid="step-modal-ca-employer-match"]');
    await expect(modal).toBeVisible();

    // Acknowledge the step first
    const ackCheckbox = page.locator('[data-testid="ack-checkbox-ca-employer-match"]');
    await ackCheckbox.click();
    await expect(ackCheckbox).toBeChecked();

    // Undo button should be visible since step is acknowledged
    const undoButton = page.locator('[data-testid="undo-button-ca-employer-match"]');
    await expect(undoButton).toBeVisible();

    // Click undo
    await undoButton.click();

    // URL should no longer contain fca param for this step
    const url = page.url();
    expect(url).not.toMatch(/fca=.*ca-employer-match/);

    // Checkbox should be unchecked
    await expect(ackCheckbox).not.toBeChecked();
  });

  test("roadmap nav link scrolls to roadmap section", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click the Money Steps nav link
    const stepsButton = page.locator("nav button", { hasText: /Steps|Roadmap/ });
    await stepsButton.click();

    // Flowchart should become visible in viewport
    const flowchart = page.locator('[data-testid="financial-flowchart"]');
    await expect(flowchart).toBeInViewport({ ratio: 0.1 });

    await captureScreenshot(page, "task-150-flowchart-after-nav");
  });
});
