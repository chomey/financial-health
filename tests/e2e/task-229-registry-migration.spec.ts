import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Task 229: country registry consumer migration", () => {
  test("dashboard renders after migration with CA defaults", async ({ page }) => {
    await page.goto("/?step=dashboard");
    await expect(page.getByTestId("metric-card-estimated-tax")).toBeVisible();
    await captureScreenshot(page, "task-229-dashboard-ca");
  });

  test("flowchart renders r/PersonalFinanceCanada link for CA", async ({ page }) => {
    await page.goto("/?step=dashboard");
    const flowchart = page.getByTestId("financial-flowchart");
    await expect(flowchart).toBeVisible();
    await expect(flowchart.getByRole("link", { name: "r/PersonalFinanceCanada" })).toBeVisible();
    await captureScreenshot(page, "task-229-flowchart-ca");
  });

  test("tax summary in wizard uses Provincial label for CA", async ({ page }) => {
    await page.goto("/?step=tax-summary");
    await expect(page.getByText("Provincial")).toBeVisible();
    await captureScreenshot(page, "task-229-wizard-tax-summary-ca");
  });
});
