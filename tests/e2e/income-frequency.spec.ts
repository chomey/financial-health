import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Income frequency support", () => {
  test("renders frequency dropdowns for each income item", async ({ page }) => {
    await page.goto("/?step=income");

    // Default income item should have frequency select
    const salaryFreq = page.getByTestId("frequency-i1");

    await expect(salaryFreq).toBeVisible();

    // Default should be monthly
    await expect(salaryFreq).toHaveValue("monthly");

    await captureScreenshot(page, "task-30-income-frequency-defaults");
  });

  test("changing frequency updates the monthly total", async ({ page }) => {
    await page.goto("/?step=income");

    // Change Salary ($4,500) from monthly to annually
    const salaryFreq = page.getByTestId("frequency-i1");
    await salaryFreq.selectOption("annually");

    // Monthly total should be $4500/12 = $375
    const totalEl = page.getByTestId("income-monthly-total");
    await expect(totalEl).toHaveText("$375");

    await captureScreenshot(page, "task-30-frequency-changed-to-annually");
  });

  test("changing frequency to weekly shows correct normalized total", async ({ page }) => {
    await page.goto("/?step=income");

    // Change Salary ($4,500) from monthly to weekly
    const salaryFreq = page.getByTestId("frequency-i1");
    await salaryFreq.selectOption("weekly");

    // $4500 * 52/12 = $19,500
    const totalEl = page.getByTestId("income-monthly-total");
    await expect(totalEl).toHaveText("$19,500");

    await captureScreenshot(page, "task-30-frequency-weekly");
  });

  test("add form includes frequency selector", async ({ page }) => {
    await page.goto("/?step=income");

    await page.getByText("+ Add Income").click();

    const freqSelect = page.getByTestId("new-income-frequency");
    await expect(freqSelect).toBeVisible();
    await expect(freqSelect).toHaveValue("monthly");

    await captureScreenshot(page, "task-30-add-form-with-frequency");
  });

  test("adding new item with non-monthly frequency normalizes total", async ({ page }) => {
    await page.goto("/?step=income");

    await page.getByText("+ Add Income").click();

    await page.getByLabel("New income category").fill("Dividends");
    await page.getByLabel("New income amount").fill("3000");
    await page.getByTestId("new-income-frequency").selectOption("quarterly");
    await page.getByLabel("Confirm add income").click();

    // New item: $3000 quarterly = $1000/mo
    // Total: $4,500 + $1,000 = $5,500
    const totalEl = page.getByTestId("income-monthly-total");
    await expect(totalEl).toHaveText("$5,500");

    // Verify the new item shows quarterly frequency
    const newItemFreq = page.locator('[data-testid^="frequency-"]').last();
    await expect(newItemFreq).toHaveValue("quarterly");

    await captureScreenshot(page, "task-30-new-quarterly-income");
  });

  test("frequency persists in URL state after reload", async ({ page }) => {
    await page.goto("/?step=income");

    // Change Salary from monthly to biweekly
    const salaryFreq = page.getByTestId("frequency-i1");
    await salaryFreq.selectOption("biweekly");

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Reload the page
    const url = page.url();
    await page.goto(url);

    // Verify frequency is preserved
    const salaryFreqAfter = page.getByTestId("frequency-i1");
    await expect(salaryFreqAfter).toHaveValue("biweekly");

    await captureScreenshot(page, "task-30-frequency-persists-reload");
  });

  test("dashboard metrics update when frequency changes", async ({ page }) => {
    // Go to dashboard first to check initial Monthly Cash Flow
    await page.goto("/?step=dashboard");
    const surplusCard = page.getByRole("group", { name: "Monthly Cash Flow" });
    await expect(surplusCard).toBeVisible();
    const initialSurplus = await surplusCard.textContent();

    // Switch to income step and change Salary to annually
    await page.goto("/?step=income");
    const salaryFreq = page.getByTestId("frequency-i1");
    await salaryFreq.selectOption("annually");

    // Wait for state to persist, then go to dashboard
    await page.waitForTimeout(300);
    await page.getByTestId("wizard-skip-to-dashboard").click();
    await page.waitForTimeout(300);

    // Monthly surplus should have changed
    const surplusCardAfter = page.getByRole("group", { name: "Monthly Cash Flow" });
    const newSurplus = await surplusCardAfter.textContent();
    expect(newSurplus).not.toEqual(initialSurplus);

    await captureScreenshot(page, "task-30-dashboard-updates-with-frequency");
  });
});
