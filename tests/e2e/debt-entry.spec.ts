import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Debt entry section", () => {
  test("renders debts with formatted amounts", async ({ page }) => {
    await page.goto("/?step=debts");

    // Check mock data rows (INITIAL_STATE: Car Loan $5,000)
    const debtsList = page.getByRole("list", { name: "Debt items" });
    await expect(debtsList.getByText("Car Loan")).toBeVisible();
    await expect(debtsList.getByRole("listitem").filter({ hasText: "Car Loan" })).toContainText("$5,000");

    // Check total
    await expect(page.getByText("Total: $5,000")).toBeVisible();

    await captureScreenshot(page, "task-5-debts-with-mock-data");
  });

  test("shows Add Debt button and opens add form", async ({ page }) => {
    await page.goto("/?step=debts");

    const addBtn = page.getByText("+ Add Debt");
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Form should appear
    await expect(page.getByLabel("New debt category")).toBeVisible();
    await expect(page.getByLabel("New debt amount")).toBeVisible();

    await captureScreenshot(page, "task-5-add-debt-form");
  });

  test("adds a new debt via the add form", async ({ page }) => {
    await page.goto("/?step=debts");

    await page.getByText("+ Add Debt").click();

    const categoryInput = page.getByLabel("New debt category");
    const amountInput = page.getByLabel("New debt amount");

    await categoryInput.fill("Student Loan");
    await amountInput.fill("25000");
    await page.getByLabel("Confirm add debt").click();

    // New debt should appear
    const debtsList = page.getByRole("list", { name: "Debt items" });
    await expect(debtsList.getByText("Student Loan")).toBeVisible();
    await expect(debtsList.getByText("$25,000")).toBeVisible();

    // Total should update (5000 + 25000 = 30000)
    await expect(page.getByText("Total: $30,000")).toBeVisible();

    await captureScreenshot(page, "task-5-debt-added");
  });

  test("deletes a debt on hover and click", async ({ page }) => {
    await page.goto("/?step=debts");

    // Hover over the Car Loan row to reveal the delete button
    const debtsList = page.getByRole("list", { name: "Debt items" });
    const row = debtsList.getByRole("listitem").filter({ hasText: "Car Loan" });
    await row.hover();

    const deleteBtn = page.getByLabel("Delete Car Loan");
    await deleteBtn.click();

    // Should be gone
    await expect(debtsList.getByText("Car Loan")).not.toBeVisible();

    // Total should update (no debts remain)
    await expect(page.getByText("Total: $0")).toBeVisible();

    await captureScreenshot(page, "task-5-debt-deleted");
  });

  test("click-to-edit category shows input with suggestions", async ({
    page,
  }) => {
    await page.goto("/?step=debts");

    await page.getByLabel("Edit category for Car Loan").click();

    // Should show an edit input
    const editInput = page.getByLabel("Edit category name");
    await expect(editInput).toBeVisible();

    await captureScreenshot(page, "task-5-edit-debt-category");
  });

  test("click-to-edit amount allows value change", async ({ page }) => {
    await page.goto("/?step=debts");

    await page.getByLabel(/Edit amount for Car Loan/).click();

    const editInput = page.getByLabel("Edit amount for Car Loan");
    await expect(editInput).toBeVisible();

    // Clear and type new value
    await editInput.fill("3000");
    await editInput.press("Enter");

    // Should show updated value
    await expect(
      page.getByLabel(/Edit amount for Car Loan, currently \$3,000/)
    ).toBeVisible();

    // Total should update
    await expect(page.getByText("Total: $3,000")).toBeVisible();

    await captureScreenshot(page, "task-5-debt-amount-edited");
  });

  test("shows category suggestions when adding new debt", async ({
    page,
  }) => {
    await page.goto("/?step=debts");

    await page.getByText("+ Add Debt").click();

    const categoryInput = page.getByLabel("New debt category");
    await categoryInput.click();

    // Should show suggestions dropdown with known debt categories
    await expect(
      page.getByRole("button", { name: "Student Loan", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Credit Card" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Line of Credit" })
    ).toBeVisible();

    // Select a suggestion
    await page.getByRole("button", { name: "Credit Card" }).click();

    // Category input should have the suggestion value
    await expect(categoryInput).toHaveValue("Credit Card");

    await captureScreenshot(page, "task-5-debt-category-suggestions");
  });
});
