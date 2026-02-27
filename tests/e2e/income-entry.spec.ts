import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Income entry section", () => {
  test("renders mock income with formatted amounts", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Monthly Income" })
    ).toBeVisible();

    await expect(page.getByText("Salary")).toBeVisible();
    await expect(page.getByText("Freelance")).toBeVisible();

    await expect(page.getByText("$5,500")).toBeVisible();
    await expect(page.getByText("$800")).toBeVisible();

    await expect(page.getByText("Monthly Total: $6,300")).toBeVisible();

    await captureScreenshot(page, "task-6-income-with-mock-data");
  });

  test("shows Add Income button and opens add form", async ({ page }) => {
    await page.goto("/");

    const addBtn = page.getByText("+ Add Income");
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    await expect(page.getByLabel("New income category")).toBeVisible();
    await expect(page.getByLabel("New income amount")).toBeVisible();

    await captureScreenshot(page, "task-6-add-income-form");
  });

  test("adds a new income item via the add form", async ({ page }) => {
    await page.goto("/");

    await page.getByText("+ Add Income").click();

    const categoryInput = page.getByLabel("New income category");
    const amountInput = page.getByLabel("New income amount");

    await categoryInput.fill("Side Hustle");
    await amountInput.fill("500");
    await page.getByLabel("Confirm add income").click();

    // Scope to income section to avoid matching projection chart text
    const incomeSection = page.locator("section", { has: page.getByRole("heading", { name: "Monthly Income" }) }).first();
    await expect(incomeSection.getByText("Side Hustle")).toBeVisible();
    await expect(incomeSection.getByText("$500")).toBeVisible();
    await expect(incomeSection.getByText("Monthly Total: $6,800")).toBeVisible();

    await captureScreenshot(page, "task-6-income-added");
  });

  test("deletes an income item on hover and click", async ({ page }) => {
    await page.goto("/");

    const row = page
      .getByRole("listitem")
      .filter({ hasText: "Freelance" });
    await row.hover();

    await page.getByLabel("Delete Freelance").click();

    await expect(page.getByText("Freelance")).not.toBeVisible();
    await expect(page.getByText("Monthly Total: $5,500")).toBeVisible();

    await captureScreenshot(page, "task-6-income-deleted");
  });

  test("click-to-edit amount allows value change", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel(/Edit amount for Salary/).click();

    const editInput = page.getByLabel("Edit amount for Salary");
    await expect(editInput).toBeVisible();

    await editInput.fill("6000");
    await editInput.press("Enter");

    await expect(page.getByText("$6,000")).toBeVisible();
    await expect(page.getByText("Monthly Total: $6,800")).toBeVisible();

    await captureScreenshot(page, "task-6-income-amount-edited");
  });

  test("shows category suggestions when adding new income", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByText("+ Add Income").click();

    const categoryInput = page.getByLabel("New income category");
    await categoryInput.click();

    await expect(
      page.getByRole("button", { name: "Salary", exact: true })
    ).toBeVisible();
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
