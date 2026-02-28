import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Benchmark Comparisons", () => {
  test("renders benchmark section with add-age prompt", async ({ page }) => {
    await page.goto("/");
    const section = page.getByTestId("benchmark-comparisons");
    await expect(section).toBeVisible();
    await expect(section.getByText("How You Compare")).toBeVisible();
    await expect(section.getByTestId("add-age-button")).toBeVisible();
    await expect(section.getByText("Enter your age to see personalized benchmarks")).toBeVisible();
  });

  test("entering age shows benchmark comparisons", async ({ page }) => {
    await page.goto("/");
    const section = page.getByTestId("benchmark-comparisons");

    // Click add age button
    await section.getByTestId("add-age-button").click();
    const input = section.getByTestId("age-input");
    await expect(input).toBeVisible();

    // Type age and submit
    await input.fill("30");
    await input.press("Enter");

    // Should show 4 comparison bars
    await expect(section.getByTestId("benchmark-net-worth")).toBeVisible();
    await expect(section.getByTestId("benchmark-savings-rate")).toBeVisible();
    await expect(section.getByTestId("benchmark-emergency-fund")).toBeVisible();
    await expect(section.getByTestId("benchmark-debt-to-income")).toBeVisible();

    // Age display should show
    await expect(section.getByTestId("age-display")).toHaveText("30");

    await captureScreenshot(page, "task-52-benchmark-comparisons-age-30");
  });

  test("info button shows data sources", async ({ page }) => {
    await page.goto("/");
    const section = page.getByTestId("benchmark-comparisons");

    // Click info button
    await section.getByTestId("benchmark-info-button").click();
    const sources = section.getByTestId("benchmark-sources");
    await expect(sources).toBeVisible();
    await expect(sources.getByText("Data Sources")).toBeVisible();
    await expect(sources.getByText(/Statistics Canada/)).toBeVisible();

    await captureScreenshot(page, "task-52-benchmark-data-sources");
  });

  test("age persists in URL across page reload", async ({ page }) => {
    await page.goto("/");
    const section = page.getByTestId("benchmark-comparisons");

    // Enter age
    await section.getByTestId("add-age-button").click();
    await section.getByTestId("age-input").fill("45");
    await section.getByTestId("age-input").press("Enter");

    // Wait for URL update
    await page.waitForTimeout(500);

    // Reload
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Age should be preserved
    const sectionAfter = page.getByTestId("benchmark-comparisons");
    await expect(sectionAfter.getByTestId("age-display")).toHaveText("45");
    await expect(sectionAfter.getByTestId("benchmark-net-worth")).toBeVisible();

    await captureScreenshot(page, "task-52-benchmark-url-persistence");
  });

  test("removing age hides comparisons", async ({ page }) => {
    await page.goto("/");
    const section = page.getByTestId("benchmark-comparisons");

    // Enter age
    await section.getByTestId("add-age-button").click();
    await section.getByTestId("age-input").fill("30");
    await section.getByTestId("age-input").press("Enter");

    // Verify comparisons visible
    await expect(section.getByTestId("benchmark-net-worth")).toBeVisible();

    // Remove age
    await section.getByTestId("remove-age-button").click();

    // Comparisons should be gone, add-age button back
    await expect(section.getByTestId("add-age-button")).toBeVisible();
    await expect(section.getByTestId("benchmark-net-worth")).not.toBeVisible();
  });

  test("switching country updates benchmark sources", async ({ page }) => {
    await page.goto("/");
    const section = page.getByTestId("benchmark-comparisons");

    // Enter age
    await section.getByTestId("add-age-button").click();
    await section.getByTestId("age-input").fill("35");
    await section.getByTestId("age-input").press("Enter");

    // Show info for CA (default)
    await section.getByTestId("benchmark-info-button").click();
    await expect(section.getByTestId("benchmark-sources").getByText(/Statistics Canada/)).toBeVisible();

    // Switch to US
    await page.getByLabel("Select United States").click();

    // Source should update
    await expect(section.getByTestId("benchmark-sources").getByText(/Federal Reserve/)).toBeVisible();

    await captureScreenshot(page, "task-52-benchmark-us-sources");
  });
});
