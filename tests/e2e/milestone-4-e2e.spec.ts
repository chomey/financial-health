import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

/**
 * Helper to navigate between wizard steps while preserving URL state (s= param).
 */
async function goToStep(page: import("@playwright/test").Page, step: string) {
  const url = new URL(page.url());
  url.searchParams.set("step", step);
  await page.goto(url.toString());
}

test.describe("T3: Milestone 4 — Comprehensive E2E for tax computation feature (tasks 37-45)", () => {
  test.setTimeout(90000);

  test("full journey: country selector, income type, tax metrics, capital gains, URL persistence", async ({
    page,
  }) => {
    // ========================================
    // Step 1: Country selector defaults to CA/ON on profile step
    // ========================================
    await page.goto("/?step=profile");

    const selector = page.getByTestId("country-jurisdiction-selector");
    await expect(selector).toBeVisible();

    const caButton = page.getByTestId("country-ca");
    const usButton = page.getByTestId("country-us");
    const jurisdictionSelect = page.getByTestId("jurisdiction-select");

    await expect(caButton).toBeVisible();
    await expect(usButton).toBeVisible();
    await expect(jurisdictionSelect).toBeVisible();

    // Default should be CA / Ontario
    await expect(jurisdictionSelect).toHaveValue("ON");

    await captureScreenshot(page, "task-46-country-selector-default-ca");

    // ========================================
    // Step 2: Switch to US, verify jurisdiction resets
    // ========================================
    await usButton.click();
    await page.waitForTimeout(300);

    // Jurisdiction should reset to CA (California) when switching to US
    await expect(jurisdictionSelect).toHaveValue("CA");

    // Verify US states are shown
    const options = await jurisdictionSelect.locator("option").allTextContents();
    expect(options.some((o) => o.includes("California"))).toBe(true);
    expect(options.some((o) => o.includes("New York"))).toBe(true);
    expect(options.some((o) => o.includes("Ontario"))).toBe(false);

    await captureScreenshot(page, "task-46-country-selector-us");

    // Select New York
    await jurisdictionSelect.selectOption("NY");
    await page.waitForTimeout(300);
    await expect(jurisdictionSelect).toHaveValue("NY");

    // ========================================
    // Step 3: Switch back to CA, verify jurisdiction resets
    // ========================================
    await caButton.click();
    await page.waitForTimeout(300);
    await expect(jurisdictionSelect).toHaveValue("ON");

    const caOptions = await jurisdictionSelect.locator("option").allTextContents();
    expect(caOptions.some((o) => o.includes("Ontario"))).toBe(true);
    expect(caOptions.some((o) => o.includes("British Columbia"))).toBe(true);
    expect(caOptions.some((o) => o.includes("California"))).toBe(false);

    // ========================================
    // Step 4: Dashboard shows tax metrics
    // ========================================
    await goToStep(page, "dashboard");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    await page.waitForTimeout(1500);

    // All five metric cards should be visible
    await expect(dashboard.getByRole("group", { name: "Net Worth" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: /Monthly Cash Flow/ })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Estimated Tax" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Financial Runway" })).toBeVisible();
    await expect(dashboard.getByRole("group", { name: "Debt-to-Asset Ratio" })).toBeVisible();

    // Estimated Tax card should show effective rate
    const effectiveRate = page.getByTestId("effective-tax-rate");
    await expect(effectiveRate).toBeVisible();
    await expect(effectiveRate).toContainText("% effective rate");

    await captureScreenshot(page, "task-46-five-metric-cards-with-tax");

    // ========================================
    // Step 5: Income type selector on income step
    // ========================================
    await goToStep(page, "income");

    // INITIAL_STATE has i1=Salary
    const incomeType1 = page.getByTestId("income-type-i1");
    await expect(incomeType1).toBeVisible();
    await expect(incomeType1).toHaveValue("employment");

    // Add a capital-gains income
    await page.getByText("+ Add Income").click();
    const newIncomeType = page.getByTestId("new-income-type");
    await expect(newIncomeType).toBeVisible();
    await newIncomeType.selectOption("capital-gains");

    const categoryInput = page.getByLabel("New income category");
    await categoryInput.click();
    await page.waitForTimeout(300);

    // Capital-gains categories should appear
    const suggestionsContainer = page.locator(".animate-in");
    await expect(suggestionsContainer.getByRole("button", { name: /Stock Sale/ })).toBeVisible();

    await categoryInput.fill("Stock Sale");
    await page.getByLabel("New income amount").fill("5000");
    await page.getByLabel("Confirm add income").click();
    await page.waitForTimeout(500);

    // New item should have capital-gains type and amber styling
    const stockSaleRow = page.getByRole("listitem").filter({ has: page.getByText("Stock Sale") });
    await expect(stockSaleRow).toBeVisible();
    await expect(stockSaleRow).toHaveClass(/border-amber/);

    await captureScreenshot(page, "task-46-capital-gains-income-added");

    // ========================================
    // Step 6: Tax metrics update when switching country on profile step
    // ========================================
    await goToStep(page, "dashboard");
    await page.waitForTimeout(1500);

    // Record CA tax values
    const caTaxCardText = await dashboard
      .getByRole("group", { name: "Estimated Tax" })
      .textContent();

    // Switch to US/TX on profile step
    await goToStep(page, "profile");
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(300);
    await page.getByTestId("jurisdiction-select").selectOption("TX");

    // Go back to dashboard — tax should be different
    await goToStep(page, "dashboard");
    await page.waitForTimeout(1500);

    const usTxTaxCardText = await dashboard
      .getByRole("group", { name: "Estimated Tax" })
      .textContent();
    expect(usTxTaxCardText).not.toEqual(caTaxCardText);

    await captureScreenshot(page, "task-46-us-tx-tax-comparison");

    // ========================================
    // Step 7: URL persistence of country/jurisdiction/incomeType
    // ========================================
    await page.waitForFunction(() => window.location.search.includes("s="));
    await page.waitForTimeout(500);

    const currentUrl = page.url();
    await page.goto(currentUrl);
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // Verify on profile step that US/TX persisted
    await goToStep(page, "profile");
    await expect(page.getByTestId("jurisdiction-select")).toHaveValue("TX");

    // Verify on income step that capital-gains type persisted
    await goToStep(page, "income");
    const incomeTypeSelectors = page.locator('[data-testid^="income-type-"]');
    const lastIncomeType = incomeTypeSelectors.last();
    await expect(lastIncomeType).toHaveValue("capital-gains");

    // Verify tax metrics are still showing on dashboard
    await goToStep(page, "dashboard");
    await expect(dashboard.getByRole("group", { name: "Estimated Tax" })).toBeVisible();
    await expect(page.getByTestId("effective-tax-rate")).toBeVisible();

    await captureScreenshot(page, "task-46-url-persistence-after-reload");
  });

  test("tax insights appear under Estimated Tax card", async ({ page }) => {
    await page.goto("/?step=dashboard");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');
    await page.waitForTimeout(1500);

    const taxCard = page
      .locator('[data-testid="snapshot-dashboard"]')
      .getByRole("group", { name: "Estimated Tax" });
    await expect(taxCard).toBeVisible();

    await expect(taxCard).toContainText("effective tax rate");

    const effectiveRate = page.getByTestId("effective-tax-rate");
    await expect(effectiveRate).toBeVisible();
    await expect(effectiveRate).toContainText("% effective rate");

    await captureScreenshot(page, "task-46-tax-insights");
  });

  test("projection chart renders with after-tax values", async ({ page }) => {
    await page.goto("/?step=dashboard");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    const projChart = page.getByTestId("projection-chart");
    await expect(projChart).toBeVisible();

    // The chart should show Net Worth line
    const chartLegend = projChart.locator("text=Net Worth");
    await expect(chartLegend.first()).toBeVisible();

    await captureScreenshot(page, "task-46-projection-chart-after-tax");
  });

  test("switching between CA and US updates province/state list correctly", async ({
    page,
  }) => {
    await page.goto("/?step=profile");

    const jurisdictionSelect = page.getByTestId("jurisdiction-select");

    // Start with CA default
    const caOptionCount = await jurisdictionSelect.locator("option").count();
    expect(caOptionCount).toBe(13); // 13 Canadian provinces/territories

    // Switch to US
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(300);

    const usOptionCount = await jurisdictionSelect.locator("option").count();
    expect(usOptionCount).toBe(51); // 50 states + DC

    // Switch back to CA
    await page.getByTestId("country-ca").click();
    await page.waitForTimeout(300);

    const caOptionCount2 = await jurisdictionSelect.locator("option").count();
    expect(caOptionCount2).toBe(13);

    await captureScreenshot(page, "task-46-province-state-switching");
  });
});
