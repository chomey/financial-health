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

    // Dashboard metric cards
    await expect(page.getByText("Net Worth")).toBeVisible();
    await expect(page.getByText("Monthly Surplus")).toBeVisible();
    await expect(page.getByText("Financial Runway")).toBeVisible();
    await expect(page.getByText("Debt-to-Asset Ratio")).toBeVisible();

    // Assets section shows mock data instead of empty state
    await expect(page.getByText("Savings Account")).toBeVisible();

    // Other cards still show empty state messages
    await expect(
      page.getByText(/Track your mortgage, loans, and credit cards/)
    ).toBeVisible();

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
    await expect(page.getByText("Net Worth")).toBeVisible();

    await captureScreenshot(page, "task-3-mobile-layout");
  });
});
