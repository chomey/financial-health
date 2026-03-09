import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Expense entry section", () => {
  test("renders expenses with formatted amounts", async ({ page }) => {
    await page.goto("/?step=expenses");

    // INITIAL_STATE: Rent $1,800, Groceries $500, Subscriptions $50
    const expenseList = page.getByRole("list", { name: "Expense items" });
    await expect(expenseList.getByText("Rent/Mortgage Payment")).toBeVisible();
    await expect(expenseList.getByText("Groceries")).toBeVisible();
    await expect(expenseList.getByText("Subscriptions")).toBeVisible();

    await expect(page.getByTestId("expense-monthly-total")).toHaveText("$2,350");

    await captureScreenshot(page, "task-6-expenses-with-mock-data");
  });

  test("shows Add Expense button and opens add form", async ({ page }) => {
    await page.goto("/?step=expenses");

    const addBtn = page.getByText("+ Add Expense");
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    await expect(page.getByLabel("New expense category")).toBeVisible();
    await expect(page.getByLabel("New expense amount")).toBeVisible();

    await captureScreenshot(page, "task-6-add-expense-form");
  });

  test("adds a new expense item via the add form", async ({ page }) => {
    await page.goto("/?step=expenses");

    await page.getByText("+ Add Expense").click();

    const categoryInput = page.getByLabel("New expense category");
    const amountInput = page.getByLabel("New expense amount");

    await categoryInput.fill("Transportation");
    await amountInput.fill("200");
    await page.getByLabel("Confirm add expense").click();

    const expenseList = page.getByRole("list", { name: "Expense items" });
    await expect(expenseList.getByText("Transportation")).toBeVisible();
    await expect(page.getByTestId("expense-monthly-total")).toHaveText("$2,550");

    await captureScreenshot(page, "task-6-expense-added");
  });

  test("deletes an expense item on hover and click", async ({ page }) => {
    await page.goto("/?step=expenses");

    const expenseList = page.getByRole("list", { name: "Expense items" });
    const row = expenseList.getByRole("listitem").filter({ hasText: "Subscriptions" });
    await row.hover();

    await page.getByLabel("Delete Subscriptions").click();

    await expect(expenseList.getByText("Subscriptions")).not.toBeVisible();
    await expect(page.getByTestId("expense-monthly-total")).toHaveText("$2,300");

    await captureScreenshot(page, "task-6-expense-deleted");
  });

  test("click-to-edit amount allows value change", async ({ page }) => {
    await page.goto("/?step=expenses");

    await page.getByLabel(/Edit amount for Groceries/).click();

    const editInput = page.getByLabel("Edit amount for Groceries");
    await expect(editInput).toBeVisible();

    await editInput.fill("700");
    await editInput.press("Enter");

    // Total: 1800 + 700 + 50 = 2550
    await expect(page.getByTestId("expense-monthly-total")).toHaveText("$2,550");

    await captureScreenshot(page, "task-6-expense-amount-edited");
  });

  test("shows category suggestions when adding new expense", async ({
    page,
  }) => {
    await page.goto("/?step=expenses");

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
