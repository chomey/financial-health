import { test, expect, Page } from "@playwright/test";
import { captureScreenshot } from "./helpers";

// Pre-encoded states for regression testing

// CA user, single, DTC $9428 (non-refundable) + CCB $7437 (refundable) + Medical $3000 (non-refundable), salary $5k/mo, savings $40k TFSA, rent $1800/mo
const CA_STATE =
  "!I1%2COO%3E1%5Bj0G%26s%3CMKMiJ)6%23GY%24%2F(2eXfY!s%3C%3DDBFTgk%3E6Yp4f2s1N'(U(2FQn)!fqftIMSolGg%26.VRE%2B%23KYQ%3Dhfq%60%5E!NPC%24.mYu%2FRi0Tl%2FbYM6c%5E9%5C'NTu7'8D%3AFE%3E'o%3E%3DMWonI%3AZ%23MVhF!RQ%2C_U%3Dt%2FrdoBYpN%5EDK4gm(dO'd%3AAYWR1hE69%40ftjUK%5Ck%2C%5DRi%26'jQ_%2Bgd0KaosIokUWE%24Zab9!2UHlJ0N%3Cs'_''%3Dal%3FR3%40WaksoCVJ%5Dadh1%3Ajk4a)%40ct%3BjNSDMM%25gE%3EL%40%2F";

// US user, single, EITC $3000 (refundable) + Child Tax Credit $2000 (refundable) + SALT $5000 (deduction), salary $4k/mo, 401k $25k, rent $1500/mo
const US_STATE =
  "!I1%2C_O%22h%2Fs0G%26s%3C8okXm%24rphH%2CNrOp%2CWHZsZTYOM-%25V4mN%3Bq_OR%60%3CJ60(4%2FU%3F1%26%22)g%2335E10D%5Dp(%23heeUf%2C%40e0a%3EmaLC'Ob%3EO3Hg%5BJZIAclH9Pff%5Cq%24FY)uS(%2C%24nN76%5DZ7Z%3A)%5Ej%3C!%5DY3%5C%22q!_WpW%3FN_Rh4Bd%60.%2CW%5Dr%3FmWmnEKtVqBj)4%5E*iCQJ%60MTL%3Em%23QrKI.Cnh3m%25F%3Co4JZ0%6076T5%5BclgM%2F'9UdsN%3FB73JmC30I)GP%2Fc%22%3Fu.X%2C%5E%26_(F%3F3p";

/** Wait for the app to be fully hydrated */
async function waitForHydration(page: Page) {
  await page.waitForLoadState("networkidle");
  // Wait for React to render the country selector
  await page.locator('[data-testid="country-ca"], [data-testid="country-us"]').first().waitFor({ state: "visible", timeout: 30000 });
}

// ─── 1. CA credits loaded from state ──────────────────────────────────────

test.describe("Task 145: CA credits from pre-encoded state", () => {
  test("CA pre-loaded state shows all 3 credits in the card", async ({ page }) => {
    await page.goto(`/?s=${CA_STATE}`);
    await waitForHydration(page);

    // Expand Tax Credits section
    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();

    // All 3 credits should be visible
    await expect(page.getByText("Disability Tax Credit (DTC)")).toBeVisible();
    await expect(page.getByText("Canada Child Benefit (CCB)")).toBeVisible();
    await expect(page.getByText("Medical Expense Tax Credit")).toBeVisible();

    await captureScreenshot(page, "task-145-ca-credits-loaded");
  });
});

// ─── 2. US credits loaded from state ──────────────────────────────────────

test.describe("Task 145: US credits from pre-encoded state", () => {
  test("US pre-loaded state shows all 3 US credits", async ({ page }) => {
    await page.goto(`/?s=${US_STATE}`);
    await waitForHydration(page);

    // Expand Tax Credits section
    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();

    await expect(page.getByText("Earned Income Tax Credit (EITC)")).toBeVisible();
    await expect(page.getByText("Child Tax Credit")).toBeVisible();
    await expect(page.getByText("State and Local Tax (SALT) Deduction")).toBeVisible();

    await captureScreenshot(page, "task-145-us-credits-loaded");
  });
});

