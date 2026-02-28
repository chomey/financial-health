import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Fast Forward Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("shows collapsed toggle button initially", async ({ page }) => {
    const toggle = page.getByTestId("fast-forward-toggle");
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText("Fast Forward");
    await expect(toggle).toContainText("What-if scenario modeling");
  });

  test("expands panel on click", async ({ page }) => {
    await page.getByTestId("fast-forward-toggle").click();
    const panel = page.getByTestId("fast-forward-panel");
    await expect(panel).toBeVisible();
    // Should show debt toggles (default state has a car loan)
    await expect(page.getByTestId("debt-toggles")).toBeVisible();
    // Should show income adjustment
    await expect(page.getByTestId("income-adjustment")).toBeVisible();
    // Should show windfall input
    await expect(page.getByTestId("windfall-input")).toBeVisible();
    await captureScreenshot(page, "task-51-fast-forward-expanded");
  });

  test("toggling a debt shows scenario comparison", async ({ page }) => {
    await page.getByTestId("fast-forward-toggle").click();
    // Toggle the car loan debt
    const debtToggle = page.getByTestId("debt-toggle-d1");
    await expect(debtToggle).toBeVisible();
    await debtToggle.click();
    // Should show "Paid off!" text
    await expect(debtToggle).toContainText("Paid off!");
    // Comparison section should appear
    const comparison = page.getByTestId("scenario-comparison");
    await expect(comparison).toBeVisible();
    await expect(comparison).toContainText("Scenario Impact");
    await captureScreenshot(page, "task-51-debt-toggled");
  });

  test("income adjustment buttons work", async ({ page }) => {
    await page.getByTestId("fast-forward-toggle").click();
    // Increase income
    await page.getByTestId("income-increase").click();
    // Should show comparison
    await expect(page.getByTestId("scenario-comparison")).toBeVisible();
    // Decrease income
    await page.getByTestId("income-decrease").click();
    await page.getByTestId("income-decrease").click();
    // Should still show comparison (net adjustment is -$500)
    await expect(page.getByTestId("scenario-comparison")).toBeVisible();
  });

  test("windfall input shows comparison", async ({ page }) => {
    await page.getByTestId("fast-forward-toggle").click();
    const windfallInput = page.getByTestId("windfall-amount");
    await windfallInput.fill("50000");
    // Comparison should appear
    await expect(page.getByTestId("scenario-comparison")).toBeVisible();
    // Net worth delta should show positive impact
    const delta5 = page.getByTestId("delta-year-5");
    await expect(delta5).toBeVisible();
    await expect(delta5).toContainText("better");
    await captureScreenshot(page, "task-51-windfall-scenario");
  });

  test("reset button clears all modifications", async ({ page }) => {
    await page.getByTestId("fast-forward-toggle").click();
    // Make a modification
    await page.getByTestId("income-increase").click();
    await expect(page.getByTestId("scenario-comparison")).toBeVisible();
    // Reset
    await page.getByTestId("reset-scenario").click();
    // Comparison should disappear
    await expect(page.getByTestId("scenario-comparison")).not.toBeVisible();
  });

  test("shows placeholder text when no modifications active", async ({ page }) => {
    await page.getByTestId("fast-forward-toggle").click();
    // Should show placeholder prompt
    await expect(page.getByText("Toggle a debt, adjust a contribution")).toBeVisible();
  });
});
