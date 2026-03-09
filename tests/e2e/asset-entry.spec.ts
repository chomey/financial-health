import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Asset entry section", () => {
  test("renders assets with formatted amounts", async ({ page }) => {
    await page.goto("/?step=assets");

    const assetList = page.getByRole("list", { name: "Asset items" });

    // Check mock data rows (INITIAL_STATE defaults)
    await expect(assetList.getByText("Savings Account")).toBeVisible();
    await expect(assetList.getByText("TFSA")).toBeVisible();
    await expect(assetList.getByText("RRSP")).toBeVisible();

    // Check formatted amounts
    await expect(assetList.getByText("$5,000")).toBeVisible();
    await expect(assetList.getByText("$22,000")).toBeVisible();
    await expect(assetList.getByText("$28,000")).toBeVisible();

    // Check total
    await expect(page.getByText("Total: $55,000")).toBeVisible();

    await captureScreenshot(page, "task-4-assets-with-mock-data");
  });

  test("shows Add Asset button and opens add form", async ({ page }) => {
    await page.goto("/?step=assets");

    const addBtn = page.getByText("+ Add Asset");
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Form should appear
    await expect(page.getByLabel("New asset category")).toBeVisible();
    await expect(page.getByLabel("New asset amount")).toBeVisible();

    await captureScreenshot(page, "task-4-add-asset-form");
  });

  test("adds a new asset via the add form", async ({ page }) => {
    await page.goto("/?step=assets");

    await page.getByText("+ Add Asset").click();

    const categoryInput = page.getByLabel("New asset category");
    const amountInput = page.getByLabel("New asset amount");

    await categoryInput.fill("Emergency Fund");
    await amountInput.fill("5000");
    await page.getByLabel("Confirm add asset").click();

    // New asset should appear
    await expect(page.getByRole("list", { name: "Asset items" }).getByText("Emergency Fund")).toBeVisible();

    // Total should update (5000 + 22000 + 28000 + 5000 = 60000)
    await expect(page.getByText("Total: $60,000")).toBeVisible();

    await captureScreenshot(page, "task-4-asset-added");
  });

  test("deletes an asset on hover and click", async ({ page }) => {
    await page.goto("/?step=assets");

    const assetList = page.getByRole("list", { name: "Asset items" });

    // Hover over the Savings Account row to reveal the delete button
    const row = assetList.getByRole("listitem").filter({ hasText: "Savings Account" });
    await row.hover();

    const deleteBtn = page.getByLabel("Delete Savings Account");
    await deleteBtn.click();

    // Should be gone from the asset list
    await expect(assetList.getByText("Savings Account")).not.toBeVisible();

    // Total should update (22000 + 28000 = 50000)
    await expect(page.getByText("Total: $50,000")).toBeVisible();

    await captureScreenshot(page, "task-4-asset-deleted");
  });

  test("click-to-edit category shows input with suggestions", async ({
    page,
  }) => {
    await page.goto("/?step=assets");

    await page.getByLabel("Edit category for TFSA").click();

    // Should show an edit input
    const editInput = page.getByLabel("Edit category name");
    await expect(editInput).toBeVisible();

    await captureScreenshot(page, "task-4-edit-category");
  });

  test("click-to-edit amount allows value change", async ({ page }) => {
    await page.goto("/?step=assets");

    await page.getByLabel(/Edit amount for TFSA/).click();

    const editInput = page.getByLabel("Edit amount for TFSA");
    await expect(editInput).toBeVisible();

    // Clear and type new value
    await editInput.fill("40000");
    await editInput.press("Enter");

    // Should show updated value
    await expect(page.getByText("$40,000")).toBeVisible();

    // Total should update (5000 + 40000 + 28000 = 73000)
    await expect(page.getByText("Total: $73,000")).toBeVisible();

    await captureScreenshot(page, "task-4-amount-edited");
  });

  test("shows category suggestions when adding new asset", async ({
    page,
  }) => {
    await page.goto("/?step=assets");

    await page.getByText("+ Add Asset").click();

    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();

    // Should show suggestions dropdown with known categories (buttons include descriptions)
    await expect(page.getByRole("button", { name: /^RRSP Tax-deferred/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /^401k/ })).toBeVisible();

    // Select a suggestion
    await page.getByRole("button", { name: /^RRSP Tax-deferred/ }).click();

    // Category input should have the suggestion value
    await expect(categoryInput).toHaveValue("RRSP");

    await captureScreenshot(page, "task-4-category-suggestions");
  });
});
