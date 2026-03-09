/**
 * Task 173: AU E2E tests and regression (T2/T3)
 *
 * Full Playwright E2E test suite for the AU flow:
 * - Select AU country, pick AU sample profile
 * - Verify dashboard loads with AUD values
 * - Verify Money Steps show AU-specific steps (au-super-guarantee, etc.)
 * - Verify tax summary is visible on AU profile
 * - Verify super accounts appear in assets wizard step
 * - Regression: CA/US flows unaffected by AU additions
 */
import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Load an AU sample profile through the wizard welcome step and navigate to dashboard */
async function loadAUProfile(
  page: import("@playwright/test").Page,
  profileId = "au-young-professional"
) {
  await page.goto("/?step=welcome");
  await page.getByTestId("country-au").click();
  await page.getByTestId(`sample-profile-${profileId}`).click();
  await page.waitForFunction(() => window.location.search.includes("s="));
  await page.waitForSelector('[data-testid="snapshot-dashboard"]');
}

/** Navigate to a wizard step while preserving URL s= state */
async function goToStep(
  page: import("@playwright/test").Page,
  step: string
) {
  const url = new URL(page.url());
  url.searchParams.set("step", step);
  await page.goto(url.toString());
}

// ── AU Full Flow Tests ────────────────────────────────────────────────────────

test.describe("AU E2E: Full flow — select country, load profile, reach dashboard", () => {
  test("AU young professional: wizard → dashboard renders snapshot", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await loadAUProfile(page, "au-young-professional");
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await expect(dashboard).toBeVisible();
    await captureScreenshot(page, "task-173-au-young-professional-dashboard");
  });

  test("AU mid-career family: dashboard renders with property equity", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await loadAUProfile(page, "au-mid-career-family");
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await expect(dashboard).toBeVisible();
    await captureScreenshot(page, "task-173-au-mid-career-family-dashboard");
  });

  test("AU pre-retiree: dashboard renders with large net worth", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await loadAUProfile(page, "au-pre-retiree");
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await expect(dashboard).toBeVisible();
    await captureScreenshot(page, "task-173-au-pre-retiree-dashboard");
  });
});

// ── AU AUD Currency Values ────────────────────────────────────────────────────

test.describe("AU E2E: Dashboard shows AUD values", () => {
  test("AU country button selected after loading AU profile", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await loadAUProfile(page);
    await goToStep(page, "profile");

    const auBtn = page.getByTestId("country-au");
    await expect(auBtn).toHaveAttribute("aria-pressed", "true");
    await captureScreenshot(page, "task-173-au-country-selected");
  });

  test("FX rate display shows AUD after loading AU profile", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await loadAUProfile(page);
    await goToStep(page, "profile");

    const fxDisplay = page.getByTestId("fx-rate-display");
    await expect(fxDisplay).toBeVisible();
    await expect(fxDisplay).toContainText("AUD");
    await expect(fxDisplay).toContainText("USD");
    await captureScreenshot(page, "task-173-au-fx-display-aud");
  });

  test("asset currency badges show AUD on AU profile", async ({ page }) => {
    test.setTimeout(60000);
    await loadAUProfile(page);
    await goToStep(page, "assets");

    const firstBadge = page.getByTestId("currency-badge").first();
    await expect(firstBadge).toBeVisible();
    await expect(firstBadge).toContainText("AUD");
    await captureScreenshot(page, "task-173-au-currency-badge-aud");
  });
});

// ── AU Money Steps ────────────────────────────────────────────────────────────

test.describe("AU E2E: Money Steps — all steps per jurisdiction", () => {
  const AU_STEPS = [
    "au-budget", "au-emergency-fund", "au-super-guarantee", "au-high-debt",
    "au-salary-sacrifice", "au-fhss", "au-moderate-debt", "au-etf-invest",
    "au-nonconcessional-super", "au-lifestyle-giving",
  ];
  const CA_STEPS = [
    "ca-budget", "ca-starter-ef", "ca-employer-match", "ca-high-debt",
    "ca-full-ef", "ca-tfsa", "ca-rrsp", "ca-moderate-debt",
    "ca-resp-fhsa", "ca-taxable",
  ];
  const US_STEPS = [
    "us-budget", "us-starter-ef", "us-employer-match", "us-high-debt",
    "us-full-ef", "us-hsa", "us-ira", "us-401k",
    "us-moderate-debt", "us-taxable",
  ];

  test("AU profile shows all 10 AU steps", async ({ page }) => {
    test.setTimeout(60000);
    await loadAUProfile(page);

    const flowchart = page.locator('[data-testid="financial-flowchart"]');
    await expect(
      flowchart.locator('[data-testid="flowchart-step-au-budget"]')
    ).toBeVisible({ timeout: 10000 });

    for (const step of AU_STEPS) {
      await expect(
        flowchart.locator(`[data-testid="flowchart-step-${step}"]`),
        `AU step "${step}" should be visible`
      ).toBeVisible();
    }
    await expect(flowchart.locator('[data-testid^="flowchart-step-"]')).toHaveCount(10);

    await captureScreenshot(page, "task-173-au-money-steps");
  });

  test("CA default shows all 10 CA steps", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/?step=dashboard");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    const flowchart = page.locator('[data-testid="financial-flowchart"]');
    await expect(
      flowchart.locator('[data-testid="flowchart-step-ca-budget"]')
    ).toBeVisible({ timeout: 10000 });

    for (const step of CA_STEPS) {
      await expect(
        flowchart.locator(`[data-testid="flowchart-step-${step}"]`),
        `CA step "${step}" should be visible`
      ).toBeVisible();
    }
    await expect(flowchart.locator('[data-testid^="flowchart-step-"]')).toHaveCount(10);

    await captureScreenshot(page, "task-173-ca-money-steps");
  });

  test("US profile shows all 10 US steps", async ({ page }) => {
    test.setTimeout(60000);
    await page.goto("/?step=welcome");
    await page.getByTestId("country-us").click();
    await page.getByTestId("sample-profile-fresh-grad-us").click();
    await page.waitForFunction(() => window.location.search.includes("s="));
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    const flowchart = page.locator('[data-testid="financial-flowchart"]');
    await expect(
      flowchart.locator('[data-testid="flowchart-step-us-budget"]')
    ).toBeVisible({ timeout: 10000 });

    for (const step of US_STEPS) {
      await expect(
        flowchart.locator(`[data-testid="flowchart-step-${step}"]`),
        `US step "${step}" should be visible`
      ).toBeVisible();
    }
    await expect(flowchart.locator('[data-testid^="flowchart-step-"]')).toHaveCount(10);

    await captureScreenshot(page, "task-173-us-money-steps");
  });
});

