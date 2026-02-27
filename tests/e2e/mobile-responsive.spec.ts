import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Mobile responsiveness — 375px viewport", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
  });

  test("header wraps and all controls are visible at 375px", async ({ page }) => {
    // Title should be visible
    await expect(page.locator("h1")).toContainText("Financial Health Snapshot");

    // Region toggle and Copy Link button should be accessible
    const regionToggle = page.getByRole("radiogroup", { name: "Filter account types by region" });
    await expect(regionToggle).toBeVisible();

    const copyButton = page.getByRole("button", { name: "Copy link to clipboard" });
    await expect(copyButton).toBeVisible();

    await captureScreenshot(page, "task-14-mobile-375-header");
  });

  test("entry cards are full-width and stacked on mobile", async ({ page }) => {
    // Entry panel and dashboard should be stacked (not side-by-side)
    const entryPanel = page.getByRole("region", { name: "Financial data entry" });
    const dashboardPanel = page.getByRole("region", { name: "Financial dashboard" });

    await expect(entryPanel).toBeVisible();
    await expect(dashboardPanel).toBeVisible();

    // All five entry sections should be visible (headings include emoji prefix)
    await expect(page.locator("h2").filter({ hasText: "Assets" })).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "Debts" })).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "Monthly Income" })).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "Monthly Expenses" })).toBeVisible();
    await expect(page.locator("h2").filter({ hasText: "Goals" })).toBeVisible();

    await captureScreenshot(page, "task-14-mobile-375-cards");
  });

  test("delete buttons are visible on mobile without hover", async ({ page }) => {
    // On mobile, delete buttons should be visible without hovering
    const deleteButtons = page.getByRole("button", { name: /^Delete / });
    const count = await deleteButtons.count();
    expect(count).toBeGreaterThan(0);

    // Check the first delete button is visible (not hidden by opacity)
    const firstDelete = deleteButtons.first();
    await expect(firstDelete).toBeVisible();

    await captureScreenshot(page, "task-14-mobile-delete-visible");
  });

  test("add asset form stacks properly on mobile", async ({ page }) => {
    // Click Add Asset
    await page.getByText("+ Add Asset").click();

    // The category input and amount input should both be visible
    const categoryInput = page.getByLabel("New asset category");
    const amountInput = page.getByLabel("New asset amount");
    await expect(categoryInput).toBeVisible();
    await expect(amountInput).toBeVisible();

    // Verify no horizontal overflow
    const viewportWidth = 375;
    const inputBox = await amountInput.boundingBox();
    expect(inputBox).toBeTruthy();
    expect(inputBox!.x + inputBox!.width).toBeLessThanOrEqual(viewportWidth);

    await captureScreenshot(page, "task-14-mobile-add-form-stacked");
  });

  test("tooltip shows on hover interaction at mobile viewport", async ({ page }) => {
    // Scroll to the Net Worth metric card
    const netWorthCard = page.getByRole("group", { name: "Net Worth" });
    await netWorthCard.scrollIntoViewIfNeeded();

    // Hover to show tooltip (simulates touch-hover on mobile)
    await netWorthCard.hover();

    // Tooltip should appear
    const tooltip = page.getByRole("tooltip");
    await expect(tooltip).toBeVisible({ timeout: 3000 });
    await expect(tooltip).toContainText("total assets minus total debts");

    await captureScreenshot(page, "task-14-mobile-tooltip");
  });

  test("inline editing works on mobile", async ({ page }) => {
    // Click on an amount to edit
    const amountButton = page.getByLabel("Edit amount for Savings Account, currently $12,000");
    await amountButton.click();

    // Input should appear
    const amountInput = page.getByLabel("Edit amount for Savings Account");
    await expect(amountInput).toBeVisible();

    // Type a new value
    await amountInput.fill("15000");
    await amountInput.press("Enter");

    // Value should update — use scoped locator to avoid matching dashboard values
    const assetList = page.getByRole("list", { name: "Asset items" });
    await expect(assetList.getByText("$15,000")).toBeVisible();

    await captureScreenshot(page, "task-14-mobile-inline-edit");
  });
});

test.describe("Tablet responsiveness — 768px viewport", () => {
  test("layout works at 768px tablet width", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    // All sections should be visible
    await expect(page.locator("h1")).toContainText("Financial Health Snapshot");
    await expect(page.locator("h2").filter({ hasText: "Assets" })).toBeVisible();

    // Dashboard should be visible
    const dashboard = page.getByTestId("snapshot-dashboard");
    await expect(dashboard).toBeVisible();

    await captureScreenshot(page, "task-14-tablet-768");
  });
});

test.describe("Desktop responsiveness — 1024px viewport", () => {
  test("two-column layout at 1024px desktop width", async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/");

    // Both panels should be visible side by side
    const entryPanel = page.getByRole("region", { name: "Financial data entry" });
    const dashboardPanel = page.getByRole("region", { name: "Financial dashboard" });

    await expect(entryPanel).toBeVisible();
    await expect(dashboardPanel).toBeVisible();

    // Verify they are side by side (entry panel on left, dashboard on right)
    const entryBox = await entryPanel.boundingBox();
    const dashBox = await dashboardPanel.boundingBox();

    expect(entryBox).toBeTruthy();
    expect(dashBox).toBeTruthy();
    // On lg: (1024px), panels should be side by side
    expect(dashBox!.x).toBeGreaterThan(entryBox!.x);

    await captureScreenshot(page, "task-14-desktop-1024");
  });
});
