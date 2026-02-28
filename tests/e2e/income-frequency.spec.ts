import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Income frequency support", () => {
  test("renders frequency dropdowns for each income item", async ({ page }) => {
    await page.goto("/");

    // Both default income items should have frequency selects
    const salaryFreq = page.getByTestId("frequency-i1");
    const freelanceFreq = page.getByTestId("frequency-i2");

    await expect(salaryFreq).toBeVisible();
    await expect(freelanceFreq).toBeVisible();

    // Default should be monthly
    await expect(salaryFreq).toHaveValue("monthly");
    await expect(freelanceFreq).toHaveValue("monthly");

    await captureScreenshot(page, "task-30-income-frequency-defaults");
  });

  test("changing frequency updates the monthly total", async ({ page }) => {
    await page.goto("/");

    // Change Salary ($5,500) from monthly to annually
    const salaryFreq = page.getByTestId("frequency-i1");
    await salaryFreq.selectOption("annually");

    // Monthly total should be ~$5500/12 + $800 = ~$1,258
    const totalEl = page.getByTestId("income-monthly-total");
    await expect(totalEl).toHaveText("$1,258");

    await captureScreenshot(page, "task-30-frequency-changed-to-annually");
  });

  test("changing frequency to weekly shows correct normalized total", async ({ page }) => {
    await page.goto("/");

    // Change Freelance ($800) from monthly to weekly
    const freelanceFreq = page.getByTestId("frequency-i2");
    await freelanceFreq.selectOption("weekly");

    // $800 * 52/12 = $3,466.67 → $3,467 + $5,500 = $8,967
    const totalEl = page.getByTestId("income-monthly-total");
    await expect(totalEl).toHaveText("$8,967");

    await captureScreenshot(page, "task-30-frequency-weekly");
  });

  test("add form includes frequency selector", async ({ page }) => {
    await page.goto("/");

    await page.getByText("+ Add Income").click();

    const freqSelect = page.getByTestId("new-income-frequency");
    await expect(freqSelect).toBeVisible();
    await expect(freqSelect).toHaveValue("monthly");

    await captureScreenshot(page, "task-30-add-form-with-frequency");
  });

  test("adding new item with non-monthly frequency normalizes total", async ({ page }) => {
    await page.goto("/");

    await page.getByText("+ Add Income").click();

    await page.getByLabel("New income category").fill("Dividends");
    await page.getByLabel("New income amount").fill("3000");
    await page.getByTestId("new-income-frequency").selectOption("quarterly");
    await page.getByLabel("Confirm add income").click();

    // New item: $3000 quarterly = $1000/mo
    // Total: $5,500 + $800 + $1,000 = $7,300
    const totalEl = page.getByTestId("income-monthly-total");
    await expect(totalEl).toHaveText("$7,300");

    // Verify the new item shows quarterly frequency
    const newItemFreq = page.locator('[data-testid^="frequency-"]').last();
    await expect(newItemFreq).toHaveValue("quarterly");

    await captureScreenshot(page, "task-30-new-quarterly-income");
  });

  test("frequency persists in URL state after reload", async ({ page }) => {
    await page.goto("/");

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
    await page.goto("/");

    // Record the initial Monthly Surplus value
    const surplusCard = page.getByRole("group", { name: "Monthly Surplus" });
    const initialSurplus = await surplusCard.textContent();

    // Change Salary to annually (drastically reduces monthly income)
    const salaryFreq = page.getByTestId("frequency-i1");
    await salaryFreq.selectOption("annually");

    // Wait for re-render
    await page.waitForTimeout(300);

    // Monthly surplus should have changed
    const surplusCardAfter = page.getByRole("group", { name: "Monthly Surplus" });
    const newSurplus = await surplusCardAfter.textContent();
    expect(newSurplus).not.toEqual(initialSurplus);

    await captureScreenshot(page, "task-30-dashboard-updates-with-frequency");
  });
});
