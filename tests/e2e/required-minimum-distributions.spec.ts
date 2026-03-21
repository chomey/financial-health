import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Required Minimum Distributions", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("fhs-wizard-done", "1");
      localStorage.setItem("fhs-default-mode", "advanced");
      localStorage.setItem("fhs-visited", "1");
    });
  });

  test("withdrawal tax summary shows for CA user age 75 with RRSP", async ({ page }) => {
    // Set age to 75 via wizard
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');
    const ageInput = page.getByTestId("wizard-age-input");
    await ageInput.fill("75");
    await page.waitForTimeout(500);

    // Navigate to dashboard
    const params = new URL(page.url());
    params.searchParams.delete("step");
    await page.goto(params.toString());
    await page.waitForSelector('[data-testid="dashboard-panel"]', { timeout: 15000 });

    // Withdrawal tax summary should be visible (shows account breakdown)
    const summary = page.getByTestId("withdrawal-tax-summary");
    await expect(summary).toBeVisible();
    // At age 75, no early withdrawal penalties (past RRIF age)
    const penalties = page.getByTestId("early-withdrawal-penalties");
    await expect(penalties).not.toBeVisible();

    await captureScreenshot(page, "task-192-rmd-ca-75");
  });

  test("no RMD insight for young CA user age 40", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');
    const ageInput = page.getByTestId("wizard-age-input");
    await ageInput.fill("40");
    await page.waitForTimeout(500);

    const params = new URL(page.url());
    params.searchParams.delete("step");
    await page.goto(params.toString());
    await page.waitForSelector('[data-testid="dashboard-panel"]', { timeout: 15000 });

    const insightsSection = page.locator('[aria-label="Financial insights"]');
    // Young user should not see any RMD/RRIF text
    await expect(insightsSection).not.toContainText("RRIF minimum");
    await expect(insightsSection).not.toContainText("RMD");

    await captureScreenshot(page, "task-192-no-rmd-ca-40");
  });
});