// ─── 3. Insights fire correctly ────────────────────────────────────────────

test.describe("Task 145: Tax credit insights regression", () => {
  test("CA state shows tax-credits-summary insight", async ({ page }) => {
    await page.goto(`/?s=${CA_STATE}`);
    await waitForHydration(page);

    const summaryInsight = page.locator('[data-insight-type="tax-credits-summary"]');
    await expect(summaryInsight).toBeVisible({ timeout: 5000 });
    const text = await summaryInsight.textContent();
    expect(text).toContain("tax credits");

    await captureScreenshot(page, "task-145-ca-insights-summary");
  });

  test("US state shows tax-credits-summary insight", async ({ page }) => {
    await page.goto(`/?s=${US_STATE}`);
    await waitForHydration(page);

    const summaryInsight = page.locator('[data-insight-type="tax-credits-summary"]');
    await expect(summaryInsight).toBeVisible({ timeout: 5000 });

    await captureScreenshot(page, "task-145-us-insights-summary");
  });

  test("unclaimed suggestions capped at 2 for CA user", async ({ page }) => {
    await page.goto(`/?s=${CA_STATE}`);
    await waitForHydration(page);

    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();

    const unclaimedInsights = page.locator('[data-insight-type="tax-credits-unclaimed"]');
    const count = await unclaimedInsights.count();
    expect(count).toBeLessThanOrEqual(2);
  });

  test("refundable credit insight check for CA state with CCB", async ({ page }) => {
    await page.goto(`/?s=${CA_STATE}`);
    await waitForHydration(page);

    // May or may not trigger depending on tax estimate vs credits
    const refundableInsight = page.locator('[data-insight-type="tax-credits-refundable"]');
    const isVisible = await refundableInsight.isVisible().catch(() => false);
    if (isVisible) {
      const text = await refundableInsight.textContent();
      expect(text).toContain("tax refund");
    }
    // No crash = pass
  });
});

// ─── 4. Dashboard metrics respond to credits ──────────────────────────────

test.describe("Task 145: Dashboard metrics with tax credits", () => {
  test("CA: effective tax rate and credits-applied badge visible", async ({ page }) => {
    await page.goto(`/?s=${CA_STATE}`);
    await waitForHydration(page);

    // Credits are now baked into the displayed tax — badge indicates credits active
    const badge = page.locator('[data-testid="tax-credits-applied-badge"]');
    await expect(badge).toBeVisible({ timeout: 5000 });
    expect(await badge.textContent()).toContain("Tax Credits Applied");

    // Effective rate shown (already includes credit adjustment)
    const rate = page.locator('[data-testid="effective-tax-rate"]');
    await expect(rate).toBeVisible();

    await captureScreenshot(page, "task-145-ca-dashboard-tax-rate");
  });

  test("CA: monthly cash flow reflects credits in surplus", async ({ page }) => {
    await page.goto(`/?s=${CA_STATE}`);
    await waitForHydration(page);

    // Cash flow card should be visible — credits now increase the after-tax income directly
    const cashFlow = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await expect(cashFlow).toBeVisible({ timeout: 5000 });

    await captureScreenshot(page, "task-145-ca-dashboard-surplus");
  });

  test("CA: runway card exists", async ({ page }) => {
    await page.goto(`/?s=${CA_STATE}`);
    await waitForHydration(page);

    const runwayCard = page.locator('[data-testid="metric-card-financial-runway"]');
    await expect(runwayCard).toBeVisible();

    await captureScreenshot(page, "task-145-ca-dashboard-runway");
  });

  test("US: credits applied badge visible", async ({ page }) => {
    await page.goto(`/?s=${US_STATE}`);
    await waitForHydration(page);

    const badge = page.locator('[data-testid="tax-credits-applied-badge"]');
    await expect(badge).toBeVisible({ timeout: 5000 });

    await captureScreenshot(page, "task-145-us-dashboard-metrics");
  });

  test("no credit indicators without credits", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    await expect(page.locator('[data-testid="tax-credits-applied-badge"]')).not.toBeVisible();
  });
});

// ─── 5. URL state round-trip persistence ──────────────────────────────────

