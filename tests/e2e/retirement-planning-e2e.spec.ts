import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

/**
 * Task 195: Comprehensive E2E tests for retirement planning features (tasks 186-194).
 * Full user journey through retirement planning configuration and dashboard display.
 */

test.describe("Retirement Planning - Comprehensive E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("fhs-wizard-done", "1");
      localStorage.setItem("fhs-default-mode", "advanced");
      localStorage.setItem("fhs-visited", "1");
    });
  });

  // ── Task 186: Retirement age ───────────────────────────────────────────────

  test("retirement age defaults to 65 and persists in URL", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');

    const input = page.getByTestId("wizard-retirement-age-input");
    await expect(input).toHaveValue("65");

    // Change to 60
    await input.fill("60");
    await page.waitForTimeout(500);
    const url = page.url();

    // Reload — should persist
    const params = new URL(url);
    params.searchParams.set("step", "profile");
    await page.goto(params.toString());
    await page.waitForSelector('[data-testid="wizard-retirement-age-input"]', { timeout: 15000 });
    await expect(page.getByTestId("wizard-retirement-age-input")).toHaveValue("60");
  });

  // ── Task 187: CA government income (CPP/OAS) ──────────────────────────────

  test("CA: CPP and OAS presets work and persist", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');

    // Select CPP max
    await page.getByTestId("cpp-preset-max").click();
    await expect(page.getByTestId("gov-income-summary")).toBeVisible();

    // Select OAS full
    await page.getByTestId("oas-preset-full").click();
    const summary = page.getByTestId("gov-income-summary");
    await expect(summary).toContainText("CPP");
    await expect(summary).toContainText("OAS");

    // Persist check
    await page.waitForTimeout(500);
    const url = page.url();
    await page.goto(url);
    await page.waitForSelector('[data-testid="gov-income-summary"]');
    await expect(page.getByTestId("gov-income-summary")).toBeVisible();

    await captureScreenshot(page, "task-195-ca-cpp-oas");
  });

  test("CA: CPP custom amount works", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');

    await page.getByTestId("cpp-preset-custom").click();
    const customInput = page.getByTestId("cpp-custom-input");
    await expect(customInput).toBeVisible();
    await customInput.fill("900");
    await expect(page.getByTestId("gov-income-summary")).toBeVisible();
  });

  // ── Task 188: US government income (Social Security) ───────────────────────

  test("US: Social Security presets render correctly", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(300);

    // All 6 presets should be visible
    for (const preset of ["none", "average", "max-62", "max-67", "max-70", "custom"]) {
      await expect(page.getByTestId(`ss-preset-${preset}`)).toBeVisible();
    }

    // Select max at 67
    await page.getByTestId("ss-preset-max-67").click();
    await expect(page.getByTestId("gov-income-summary")).toBeVisible();

    await captureScreenshot(page, "task-195-us-social-security");
  });

  // ── Task 189: AU government income (Age Pension) ───────────────────────────

  test("AU: Age Pension single/couple presets work", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');
    await page.getByTestId("country-au").click();
    await page.waitForTimeout(300);

    // Select full single
    await page.getByTestId("ap-preset-full-single").click();
    const summary = page.getByTestId("gov-income-summary");
    await expect(summary).toContainText("fortnightly");

    // Switch to couple
    await page.getByTestId("ap-preset-full-couple").click();
    await expect(summary).toBeVisible();

    await captureScreenshot(page, "task-195-au-age-pension");
  });

  // ── Task 190: Retirement income waterfall chart ────────────────────────────

  test("retirement income chart shows on dashboard with government income", async ({ page }) => {
    // Set up CA with CPP + OAS
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');
    await page.getByTestId("cpp-preset-average").click();
    await page.getByTestId("oas-preset-full").click();
    await page.waitForTimeout(500);

    // Go to dashboard
    const params = new URL(page.url());
    params.searchParams.delete("step");
    await page.goto(params.toString());
    await page.waitForSelector('[data-testid="retirement-income-chart"]', { timeout: 15000 });

    const chart = page.getByTestId("retirement-income-chart");
    await expect(chart).toContainText("CPP + OAS");
    await expect(chart).toContainText("Portfolio (4% rule)");
    await expect(page.getByTestId("coverage-summary")).toBeVisible();

    await captureScreenshot(page, "task-195-retirement-chart");
  });

  // ── Task 191: Early withdrawal penalties ───────────────────────────────────

  test("early withdrawal penalties shown for young user", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');
    await page.getByTestId("wizard-age-input").fill("40");
    await page.waitForTimeout(500);

    const params = new URL(page.url());
    params.searchParams.delete("step");
    await page.goto(params.toString());
    await page.waitForSelector('[data-testid="withdrawal-tax-summary"]', { timeout: 15000 });

    // RRSP penalty warning at age 40
    await expect(page.getByTestId("early-withdrawal-penalties")).toBeVisible();

    await captureScreenshot(page, "task-195-early-penalties");
  });

  test("no penalties for user over 65", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');
    await page.getByTestId("wizard-age-input").fill("70");
    await page.waitForTimeout(500);

    const params = new URL(page.url());
    params.searchParams.delete("step");
    await page.goto(params.toString());
    await page.waitForSelector('[data-testid="withdrawal-tax-summary"]', { timeout: 15000 });

    await expect(page.getByTestId("early-withdrawal-penalties")).not.toBeVisible();
  });

  // ── Task 193: Retirement readiness score ───────────────────────────────────

  test("retirement readiness score displayed with all components", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="retirement-readiness-score"]', { timeout: 15000 });

    const card = page.getByTestId("retirement-readiness-score");
    await expect(card).toContainText("Retirement Readiness");
    await expect(page.getByTestId("readiness-score-value")).toBeVisible();
    await expect(page.getByTestId("readiness-tier")).toBeVisible();

    // All 5 components
    for (const label of ["Income Replacement", "Emergency Runway", "Government Benefits", "Debt Position", "Tax Diversification"]) {
      await expect(card).toContainText(label);
    }

    await captureScreenshot(page, "task-195-readiness-score");
  });

  // ── Task 194: Income gap analysis ──────────────────────────────────────────

  test("retirement income coverage shown in chart", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="retirement-income-chart"]', { timeout: 15000 });

    const coverage = page.getByTestId("coverage-summary");
    await expect(coverage).toBeVisible();
    // Should show a percentage
    const text = await coverage.textContent();
    expect(text).toMatch(/\d+%/);
  });

  // ── Cross-country switching ────────────────────────────────────────────────

  test("switching country changes government income form", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');

    // CA: should see CPP/OAS
    await expect(page.getByTestId("cpp-preset-none")).toBeVisible();
    await expect(page.getByTestId("oas-preset-none")).toBeVisible();

    // Switch to US: should see SS
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(300);
    await expect(page.getByTestId("ss-preset-none")).toBeVisible();
    await expect(page.getByTestId("cpp-preset-none")).not.toBeVisible();

    // Switch to AU: should see Age Pension
    await page.getByTestId("country-au").click();
    await page.waitForTimeout(300);
    await expect(page.getByTestId("ap-preset-none")).toBeVisible();
    await expect(page.getByTestId("ss-preset-none")).not.toBeVisible();
  });

  // ── Full journey: configure retirement → view dashboard ────────────────────

  test("full retirement planning journey: profile → dashboard", async ({ page }) => {
    // 1. Set profile
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');

    await page.getByTestId("wizard-age-input").fill("55");
    await page.getByTestId("wizard-retirement-age-input").fill("62");
    await page.getByTestId("cpp-preset-average").click();
    await page.getByTestId("oas-preset-full").click();
    await page.waitForTimeout(500);

    // 2. Navigate to dashboard
    const params = new URL(page.url());
    params.searchParams.delete("step");
    await page.goto(params.toString());
    await page.waitForSelector('[data-testid="dashboard-panel"]', { timeout: 15000 });

    // 3. Verify retirement features visible
    await expect(page.getByTestId("retirement-income-chart")).toBeVisible();
    await expect(page.getByTestId("withdrawal-tax-summary")).toBeVisible();
    await expect(page.getByTestId("retirement-readiness-score")).toBeVisible();

    // 4. RRSP penalty at age 55
    await expect(page.getByTestId("early-withdrawal-penalties")).toBeVisible();

    await captureScreenshot(page, "task-195-full-journey");
  });
});
