import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("IncomeEntry in simple mode", () => {
  test("hides income type selector in simple mode (default)", async ({ page }) => {
    await page.goto("/?step=income");
    await page.waitForLoadState("networkidle");

    const incomeList = page.getByRole("list", { name: "Income items" });

    // Should show categories and amounts
    await expect(incomeList.getByText("Salary")).toBeVisible();

    // Income type selectors should not be present
    await expect(page.locator("[data-testid^='income-type-']").first()).not.toBeVisible();

    // Frequency dropdowns should still be visible
    await expect(page.locator("[data-testid^='frequency-']").first()).toBeVisible();

    await captureScreenshot(page, "task-179-income-entry-simple-mode");
  });

  test("shows income type selector in advanced mode", async ({ page }) => {
    await page.goto("/?step=income");
    await page.waitForLoadState("networkidle");

    // Switch to advanced mode
    await page.getByTestId("mode-toggle-advanced").click();

    // Income type selectors should now be visible
    await expect(page.locator("[data-testid^='income-type-']").first()).toBeVisible();

    await captureScreenshot(page, "task-179-income-entry-advanced-mode");
  });

  test("simple mode add income form hides income type", async ({ page }) => {
    await page.goto("/?step=income");
    await page.waitForLoadState("networkidle");

    await page.getByText("+ Add Income").click();

    // Income type should not appear
    await expect(page.getByTestId("new-income-type")).not.toBeVisible();

    // Frequency should still be visible
    await expect(page.getByTestId("new-income-frequency")).toBeVisible();

    // Can still add income
    await page.getByLabel("New income category").fill("Consulting");
    await page.getByLabel("New income amount").fill("2000");
    await page.getByLabel("Confirm add income").click();

    await expect(page.getByText("Consulting")).toBeVisible();

    await captureScreenshot(page, "task-179-income-entry-simple-add");
  });
});