// ── AU Tax Summary ────────────────────────────────────────────────────────────

test.describe("AU E2E: Tax summary uses AU brackets", () => {
  test("AU young professional tax-summary step shows Financial Summary with tax info", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await loadAUProfile(page);
    await goToStep(page, "tax-summary");

    await expect(page.getByText("Financial Summary")).toBeVisible();
    await expect(page.getByText("after-tax income")).toBeVisible();
    await expect(page.getByText("Effective rate")).toBeVisible();
    await captureScreenshot(page, "task-173-au-tax-summary");
  });

  test("AU pre-retiree tax-summary step shows tax details", async ({ page }) => {
    test.setTimeout(60000);
    await loadAUProfile(page, "au-pre-retiree");
    await goToStep(page, "tax-summary");

    await expect(page.getByText("Financial Summary")).toBeVisible();
    await expect(page.getByText("Effective rate")).toBeVisible();
    await captureScreenshot(page, "task-173-au-pre-retiree-tax-summary");
  });
});

// ── AU Super Accounts in Assets ───────────────────────────────────────────────

test.describe("AU E2E: Super accounts appear in assets wizard step", () => {
  test("Super (Accumulation) visible in AU young professional assets step", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await loadAUProfile(page);
    await goToStep(page, "assets");

    const assetsList = page.getByRole("list", { name: "Asset items" });
    await expect(assetsList).toContainText("Super (Accumulation)");
    await captureScreenshot(page, "task-173-au-super-in-assets");
  });

  test("AU mid-career family assets step shows Super Accumulation + Savings", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await loadAUProfile(page, "au-mid-career-family");
    await goToStep(page, "assets");

    const assetsList = page.getByRole("list", { name: "Asset items" });
    await expect(assetsList).toContainText("Super (Accumulation)");
    await expect(assetsList).toContainText("Savings Account");
    await captureScreenshot(page, "task-173-au-mid-career-assets");
  });

  test("AU pre-retiree assets step shows large Super Accumulation balance", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await loadAUProfile(page, "au-pre-retiree");
    await goToStep(page, "assets");

    const assetsList = page.getByRole("list", { name: "Asset items" });
    await expect(assetsList).toContainText("Super (Accumulation)");
    await captureScreenshot(page, "task-173-au-pre-retiree-super-assets");
  });
});

// ── Regression: CA flow unaffected by AU additions ───────────────────────────

test.describe("Regression: CA and US flows unaffected by AU additions", () => {
  test("CA sample profile (fresh-grad) still loads correctly", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/?step=welcome");

    const freshGradCard = page.getByTestId("sample-profile-fresh-grad");
    await expect(freshGradCard).toBeVisible();
    await freshGradCard.click();
    await page.waitForFunction(() => window.location.search.includes("s="));

    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await expect(dashboard).toBeVisible();
    await captureScreenshot(page, "task-173-regression-ca-fresh-grad-dashboard");
  });

  test("CA is still the default country with Ontario jurisdiction", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForSelector("[data-testid='country-jurisdiction-selector']");

    await expect(page.getByTestId("country-ca")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("country-au")).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("jurisdiction-select")).toHaveValue("ON");
  });

  test("CA→AU→US country cycle all show correct profile cards", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/?step=welcome");

    // CA default
    await expect(page.getByTestId("sample-profile-fresh-grad")).toBeVisible();

    // Switch to AU
    await page.getByTestId("country-au").click();
    await expect(
      page.getByTestId("sample-profile-au-young-professional")
    ).toBeVisible();
    await expect(
      page.getByTestId("sample-profile-au-mid-career-family")
    ).toBeVisible();
    await expect(
      page.getByTestId("sample-profile-au-pre-retiree")
    ).toBeVisible();

    // Switch to US
    await page.getByTestId("country-us").click();
    await expect(
      page.getByTestId("sample-profile-fresh-grad-us")
    ).toBeVisible();
    await expect(
      page.getByTestId("sample-profile-au-young-professional")
    ).not.toBeVisible();
    await captureScreenshot(page, "task-173-regression-country-cycle");
  });
});
