import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Income entry section", () => {
  test("renders income with formatted amounts", async ({ page }) => {
    await page.goto("/?step=income");

    // INITIAL_STATE: Salary $4,500
    const incomeList = page.getByRole("list", { name: "Income items" });
    await expect(incomeList.getByText("Salary")).toBeVisible();
    await expect(incomeList.getByText("$4,500")).toBeVisible();

    await expect(page.getByTestId("income-monthly-total")).toHaveText("$4,500");

    await captureScreenshot(page, "task-6-income-with-mock-data");
  });

  test("shows Add Income button and opens add form", async ({ page }) => {
    await page.goto("/?step=income");

    const addBtn = page.getByText("+ Add Income");
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    await expect(page.getByLabel("New income category")).toBeVisible();
    await expect(page.getByLabel("New income amount")).toBeVisible();

    await captureScreenshot(page, "task-6-add-income-form");
  });

  test("adds a new income item via the add form", async ({ page }) => {
    await page.goto("/?step=income");

    await page.getByText("+ Add Income").click();

    const categoryInput = page.getByLabel("New income category");
    const amountInput = page.getByLabel("New income amount");

    await categoryInput.fill("Side Hustle");
    await amountInput.fill("500");
    await page.getByLabel("Confirm add income").click();

    const incomeList = page.getByRole("list", { name: "Income items" });
    await expect(incomeList.getByText("Side Hustle")).toBeVisible();
    await expect(page.getByTestId("income-monthly-total")).toHaveText("$5,000");

    await captureScreenshot(page, "task-6-income-added");
  });

  test("deletes an income item on hover and click", async ({ page }) => {
    await page.goto("/?step=income");

    const incomeList = page.getByRole("list", { name: "Income items" });
    const row = incomeList.getByRole("listitem").filter({ hasText: "Salary" });
    await row.hover();

    await page.getByLabel("Delete Salary").click();

    await expect(incomeList.getByText("Salary")).not.toBeVisible();

    await captureScreenshot(page, "task-6-income-deleted");
  });

  test("click-to-edit amount allows value change", async ({ page }) => {
    await page.goto("/?step=income");

    await page.getByLabel(/Edit amount for Salary/).click();

    const editInput = page.getByLabel("Edit amount for Salary");
    await expect(editInput).toBeVisible();

    await editInput.fill("6000");
    await editInput.press("Enter");

    await expect(page.getByTestId("income-monthly-total")).toHaveText("$6,000");

    await captureScreenshot(page, "task-6-income-amount-edited");
  });

  test("shows category suggestions when adding new income", async ({
    page,
  }) => {
    await page.goto("/?step=income");

    await page.getByText("+ Add Income").click();

    const categoryInput = page.getByLabel("New income category");
    await categoryInput.click();

    await expect(
      page.getByRole("button", { name: "Freelance", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Investment Income" })
    ).toBeVisible();

    await page.getByRole("button", { name: "Side Hustle" }).click();

    await expect(categoryInput).toHaveValue("Side Hustle");

    await captureScreenshot(page, "task-6-income-category-suggestions");
  });
});
