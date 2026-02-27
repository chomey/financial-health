import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("setState-during-render fix — onChange fires via useEffect", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');
  });

  test("adding an asset updates dashboard without console warnings", async ({ page }) => {
    const consoleWarnings: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning" || msg.type() === "error") {
        consoleWarnings.push(msg.text());
      }
    });

    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // Record initial net worth
    const initialNetWorth = await dashboard.getByLabel(/Net Worth:/).textContent();

    // Add a new asset
    const assetSection = page.locator("text=Assets").locator("..");
    await assetSection.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Test Asset");
    await page.getByLabel("New asset amount").fill("50000");
    await page.getByLabel("Confirm add asset").click();

    // Dashboard should update (onChange fired correctly via useEffect)
    await expect(dashboard.getByLabel(/Net Worth:/)).not.toContainText(initialNetWorth!);

    // No setState-during-render warnings should appear
    const setStateWarnings = consoleWarnings.filter(
      (w) => w.includes("Cannot update") || w.includes("setState") || w.includes("during render")
    );
    expect(setStateWarnings).toHaveLength(0);

    await captureScreenshot(page, "task-16-asset-updates-dashboard");
  });

  test("editing an expense updates surplus without console warnings", async ({ page }) => {
    const consoleWarnings: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning" || msg.type() === "error") {
        consoleWarnings.push(msg.text());
      }
    });

    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');

    // Click on Groceries amount to edit
    const expensesList = page.getByRole("list", { name: "Expense items" });
    const groceriesRow = expensesList.getByRole("listitem").filter({ hasText: "Groceries" });
    await groceriesRow.getByLabel(/Edit amount for Groceries/).click();

    // Change to a different value
    const input = page.getByLabel("Edit amount for Groceries");
    await input.fill("1200");
    await input.press("Enter");

    // Surplus should reflect the change (higher expenses = lower surplus)
    // Original surplus: 6300 - 2950 = 3350
    // New surplus: 6300 - (2200 + 1200 + 150) = 6300 - 3550 = 2750
    await expect(dashboard.getByLabel(/Monthly Surplus:/)).toContainText("$2,750");

    // No setState-during-render warnings
    const setStateWarnings = consoleWarnings.filter(
      (w) => w.includes("Cannot update") || w.includes("setState") || w.includes("during render")
    );
    expect(setStateWarnings).toHaveLength(0);

    await captureScreenshot(page, "task-16-expense-edit-updates-surplus");
  });

  test("deleting a goal triggers onChange without render-phase warnings", async ({ page }) => {
    const consoleWarnings: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning" || msg.type() === "error") {
        consoleWarnings.push(msg.text());
      }
    });

    // Verify initial goal exists
    await expect(page.getByText("Rainy Day Fund")).toBeVisible();

    // Delete it
    const goalsList = page.getByRole("list", { name: "Goal items" });
    const rainyDayRow = goalsList.getByRole("listitem").filter({ hasText: "Rainy Day Fund" });
    await rainyDayRow.hover();
    await rainyDayRow.getByLabel("Delete Rainy Day Fund").click();

    // Goal should be gone
    await expect(page.getByText("Rainy Day Fund")).not.toBeVisible();

    // No setState-during-render warnings
    const setStateWarnings = consoleWarnings.filter(
      (w) => w.includes("Cannot update") || w.includes("setState") || w.includes("during render")
    );
    expect(setStateWarnings).toHaveLength(0);

    await captureScreenshot(page, "task-16-goal-delete-no-warnings");
  });
});
