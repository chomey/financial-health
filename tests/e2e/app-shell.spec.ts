import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("App shell layout", () => {
  test("renders header, entry panel, and dashboard panel", async ({
    page,
  }) => {
    await page.goto("/");

    // Header
    const title = page.getByRole("heading", {
      name: "Financial Health Snapshot",
    });
    await expect(title).toBeVisible();
    await expect(
      page.getByText("Your finances at a glance — no judgment, just clarity")
    ).toBeVisible();

    // Entry panel cards (use headings to avoid ambiguity)
    await expect(
      page.getByRole("heading", { name: "Assets" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Debts" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Monthly Income" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Monthly Expenses" })
    ).toBeVisible();

    // Dashboard metric cards (scoped to metric group elements)
    await expect(page.locator('[aria-label="Net Worth"] h3')).toBeVisible();
    await expect(page.locator('[aria-label="Monthly Surplus"] h3')).toBeVisible();
    await expect(page.locator('[aria-label="Financial Runway"] h3')).toBeVisible();
    await expect(page.locator('[aria-label="Debt-to-Asset Ratio"] h3')).toBeVisible();

    // Assets section shows mock data instead of empty state
    await expect(page.getByText("Savings Account")).toBeVisible();

    // Debts section shows mock data instead of empty state
    await expect(page.getByText("Mortgage", { exact: true })).toBeVisible();

    // Income section shows mock data
    await expect(page.getByText("Salary")).toBeVisible();

    // Expenses section shows mock data
    await expect(page.getByText("Groceries")).toBeVisible();

    await captureScreenshot(page, "task-3-app-shell-desktop");
  });

  test("entry cards have hover lift effect", async ({ page }) => {
    await page.goto("/");

    const assetsCard = page
      .getByRole("region", { name: "Financial data entry" })
      .locator("div")
      .filter({ hasText: "Assets" })
      .first();

    await expect(assetsCard).toBeVisible();
    await assetsCard.hover();

    await captureScreenshot(page, "task-3-card-hover");
  });

  test("responsive layout stacks on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    // Use headings to avoid ambiguity
    await expect(
      page.getByRole("heading", { name: "Assets" })
    ).toBeVisible();
    await expect(page.locator('[aria-label="Net Worth"] h3')).toBeVisible();

    await captureScreenshot(page, "task-3-mobile-layout");
  });
});
