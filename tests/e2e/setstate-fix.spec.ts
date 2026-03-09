import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

async function goToStep(page: import("@playwright/test").Page, step: string) {
  const url = new URL(page.url());
  url.searchParams.set("step", step);
  await page.goto(url.toString());
}

test.describe("setState-during-render fix — onChange fires via useEffect", () => {
  test("adding an asset updates dashboard without console warnings", async ({ page }) => {
    const consoleWarnings: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning" || msg.type() === "error") {
        consoleWarnings.push(msg.text());
      }
    });

    // Start on dashboard to record initial NW
    await page.goto("/?step=dashboard");
    await page.waitForSelector('[data-testid="snapshot-dashboard"]');
    const dashboard = page.locator('[data-testid="snapshot-dashboard"]');
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("$50,000");

    // Add an asset on assets step
    await goToStep(page, "assets");
    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Test Asset");
    await page.getByLabel("New asset amount").fill("50000");
    await page.getByLabel("Confirm add asset").click();

    // Dashboard should update (onChange fired correctly via useEffect)
    await goToStep(page, "dashboard");
    await expect(dashboard.getByLabel(/Net Worth:/)).toContainText("$100,000");

    // No setState-during-render warnings should appear
    const setStateWarnings = consoleWarnings.filter(
      (w) => w.includes("Cannot update") || w.includes("setState") || w.includes("during render")
    );
    expect(setStateWarnings).toHaveLength(0);

    await captureScreenshot(page, "task-16-asset-updates-dashboard");
  });

  test("editing an expense updates without console warnings", async ({ page }) => {
    const consoleWarnings: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning" || msg.type() === "error") {
        consoleWarnings.push(msg.text());
      }
    });

    // Navigate to expenses step to edit Groceries
    await page.goto("/?step=expenses");
    const expensesList = page.getByRole("list", { name: "Expense items" });
    const groceriesRow = expensesList.getByRole("listitem").filter({ hasText: "Groceries" });
    await groceriesRow.getByLabel(/Edit amount for Groceries/).click();

    const input = page.getByLabel("Edit amount for Groceries");
    await input.fill("1200");
    await input.press("Enter");

    // Verify the edit took effect
    await expect(groceriesRow).toContainText("$1,200");

    // No setState-during-render warnings
    const setStateWarnings = consoleWarnings.filter(
      (w) => w.includes("Cannot update") || w.includes("setState") || w.includes("during render")
    );
    expect(setStateWarnings).toHaveLength(0);

    await captureScreenshot(page, "task-16-expense-edit-updates-surplus");
  });
});
