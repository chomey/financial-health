import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Expense entry section", () => {
  test("renders mock expenses with formatted amounts", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Monthly Expenses" })
    ).toBeVisible();

    await expect(page.getByText("Rent/Mortgage Payment")).toBeVisible();
    await expect(page.getByText("Groceries")).toBeVisible();
    await expect(page.getByText("Subscriptions")).toBeVisible();

    await expect(page.getByText("$2,200")).toBeVisible();
    await expect(page.getByText("$600")).toBeVisible();
    await expect(page.getByText("$150")).toBeVisible();

    await expect(page.getByText("Monthly Total: $2,950")).toBeVisible();

    await captureScreenshot(page, "task-6-expenses-with-mock-data");
  });

  test("shows Add Expense button and opens add form", async ({ page }) => {
    await page.goto("/");

    const addBtn = page.getByText("+ Add Expense");
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    await expect(page.getByLabel("New expense category")).toBeVisible();
    await expect(page.getByLabel("New expense amount")).toBeVisible();

    await captureScreenshot(page, "task-6-add-expense-form");
  });

  test("adds a new expense item via the add form", async ({ page }) => {
    await page.goto("/");

    await page.getByText("+ Add Expense").click();

    const categoryInput = page.getByLabel("New expense category");
    const amountInput = page.getByLabel("New expense amount");

    await categoryInput.fill("Transportation");
    await amountInput.fill("200");
    await page.getByLabel("Confirm add expense").click();

    await expect(page.getByText("Transportation")).toBeVisible();
    await expect(page.getByText("$200")).toBeVisible();
    await expect(page.getByText("Monthly Total: $3,150")).toBeVisible();

    await captureScreenshot(page, "task-6-expense-added");
  });

  test("deletes an expense item on hover and click", async ({ page }) => {
    await page.goto("/");

    const row = page
      .getByRole("listitem")
      .filter({ hasText: "Subscriptions" });
    await row.hover();

    await page.getByLabel("Delete Subscriptions").click();

    await expect(page.getByText("Subscriptions")).not.toBeVisible();
    await expect(page.getByText("Monthly Total: $2,800")).toBeVisible();

    await captureScreenshot(page, "task-6-expense-deleted");
  });

  test("click-to-edit amount allows value change", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel(/Edit amount for Groceries/).click();

    const editInput = page.getByLabel("Edit amount for Groceries");
    await expect(editInput).toBeVisible();

    await editInput.fill("700");
    await editInput.press("Enter");

    await expect(page.getByText("$700")).toBeVisible();
    await expect(page.getByText("Monthly Total: $3,050")).toBeVisible();

    await captureScreenshot(page, "task-6-expense-amount-edited");
  });

  test("shows category suggestions when adding new expense", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByText("+ Add Expense").click();

    const categoryInput = page.getByLabel("New expense category");
    await categoryInput.click();

    await expect(
      page.getByRole("button", { name: "Childcare" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Insurance" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Utilities" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Insurance" }).click();

    await expect(categoryInput).toHaveValue("Insurance");

    await captureScreenshot(page, "task-6-expense-category-suggestions");
  });
});
