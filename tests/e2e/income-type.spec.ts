import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Income type selector", () => {
  test("shows income type selector on each income row", async ({ page }) => {
    await page.goto("/");

    // Each existing income row should have an income type selector
    await expect(page.getByLabel("Change income type for Salary")).toBeVisible();
    await expect(page.getByLabel("Change income type for Freelance")).toBeVisible();

    // Default value should be "Emp" (employment short label)
    const salaryTypeSelect = page.getByTestId("income-type-i1");
    await expect(salaryTypeSelect).toHaveValue("employment");
  });

  test("changing income type to capital-gains applies visual styling", async ({ page }) => {
    await page.goto("/");

    // Change Salary to Capital Gains type
    await page.getByTestId("income-type-i1").selectOption("capital-gains");

    // The row should have amber styling (border-l-2 border-amber-400)
    const row = page.getByRole("listitem").filter({ has: page.getByText("Salary") });
    await expect(row).toHaveClass(/border-amber-400/);
    await expect(row).toHaveClass(/bg-amber-50/);

    // The type selector should have amber styling too
    const selector = page.getByTestId("income-type-i1");
    await expect(selector).toHaveClass(/text-amber-700/);

    await captureScreenshot(page, "task-43-income-type-capital-gains-styling");
  });

  test("income type selector appears in add new income form", async ({ page }) => {
    await page.goto("/");

    await page.getByText("+ Add Income").click();

    // Should show income type selector in the form
    await expect(page.getByLabel("New income type")).toBeVisible();
    await expect(page.getByTestId("new-income-type")).toBeVisible();

    // Default should be employment
    await expect(page.getByTestId("new-income-type")).toHaveValue("employment");
  });

  test("adding a capital-gains income item shows proper styling", async ({ page }) => {
    await page.goto("/");

    await page.getByText("+ Add Income").click();

    // Select capital-gains type first
    await page.getByTestId("new-income-type").selectOption("capital-gains");

    // Fill in details
    await page.getByLabel("New income category").fill("Stock Sale");
    await page.getByLabel("New income amount").fill("10000");

    await page.getByLabel("Confirm add income").click();

    // Verify the new item appears with capital gains styling
    await expect(page.getByText("Stock Sale")).toBeVisible();
    await expect(page.getByText("$10,000")).toBeVisible();

    // The new row should have amber styling
    const row = page.getByRole("listitem").filter({ has: page.getByText("Stock Sale") });
    await expect(row).toHaveClass(/border-amber-400/);

    await captureScreenshot(page, "task-43-income-type-capital-gains-added");
  });

  test("capital-gains income type persists in URL state", async ({ page }) => {
    await page.goto("/");

    // Change Salary to capital-gains
    await page.getByTestId("income-type-i1").selectOption("capital-gains");

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Reload the page
    await page.reload();

    // The income type should still be capital-gains after reload
    await expect(page.getByTestId("income-type-i1")).toHaveValue("capital-gains");

    // Visual styling should persist
    const row = page.getByRole("listitem").filter({ has: page.getByText("Salary") });
    await expect(row).toHaveClass(/border-amber-400/);

    await captureScreenshot(page, "task-43-income-type-persists-after-reload");
  });

  test("category suggestions change based on income type", async ({ page }) => {
    await page.goto("/");

    await page.getByText("+ Add Income").click();

    // With employment type, focus category to see suggestions
    await page.getByLabel("New income category").focus();
    // The suggestions dropdown should show employment categories
    const suggestionsDropdown = page.locator(".absolute.left-0.top-full");
    await expect(suggestionsDropdown.getByRole("button", { name: "Salary", exact: true })).toBeVisible();

    // Switch to capital-gains
    await page.getByTestId("new-income-type").selectOption("capital-gains");

    // Clear and refocus to see new suggestions
    await page.getByLabel("New income category").fill("");
    await page.getByLabel("New income category").focus();

    // Should see capital gains specific suggestions
    await expect(suggestionsDropdown.getByRole("button", { name: "Stock Sale" })).toBeVisible();
    await expect(suggestionsDropdown.getByRole("button", { name: "Crypto" })).toBeVisible();
    // Should NOT see employment-only categories
    await expect(suggestionsDropdown.getByRole("button", { name: "Salary", exact: true })).not.toBeVisible();

    await captureScreenshot(page, "task-43-income-type-capital-gains-suggestions");
  });
});
