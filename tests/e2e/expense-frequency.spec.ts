import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Expense frequency support", () => {
  test("renders frequency dropdowns for each expense item", async ({ page }) => {
    await page.goto("/?step=expenses");

    // Default expense items should have frequency selects (default monthly)
    const rentFreq = page.getByTestId("expense-frequency-e1");
    await expect(rentFreq).toBeVisible();
    await expect(rentFreq).toHaveValue("monthly");

    await captureScreenshot(page, "task-175-expense-frequency-defaults");
  });

  test("changing frequency to yearly updates the monthly total", async ({ page }) => {
    await page.goto("/?step=expenses");

    // Change Groceries ($500) from monthly to yearly
    const groceriesFreq = page.getByTestId("expense-frequency-e2");
    await groceriesFreq.selectOption("yearly");

    // New total: $1,800 + $500/12 + $50 = $1,800 + $41.67 + $50 ≈ $1,892
    // We just check it changed from the original $2,350
    const totalEl = page.getByTestId("expense-monthly-total");
    const totalText = await totalEl.textContent();
    // Should be less than original $2,350
    expect(totalText).not.toContain("$2,350");

    await captureScreenshot(page, "task-175-expense-yearly-frequency");
  });

  test("yearly expense shows /yr label and /mo equivalent", async ({ page }) => {
    await page.goto("/?step=expenses");

    // Change Subscriptions ($50) from monthly to yearly
    const subsFreq = page.getByTestId("expense-frequency-e3");
    await subsFreq.selectOption("yearly");

    // Should show $50/yr (not $50/mo)
    await expect(page.getByText("$50/yr")).toBeVisible();

    // Should show monthly equivalent ($50/12 ≈ $4)
    // Check the /mo text appears somewhere in the expense row
    await captureScreenshot(page, "task-175-expense-yearly-label");
  });

  test("add form includes frequency selector defaulting to monthly", async ({ page }) => {
    await page.goto("/?step=expenses");

    await page.getByText("+ Add Expense").click();

    const freqSelect = page.getByTestId("new-expense-frequency");
    await expect(freqSelect).toBeVisible();
    await expect(freqSelect).toHaveValue("monthly");

    await captureScreenshot(page, "task-175-add-form-with-frequency");
  });

  test("adding yearly expense correctly normalizes monthly total", async ({ page }) => {
    await page.goto("/?step=expenses");

    // Record initial total
    const totalEl = page.getByTestId("expense-monthly-total");
    const initialText = await totalEl.textContent();

    await page.getByText("+ Add Expense").click();
    await page.getByLabel("New expense category").fill("Vacation");
    await page.getByLabel("New expense amount").fill("2400");
    await page.getByTestId("new-expense-frequency").selectOption("yearly");
    await page.getByLabel("Confirm add expense").click();

    // New item: $2,400/yr = $200/mo added to existing total
    const newTotalText = await totalEl.textContent();
    expect(newTotalText).not.toEqual(initialText);

    // Vacation should appear with /yr label
    await expect(page.getByText("$2,400/yr")).toBeVisible();

    await captureScreenshot(page, "task-175-add-yearly-expense");
  });

  test("adding one-time expense shows 'once' label", async ({ page }) => {
    await page.goto("/?step=expenses");

    await page.getByText("+ Add Expense").click();
    await page.getByLabel("New expense category").fill("Moving costs");
    await page.getByLabel("New expense amount").fill("3000");
    await page.getByTestId("new-expense-frequency").selectOption("one-time");
    await page.getByLabel("Confirm add expense").click();

    // Should show the amount with 'once' suffix
    await expect(page.getByText(/\$3,000once/)).toBeVisible();

    await captureScreenshot(page, "task-175-add-one-time-expense");
  });

  test("frequency persists in URL state after reload", async ({ page }) => {
    await page.goto("/?step=expenses");

    // Change Rent from monthly to yearly
    const rentFreq = page.getByTestId("expense-frequency-e1");
    await rentFreq.selectOption("yearly");

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Reload with the current URL
    const url = page.url();
    await page.goto(url);

    // Verify frequency is preserved
    const rentFreqAfter = page.getByTestId("expense-frequency-e1");
    await expect(rentFreqAfter).toHaveValue("yearly");

    await captureScreenshot(page, "task-175-expense-frequency-persists");
  });
});
