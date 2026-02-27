import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Region toggle visible effects", () => {
  test("debt suggestions filter by CA region", async ({ page }) => {
    await page.goto("/");

    // Click CA region toggle
    await page.getByRole("radio", { name: /CA/i }).click();

    // Open debt add form
    await page.getByRole("button", { name: /Add Debt/i }).click();

    // Focus the category input to show suggestions
    const categoryInput = page.getByLabel("New debt category");
    await categoryInput.click();

    // Verify CA-specific debt categories are shown
    await expect(page.getByRole("button", { name: /HELOC/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Canada Student Loan/ })).toBeVisible();

    // Verify US-specific debt categories are NOT shown
    await expect(page.getByRole("button", { name: /Medical Debt/ })).not.toBeVisible();
    await expect(page.getByRole("button", { name: /Federal Student Loan/ })).not.toBeVisible();

    await captureScreenshot(page, "task-17-debt-ca-suggestions");
  });

  test("debt suggestions filter by US region", async ({ page }) => {
    await page.goto("/");

    // Click US region toggle
    await page.getByRole("radio", { name: /US/i }).click();

    // Open debt add form
    await page.getByRole("button", { name: /Add Debt/i }).click();

    const categoryInput = page.getByLabel("New debt category");
    await categoryInput.click();

    // Verify US-specific debt categories are shown
    await expect(page.getByRole("button", { name: /Medical Debt/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Federal Student Loan/ })).toBeVisible();

    // Verify CA-specific debt categories are NOT shown
    await expect(page.getByRole("button", { name: /HELOC/ })).not.toBeVisible();

    await captureScreenshot(page, "task-17-debt-us-suggestions");
  });

  test("flag badges appear next to region-specific asset categories", async ({ page }) => {
    await page.goto("/");

    // Default mock data includes TFSA (CA-specific) — check for flag
    const tfsaButton = page.getByRole("button", { name: /Edit category for TFSA/ });
    await expect(tfsaButton).toBeVisible();
    await expect(tfsaButton).toContainText("🇨🇦");

    // Savings Account (universal) should NOT have a flag
    const savingsButton = page.getByRole("button", { name: /Edit category for Savings Account/ });
    await expect(savingsButton).toBeVisible();
    const savingsText = await savingsButton.textContent();
    expect(savingsText).not.toContain("🇨🇦");
    expect(savingsText).not.toContain("🇺🇸");

    await captureScreenshot(page, "task-17-asset-flag-badges");
  });

  test("flag badges appear in asset suggestion dropdown", async ({ page }) => {
    await page.goto("/");

    // Toggle to Both to see all suggestions
    await page.getByRole("radio", { name: /Both/i }).click();

    // Open add asset form
    await page.getByRole("button", { name: /Add Asset/i }).click();
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();

    // Check that TFSA suggestion has CA flag
    const tfsaSuggestion = page.locator("button", { hasText: "TFSA" }).filter({ hasText: "🇨🇦" });
    await expect(tfsaSuggestion.first()).toBeVisible();

    // Check that 401k suggestion has US flag
    const suggestion401k = page.locator("button", { hasText: "401k" }).filter({ hasText: "🇺🇸" });
    await expect(suggestion401k.first()).toBeVisible();

    await captureScreenshot(page, "task-17-asset-suggestion-flags");
  });

  test("flag badges appear in debt suggestion dropdown", async ({ page }) => {
    await page.goto("/");

    // Toggle to Both to see all suggestions
    await page.getByRole("radio", { name: /Both/i }).click();

    // Open add debt form
    await page.getByRole("button", { name: /Add Debt/i }).click();
    const categoryInput = page.getByLabel("New debt category");
    await categoryInput.click();

    // Check that HELOC suggestion has CA flag
    const helocSuggestion = page.locator("button", { hasText: "HELOC" }).filter({ hasText: "🇨🇦" });
    await expect(helocSuggestion.first()).toBeVisible();

    // Check that Medical Debt suggestion has US flag
    const medicalSuggestion = page.locator("button", { hasText: "Medical Debt" }).filter({ hasText: "🇺🇸" });
    await expect(medicalSuggestion.first()).toBeVisible();

    await captureScreenshot(page, "task-17-debt-suggestion-flags");
  });

  test("entry cards pulse when region toggles", async ({ page }) => {
    await page.goto("/");

    // Initially, no pulse animation
    const assetWrapper = page.getByTestId("asset-pulse-wrapper");
    await expect(assetWrapper).toBeVisible();
    const initialClass = await assetWrapper.getAttribute("class");
    expect(initialClass).not.toContain("animate-region-pulse");

    // Toggle region to CA
    await page.getByRole("radio", { name: /CA/i }).click();

    // After toggling, pulse animation should be applied
    const debtWrapper = page.getByTestId("debt-pulse-wrapper");
    await expect(debtWrapper).toHaveClass(/animate-region-pulse/);
    await expect(assetWrapper).toHaveClass(/animate-region-pulse/);

    await captureScreenshot(page, "task-17-region-pulse");
  });

  test("Both region shows all debt suggestions", async ({ page }) => {
    await page.goto("/");

    // Ensure Both is selected
    await page.getByRole("radio", { name: /Both/i }).click();

    // Open debt add form
    await page.getByRole("button", { name: /Add Debt/i }).click();
    const categoryInput = page.getByLabel("New debt category");
    await categoryInput.click();

    // Should see both CA and US specific categories plus universal
    await expect(page.getByRole("button", { name: /HELOC/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Medical Debt/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Mortgage", exact: true })).toBeVisible();

    await captureScreenshot(page, "task-17-debt-both-suggestions");
  });
});
