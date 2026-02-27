import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Asset entry section", () => {
  test("renders mock assets with formatted amounts", async ({ page }) => {
    await page.goto("/");

    // Check the heading
    await expect(
      page.getByRole("heading", { name: "Assets" })
    ).toBeVisible();

    // Check mock data rows
    await expect(page.getByText("Savings Account")).toBeVisible();
    await expect(page.getByText("TFSA")).toBeVisible();
    await expect(page.getByText("Brokerage")).toBeVisible();

    // Check formatted amounts
    await expect(page.getByText("$12,000")).toBeVisible();
    await expect(page.getByText("$35,000")).toBeVisible();
    await expect(page.getByText("$18,500")).toBeVisible();

    // Check total
    await expect(page.getByText("Total: $65,500")).toBeVisible();

    await captureScreenshot(page, "task-4-assets-with-mock-data");
  });

  test("shows Add Asset button and opens add form", async ({ page }) => {
    await page.goto("/");

    const addBtn = page.getByText("+ Add Asset");
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Form should appear
    await expect(page.getByLabel("New asset category")).toBeVisible();
    await expect(page.getByLabel("New asset amount")).toBeVisible();

    await captureScreenshot(page, "task-4-add-asset-form");
  });

  test("adds a new asset via the add form", async ({ page }) => {
    await page.goto("/");

    await page.getByText("+ Add Asset").click();

    const categoryInput = page.getByLabel("New asset category");
    const amountInput = page.getByLabel("New asset amount");

    await categoryInput.fill("Emergency Fund");
    await amountInput.fill("5000");
    await page.getByLabel("Confirm add asset").click();

    // New asset should appear
    await expect(page.getByText("Emergency Fund")).toBeVisible();
    await expect(page.getByText("$5,000")).toBeVisible();

    // Total should update
    await expect(page.getByText("Total: $70,500")).toBeVisible();

    await captureScreenshot(page, "task-4-asset-added");
  });

  test("deletes an asset on hover and click", async ({ page }) => {
    await page.goto("/");

    // Hover over the Savings Account row to reveal the delete button
    const row = page.getByRole("listitem").filter({ hasText: "Savings Account" });
    await row.hover();

    const deleteBtn = page.getByLabel("Delete Savings Account");
    await deleteBtn.click();

    // Should be gone
    await expect(page.getByText("Savings Account")).not.toBeVisible();

    // Total should update
    await expect(page.getByText("Total: $53,500")).toBeVisible();

    await captureScreenshot(page, "task-4-asset-deleted");
  });

  test("click-to-edit category shows input with suggestions", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByLabel("Edit category for TFSA").click();

    // Should show an edit input
    const editInput = page.getByLabel("Edit category name");
    await expect(editInput).toBeVisible();

    await captureScreenshot(page, "task-4-edit-category");
  });

  test("click-to-edit amount allows value change", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel(/Edit amount for TFSA/).click();

    const editInput = page.getByLabel("Edit amount for TFSA");
    await expect(editInput).toBeVisible();

    // Clear and type new value
    await editInput.fill("40000");
    await editInput.press("Enter");

    // Should show updated value
    await expect(page.getByText("$40,000")).toBeVisible();

    // Total should update (12000 + 40000 + 18500 = 70500)
    await expect(page.getByText("Total: $70,500")).toBeVisible();

    await captureScreenshot(page, "task-4-amount-edited");
  });

  test("shows category suggestions when adding new asset", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByText("+ Add Asset").click();

    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();

    // Should show suggestions dropdown with known categories
    await expect(page.getByRole("button", { name: "RRSP" })).toBeVisible();
    await expect(page.getByRole("button", { name: "401k" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Savings", exact: true })
    ).toBeVisible();

    // Select a suggestion
    await page.getByRole("button", { name: "RRSP" }).click();

    // Category input should have the suggestion value
    await expect(categoryInput).toHaveValue("RRSP");

    await captureScreenshot(page, "task-4-category-suggestions");
  });
});