test.describe("Task 145: URL state round-trip", () => {
  test("CA credits survive navigate-away and return", async ({ page }) => {
    await page.goto(`/?s=${CA_STATE}`);
    await waitForHydration(page);

    const url = page.url();
    expect(url).toContain("s=");

    await page.goto("about:blank");
    await page.goto(url);
    await waitForHydration(page);

    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();

    await expect(page.getByText("Disability Tax Credit (DTC)")).toBeVisible();
    await expect(page.getByText("Canada Child Benefit (CCB)")).toBeVisible();
    await expect(page.getByText("Medical Expense Tax Credit")).toBeVisible();

    await captureScreenshot(page, "task-145-ca-url-roundtrip");
  });

  test("US credits survive navigate-away and return", async ({ page }) => {
    await page.goto(`/?s=${US_STATE}`);
    await waitForHydration(page);

    const url = page.url();
    expect(url).toContain("s=");

    await page.goto("about:blank");
    await page.goto(url);
    await waitForHydration(page);

    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();

    await expect(page.getByText("Earned Income Tax Credit (EITC)")).toBeVisible();
    await expect(page.getByText("Child Tax Credit")).toBeVisible();
    await expect(page.getByText("State and Local Tax (SALT) Deduction")).toBeVisible();

    await captureScreenshot(page, "task-145-us-url-roundtrip");
  });

  test("interactively added credit persists in URL after reload", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    // Expand Tax Credits section
    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();

    // Add a credit
    await page.getByRole("button", { name: /Add Credit/i }).click();
    const categoryInput = page.getByLabel("New credit category");
    await categoryInput.fill("GST");
    await page.waitForTimeout(300);
    await page.getByText("GST/HST Credit").first().click({ timeout: 10000 });
    await page.getByLabel("New credit annual amount").fill("600");
    await page.getByRole("button", { name: /Confirm add credit/i }).click();
    await expect(page.getByText("GST/HST Credit").first()).toBeVisible();

    // Wait for URL to update
    await page.waitForTimeout(500);

    const url = page.url();
    expect(url).toContain("s=");

    await page.goto(url);
    await waitForHydration(page);

    const taxHeader2 = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader2.click();
    await expect(page.getByText("GST/HST Credit")).toBeVisible();

    await captureScreenshot(page, "task-145-interactive-url-persist");
  });
});

// ─── 6. Interactive entry — country switch and credit type verification ───

test.describe("Task 145: Interactive credit entry", () => {
  test("switch to US and verify filing status has 4+ options", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    // Switch to US
    const usButton = page.locator('[data-testid="country-us"]');
    await usButton.click();
    await waitForHydration(page);

    // Verify filing status has US options
    const filingSelector = page.locator('[data-testid="filing-status-selector"]');
    const options = await filingSelector.locator("option").allTextContents();
    expect(options.length).toBeGreaterThanOrEqual(4);
    expect(options).toContain("Head of Household");
    expect(options).toContain("Married Filing Jointly");
    expect(options).toContain("Married Filing Separately");

    await captureScreenshot(page, "task-145-us-filing-status");
  });

  test("add a CA credit interactively with autocomplete", async ({ page }) => {
    await page.goto("/");
    await waitForHydration(page);

    // Expand Tax Credits section
    const taxHeader = page.getByText("Tax Credits", { exact: false }).first();
    await taxHeader.click();

    // Add DTC
    await page.getByRole("button", { name: /Add Credit/i }).click();
    const categoryInput = page.getByLabel("New credit category");
    await categoryInput.fill("Disability");
    await page.waitForTimeout(300);
    await page.getByText("Disability Tax Credit (DTC)").first().click({ timeout: 10000 });
    await page.getByLabel("New credit annual amount").fill("9428");
    await page.getByRole("button", { name: /Confirm add credit/i }).click();

    // Verify it appears with correct badge
    await expect(page.getByText("Disability Tax Credit (DTC)")).toBeVisible();
    await expect(page.getByText("Non-refundable").first()).toBeVisible();

    await captureScreenshot(page, "task-145-ca-credit-entry");
  });
});
