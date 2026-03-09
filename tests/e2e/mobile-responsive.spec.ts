import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Mobile responsiveness — 375px viewport", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
  });

  test("header visible and controls accessible at 375px", async ({ page }) => {
    await page.goto("/?step=assets");

    // Title should be visible (mobile shows "FH" or full title)
    await expect(page.locator("h1")).toBeVisible();

    await captureScreenshot(page, "task-14-mobile-375-header");
  });

  test("delete buttons are visible on mobile without hover", async ({ page }) => {
    await page.goto("/?step=assets");

    // On mobile, delete buttons should be visible without hovering
    const deleteButtons = page.getByRole("button", { name: /^Delete / });
    const count = await deleteButtons.count();
    expect(count).toBeGreaterThan(0);

    const firstDelete = deleteButtons.first();
    await expect(firstDelete).toBeVisible();

    await captureScreenshot(page, "task-14-mobile-delete-visible");
  });

  test("add asset form stacks properly on mobile", async ({ page }) => {
    await page.goto("/?step=assets");

    await page.getByText("+ Add Asset").click();

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

  test("inline editing works on mobile", async ({ page }) => {
    await page.goto("/?step=assets");

    // Click on Savings Account amount to edit (INITIAL_STATE: $5,000)
    const amountButton = page.getByLabel(/Edit amount for Savings Account/);
    await amountButton.click();

    const amountInput = page.getByLabel("Edit amount for Savings Account");
    await expect(amountInput).toBeVisible();

    await amountInput.fill("15000");
    await amountInput.press("Enter");

    const assetList = page.getByRole("list", { name: "Asset items" });
    await expect(assetList.getByText("$15,000")).toBeVisible();

    await captureScreenshot(page, "task-14-mobile-inline-edit");
  });

  test("dashboard is accessible at mobile viewport", async ({ page }) => {
    await page.goto("/?step=assets");

    // Skip to dashboard
    await page.getByTestId("wizard-skip-to-dashboard").click();
    await expect(page.getByTestId("snapshot-dashboard")).toBeVisible();

    await captureScreenshot(page, "task-14-mobile-dashboard");
  });
});

test.describe("Tablet responsiveness — 768px viewport", () => {
  test("layout works at 768px tablet width", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/?step=assets");

    // Assets heading should be visible
    const heading = page.getByRole("heading", { name: "Assets" }).first();
    await expect(heading).toBeVisible();

    await captureScreenshot(page, "task-14-tablet-768");
  });
});
