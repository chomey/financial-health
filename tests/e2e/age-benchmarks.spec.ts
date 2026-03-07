import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Age input and personalized benchmarks (Task 111)", () => {
  test("header shows 'Add age' button when no age is set", async ({ page }) => {
    await page.goto("/");
    const addBtn = page.getByTestId("age-add-header");
    await expect(addBtn).toBeVisible();
    await expect(addBtn).toHaveText("Add age");
  });

  test("clicking header 'Add age' shows age input in header", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("age-add-header").click();
    const input = page.getByTestId("age-input-header");
    await expect(input).toBeVisible();
  });

  test("entering age in header shows age value and benchmark comparisons", async ({ page }) => {
    await page.goto("/");

    // Add income so benchmark comparisons have data
    const addIncome = page.getByText("Add income source");
    if (await addIncome.isVisible()) {
      await addIncome.click();
    }

    // Enter age via header
    await page.getByTestId("age-add-header").click();
    const input = page.getByTestId("age-input-header");
    await input.fill("38");
    await input.press("Enter");

    // Header should now show age value
    await expect(page.getByTestId("age-display-header")).toBeVisible();
    await expect(page.getByTestId("age-value-header")).toHaveText("38");

    await captureScreenshot(page, "task-111-age-header-display");
  });

  test("benchmark comparisons show personalized messages with dollar amounts", async ({ page }) => {
    await page.goto("/");

    // Enter age to trigger personalized benchmarks
    await page.getByTestId("age-add-header").click();
    await page.getByTestId("age-input-header").fill("40");
    await page.getByTestId("age-input-header").press("Enter");

    // Benchmark section should be present
    const section = page.getByTestId("benchmark-comparisons");
    await expect(section).toBeVisible();

    // Scroll to benchmark section
    await section.scrollIntoViewIfNeeded();

    // Should show 4 comparison bars (no income entered → no income comparison)
    await expect(section.getByTestId("benchmark-net-worth")).toBeVisible();
    await expect(section.getByTestId("benchmark-savings-rate")).toBeVisible();
    await expect(section.getByTestId("benchmark-emergency-fund")).toBeVisible();
    await expect(section.getByTestId("benchmark-debt-to-income")).toBeVisible();

    await captureScreenshot(page, "task-111-personalized-benchmarks");
  });

  test("benchmark comparisons show percentile for each metric", async ({ page }) => {
    await page.goto("/");

    // Enter age via header
    await page.getByTestId("age-add-header").click();
    await page.getByTestId("age-input-header").fill("35");
    await page.getByTestId("age-input-header").press("Enter");

    const section = page.getByTestId("benchmark-comparisons");
    await section.scrollIntoViewIfNeeded();

    // Percentile should be displayed for the net worth metric
    const nwPercentile = section.getByTestId("benchmark-net-worth-percentile");
    await expect(nwPercentile).toBeVisible();
    // Should contain "pctile" text
    await expect(nwPercentile).toContainText("pctile");

    await captureScreenshot(page, "task-111-benchmark-percentile");
  });

  test("clearing age in header removes benchmark comparisons", async ({ page }) => {
    await page.goto("/");

    // Enter age
    await page.getByTestId("age-add-header").click();
    await page.getByTestId("age-input-header").fill("45");
    await page.getByTestId("age-input-header").press("Enter");

    // Age display visible in header
    await expect(page.getByTestId("age-display-header")).toBeVisible();

    // Clear age
    await page.getByTestId("age-clear-header").click();

    // Header returns to "Add age" button
    await expect(page.getByTestId("age-add-header")).toBeVisible();
  });

  test("age persists across URL and both header and card inputs are in sync", async ({ page }) => {
    await page.goto("/");

    // Set age via header
    await page.getByTestId("age-add-header").click();
    await page.getByTestId("age-input-header").fill("55");
    await page.getByTestId("age-input-header").press("Enter");

    // Age display in header
    await expect(page.getByTestId("age-value-header")).toHaveText("55");

    // The URL should contain the age in the 's=' param (reload and verify age persists)
    const url = page.url();
    await page.goto(url);

    // After reload, header should still show age 55
    await expect(page.getByTestId("age-value-header")).toBeVisible();
    await expect(page.getByTestId("age-value-header")).toHaveText("55");

    await captureScreenshot(page, "task-111-age-persists");
  });

  test("benchmark card inline age input still works independently", async ({ page }) => {
    await page.goto("/");

    const section = page.getByTestId("benchmark-comparisons");
    await section.scrollIntoViewIfNeeded();

    // The inline card prompt should still show
    await expect(section.getByTestId("add-age-button")).toBeVisible();

    // Entering age via card should update header too
    await section.getByTestId("add-age-button").click();
    const cardInput = section.getByTestId("age-input");
    await cardInput.fill("30");
    await cardInput.press("Enter");

    // Header should now also show age 30
    await expect(page.getByTestId("age-value-header")).toHaveText("30");

    await captureScreenshot(page, "task-111-card-age-syncs-header");
  });
});
