import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Early Withdrawal Penalties", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("fhs-wizard-done", "1");
      localStorage.setItem("fhs-default-mode", "advanced");
      localStorage.setItem("fhs-visited", "1");
    });
  });

  test("shows penalty warnings for young CA user with RRSP", async ({ page }) => {
    // Default CA state has RRSP — set age to 40 and check for RRSP warning
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');
    const ageInput = page.getByTestId("wizard-age-input");
    await ageInput.fill("40");
    await page.waitForTimeout(500);

    // Navigate to dashboard
    const params = new URL(page.url());
    params.searchParams.delete("step");
    await page.goto(params.toString());
    await page.waitForSelector('[data-testid="dashboard-panel"]', { timeout: 15000 });

    // WithdrawalTaxSummary should be visible with penalty warnings for RRSP
    const summary = page.getByTestId("withdrawal-tax-summary");
    await expect(summary).toBeVisible();

    const penalties = page.getByTestId("early-withdrawal-penalties");
    await expect(penalties).toBeVisible();
    await expect(penalties).toContainText("RRSP");

    await captureScreenshot(page, "task-191-early-withdrawal-ca-40");
  });

  test("no penalty warnings for user over 65 (CA)", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');
    const ageInput = page.getByTestId("wizard-age-input");
    await ageInput.fill("70");
    await page.waitForTimeout(500);

    const params = new URL(page.url());
    params.searchParams.delete("step");
    await page.goto(params.toString());
    await page.waitForSelector('[data-testid="dashboard-panel"]', { timeout: 15000 });

    // Should have withdrawal tax summary but no penalty section
    const penalties = page.getByTestId("early-withdrawal-penalties");
    await expect(penalties).not.toBeVisible();

    await captureScreenshot(page, "task-191-no-penalties-ca-70");
  });
});
