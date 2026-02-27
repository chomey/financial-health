import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Goal entry section", () => {
  test("renders mock goals with progress bars", async ({ page }) => {
    await page.goto("/");

    // Check the heading
    await expect(
      page.getByRole("heading", { name: "Goals" })
    ).toBeVisible();

    // Check mock data (scoped to goals list to avoid matching insight text)
    const goalsList = page.getByRole("list").filter({ hasText: "Rainy Day Fund" });
    await expect(goalsList.getByText("Rainy Day Fund")).toBeVisible();
    await expect(goalsList.getByText("New Car")).toBeVisible();
    await expect(goalsList.getByText("Vacation")).toBeVisible();

    // Check progress bars exist
    const progressBars = page.getByRole("progressbar");
    await expect(progressBars).toHaveCount(3);

    // Check progress values
    await expect(progressBars.nth(0)).toHaveAttribute("aria-valuenow", "73");
    await expect(progressBars.nth(1)).toHaveAttribute("aria-valuenow", "32");
    await expect(progressBars.nth(2)).toHaveAttribute("aria-valuenow", "95");

    await captureScreenshot(page, "task-7-goals-with-mock-data");
  });

  test("shows Add Goal button and opens add form", async ({ page }) => {
    await page.goto("/");

    const addBtn = page.getByText("+ Add Goal");
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Form should appear
    await expect(page.getByLabel("New goal name")).toBeVisible();
    await expect(page.getByLabel("New goal target amount")).toBeVisible();
    await expect(page.getByLabel("New goal current amount")).toBeVisible();

    await captureScreenshot(page, "task-7-add-goal-form");
  });

  test("adds a new goal via the add form", async ({ page }) => {
    await page.goto("/");

    await page.getByText("+ Add Goal").click();

    await page.getByLabel("New goal name").fill("House Down Payment");
    await page.getByLabel("New goal target amount").fill("100000");
    await page.getByLabel("New goal current amount").fill("25000");
    await page.getByLabel("Confirm add goal").click();

    // New goal should appear (scope to goals list to avoid matching projection chart)
    const goalsList = page.getByRole("list", { name: "Goal items" });
    await expect(goalsList.getByText("House Down Payment")).toBeVisible();

    // Should now have 4 goals
    await expect(page.getByRole("progressbar")).toHaveCount(4);

    await captureScreenshot(page, "task-7-goal-added");
  });

  test("deletes a goal on hover and click", async ({ page }) => {
    await page.goto("/");

    // Hover over the Rainy Day Fund goal to reveal the delete button
    const row = page.getByRole("listitem").filter({ hasText: "Rainy Day Fund" });
    await row.hover();

    const deleteBtn = page.getByLabel("Delete Rainy Day Fund");
    await deleteBtn.click();

    // Should be gone
    await expect(page.getByText("Rainy Day Fund")).not.toBeVisible();

    // Should have 2 goals remaining
    await expect(page.getByRole("progressbar")).toHaveCount(2);

    await captureScreenshot(page, "task-7-goal-deleted");
  });

  test("click-to-edit goal name", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel("Edit name for Rainy Day Fund").click();

    const editInput = page.getByLabel("Edit goal name");
    await expect(editInput).toBeVisible();

    await editInput.fill("Safety Net");
    await editInput.press("Enter");

    await expect(page.getByRole("button", { name: "Edit name for Safety Net" })).toBeVisible();

    await captureScreenshot(page, "task-7-edit-goal-name");
  });

  test("click-to-edit saved amount updates progress bar", async ({ page }) => {
    await page.goto("/");

    await page.getByLabel(/Edit saved amount for Rainy Day Fund/).click();

    const editInput = page.getByLabel("Edit saved amount for Rainy Day Fund");
    await expect(editInput).toBeVisible();

    await editInput.fill("18000");
    await editInput.press("Enter");

    // Progress should update: 18000/20000 = 90%
    const progressBar = page.getByRole("progressbar", { name: /Rainy Day Fund/ });
    await expect(progressBar).toHaveAttribute("aria-valuenow", "90");

    await captureScreenshot(page, "task-7-saved-amount-edited");
  });

  test("shows tooltip on hover with percentage and remaining", async ({ page }) => {
    await page.goto("/");

    // Hover over a goal to see tooltip
    const goal = page.getByRole("listitem").filter({ hasText: "New Car" });
    await goal.hover();

    // Should show percentage and remaining
    await expect(page.getByText(/32% complete/)).toBeVisible();
    await expect(page.getByText(/\$28,500 remaining/)).toBeVisible();

    await captureScreenshot(page, "task-7-goal-tooltip");
  });
});
