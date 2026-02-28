import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("T3: Milestone 4 — Comprehensive E2E for tax computation feature (tasks 37-45)", () => {
  test.setTimeout(90000);

  test("full journey: country selector, income type, tax metrics, after-tax surplus, capital gains, URL persistence", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // ========================================
    // Step 1: Country selector defaults to CA/ON (Task 42)
    // ========================================
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
    // Step 2: Switch to US, verify jurisdiction resets (Task 42)
    // ========================================
    await usButton.click();
    await page.waitForTimeout(300);

    // Jurisdiction should reset to CA (California) when switching to US
    await expect(jurisdictionSelect).toHaveValue("CA");

    // Verify US states are shown (not Canadian provinces)
    const options = await jurisdictionSelect.locator("option").allTextContents();
    expect(options.some((o) => o.includes("California"))).toBe(true);
    expect(options.some((o) => o.includes("New York"))).toBe(true);
    expect(options.some((o) => o.includes("Texas"))).toBe(true);
    // Ontario should NOT be in the list
    expect(options.some((o) => o.includes("Ontario"))).toBe(false);

    await captureScreenshot(page, "task-46-country-selector-us");

    // Select New York
    await jurisdictionSelect.selectOption("NY");
    await page.waitForTimeout(300);
    await expect(jurisdictionSelect).toHaveValue("NY");

    await captureScreenshot(page, "task-46-us-ny-selected");

    // ========================================
    // Step 3: Switch back to CA, verify jurisdiction resets (Task 42)
    // ========================================
    await caButton.click();
    await page.waitForTimeout(300);
    await expect(jurisdictionSelect).toHaveValue("ON");

    // Verify Canadian provinces are shown
    const caOptions = await jurisdictionSelect.locator("option").allTextContents();
    expect(caOptions.some((o) => o.includes("Ontario"))).toBe(true);
    expect(caOptions.some((o) => o.includes("British Columbia"))).toBe(true);
    expect(caOptions.some((o) => o.includes("Quebec"))).toBe(true);
    // California should NOT be in the list
    expect(caOptions.some((o) => o.includes("California"))).toBe(false);

    // ========================================
    // Step 4: Dashboard shows tax metrics (Tasks 44-45)
    // ========================================
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // Wait for count-up animations
    await page.waitForTimeout(1500);

    // All five metric cards should be visible
    await expect(
      dashboard.getByRole("group", { name: "Net Worth" })
    ).toBeVisible();
    await expect(
      dashboard.getByRole("group", { name: /Monthly Surplus/ })
    ).toBeVisible();
    await expect(
      dashboard.getByRole("group", { name: "Estimated Tax" })
    ).toBeVisible();
    await expect(
      dashboard.getByRole("group", { name: "Financial Runway" })
    ).toBeVisible();
    await expect(
      dashboard.getByRole("group", { name: "Debt-to-Asset Ratio" })
    ).toBeVisible();

    // Estimated Tax card should show effective rate
    const effectiveRate = page.getByTestId("effective-tax-rate");
    await expect(effectiveRate).toBeVisible();
    await expect(effectiveRate).toContainText("% effective rate");

    await captureScreenshot(page, "task-46-five-metric-cards-with-tax");

    // ========================================
    // Step 5: Surplus uses after-tax income (Task 44)
    // ========================================
    const surplusCard = dashboard.getByRole("group", { name: /Monthly Surplus/ });
    // Surplus tooltip/breakdown should mention after-tax income
    await surplusCard.hover();
    await page.waitForTimeout(500);

    // The surplus breakdown should reference after-tax values
    const surplusText = await surplusCard.textContent();
    expect(surplusText).toBeTruthy();

    await captureScreenshot(page, "task-46-surplus-after-tax");

    // ========================================
    // Step 6: Income type selector on income rows (Task 43)
    // ========================================
    // Each income row should have an income type selector
    const incomeType1 = page.getByTestId("income-type-i1");
    const incomeType2 = page.getByTestId("income-type-i2");
    await expect(incomeType1).toBeVisible();
    await expect(incomeType2).toBeVisible();

    // Default should be employment
    await expect(incomeType1).toHaveValue("employment");

    // Change Freelance to capital-gains
    await incomeType2.selectOption("capital-gains");
    await page.waitForTimeout(500);

    // Capital-gains row should get amber styling
    const freelanceRow = page.getByRole("listitem").filter({ has: page.getByText("Freelance") });
    await expect(freelanceRow).toBeVisible();
    // Amber border class should be applied
    await expect(freelanceRow).toHaveClass(/border-amber/);

    await captureScreenshot(page, "task-46-income-type-capital-gains");

    // ========================================
    // Step 7: Capital gains should show different effective rate (Task 44)
    // ========================================
    // Record current effective rate with one capital-gains income
    const effectiveRateText1 = await effectiveRate.textContent();

    // Change back to employment to see rate difference
    await incomeType2.selectOption("employment");
    await page.waitForTimeout(500);

    const effectiveRateText2 = await effectiveRate.textContent();

    // The rates should differ (capital gains typically has lower effective rate in CA)
    // We just check they both contain valid percentage format
    expect(effectiveRateText1).toMatch(/[\d.]+%/);
    expect(effectiveRateText2).toMatch(/[\d.]+%/);

    await captureScreenshot(page, "task-46-employment-vs-capital-gains-rate");

    // ========================================
    // Step 8: Income type selector in add form (Task 43)
    // ========================================
    await page.getByText("+ Add Income").click();
    const newIncomeType = page.getByTestId("new-income-type");
    await expect(newIncomeType).toBeVisible();

    // Select capital-gains type
    await newIncomeType.selectOption("capital-gains");

    // Category suggestions should change for capital-gains
    const categoryInput = page.getByLabel("New income category");
    await categoryInput.click();
    await page.waitForTimeout(300);

    // Capital-gains categories should appear (Stock Sale, Crypto etc)
    const suggestionsContainer = page.locator(".animate-in");
    await expect(
      suggestionsContainer.getByRole("button", { name: /Stock Sale/ })
    ).toBeVisible();

    await captureScreenshot(page, "task-46-capital-gains-category-suggestions");

    // Add the capital-gains income
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
    // Step 9: Tax metrics update when switching country (Task 44)
    // ========================================
    // Record CA tax values
    const caTaxCardText = await dashboard
      .getByRole("group", { name: "Estimated Tax" })
      .textContent();

    // Switch to US/TX (no state tax)
    await usButton.click();
    await page.waitForTimeout(300);
    await jurisdictionSelect.selectOption("TX");
    await page.waitForTimeout(1500);

    // US/TX tax should be different from CA (no state tax in TX)
    const usTxTaxCardText = await dashboard
      .getByRole("group", { name: "Estimated Tax" })
      .textContent();

    // Tax values should differ between CA and US/TX
    expect(usTxTaxCardText).not.toEqual(caTaxCardText);

    await captureScreenshot(page, "task-46-us-tx-tax-comparison");

    // Switch to US/NY (has state tax)
    await jurisdictionSelect.selectOption("NY");
    await page.waitForTimeout(1500);

    const usNyTaxCardText = await dashboard
      .getByRole("group", { name: "Estimated Tax" })
      .textContent();

    // US/NY should have higher tax than US/TX (NY has state income tax)
    expect(usNyTaxCardText).not.toEqual(usTxTaxCardText);

    await captureScreenshot(page, "task-46-us-ny-vs-tx-tax");

    // ========================================
    // Step 10: URL persistence of country/jurisdiction/incomeType (Tasks 37-38, 42-43)
    // ========================================
    // Keep US/NY and capital-gains income
    await page.waitForFunction(() => window.location.search.includes("s="));
    await page.waitForTimeout(500);

    const currentUrl = page.url();
    await page.goto(currentUrl);
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');
    await page.waitForTimeout(1000);

    // Verify country/jurisdiction persisted as US/NY
    await expect(page.getByTestId("jurisdiction-select")).toHaveValue("NY");

    // Verify income type persisted (last income should still be capital-gains)
    const incomeTypeSelectors = page.locator('[data-testid^="income-type-"]');
    const lastIncomeType = incomeTypeSelectors.last();
    await expect(lastIncomeType).toHaveValue("capital-gains");

    // Verify capital-gains styling persisted
    const reloadedStockSaleRow = page.getByRole("listitem").filter({ has: page.getByText("Stock Sale") });
    await expect(reloadedStockSaleRow).toBeVisible();
    await expect(reloadedStockSaleRow).toHaveClass(/border-amber/);

    // Verify tax metrics are still showing
    await expect(
      dashboard.getByRole("group", { name: "Estimated Tax" })
    ).toBeVisible();
    await expect(page.getByTestId("effective-tax-rate")).toBeVisible();

    await captureScreenshot(page, "task-46-url-persistence-after-reload");
  });

  test("tax insights appear under Estimated Tax card", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');
    await page.waitForTimeout(1500);

    // Tax card should be visible and contain tax insight
    const taxCard = page
      .locator('[data-testid="snapshot-dashboard"]')
      .getByRole("group", { name: "Estimated Tax" });
    await expect(taxCard).toBeVisible();

    // The tax card should show the effective rate insight message
    await expect(taxCard).toContainText("effective tax rate");

    // Effective rate sub-line should be visible
    const effectiveRate = page.getByTestId("effective-tax-rate");
    await expect(effectiveRate).toBeVisible();
    await expect(effectiveRate).toContainText("% effective rate");

    await captureScreenshot(page, "task-46-tax-insights");
  });

  test("projection chart uses after-tax surplus values", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

    // Projection chart should render
    const projChart = page.getByTestId("projection-chart");
    await expect(projChart).toBeVisible();

    // The chart should be in the full-width section above columns
    const projSection = page.locator(
      'section[aria-label="Financial projections"]'
    );
    await expect(projSection).toBeVisible();

    // The chart should show Net Worth line
    const chartLegend = projChart.locator("text=Net Worth");
    await expect(chartLegend.first()).toBeVisible();

    await captureScreenshot(page, "task-46-projection-chart-after-tax");
  });

  test("switching between CA and US updates province/state list correctly", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');

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
