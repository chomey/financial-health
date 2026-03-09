import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Benchmark Comparisons", () => {
  test("renders benchmark section with prompt when no age set", async ({ page }) => {
    await page.goto("/");
    const section = page.getByTestId("benchmark-comparisons");
    await expect(section).toBeVisible();
    await expect(section.getByText("How You Compare")).toBeVisible();
    // No age set by default → shows prompt to set age
    await expect(section.getByText(/Set your age/)).toBeVisible();
  });

  test("shows benchmark comparisons when age is set via profile", async ({ page }) => {
    // Set age via profile wizard step first
    await page.goto("/?step=profile");
    await page.getByTestId("wizard-age-input").fill("30");
    await page.waitForTimeout(500);

    // Capture URL with state and navigate to dashboard
    const stateUrl = page.url();
    // Replace step=profile with no step to go to dashboard
    const dashUrl = stateUrl.replace(/step=profile&?/, "").replace(/&$/, "");
    await page.goto(dashUrl);

    const section = page.getByTestId("benchmark-comparisons");
    // Should show comparison bars
    await expect(section.getByTestId("benchmark-net-worth")).toBeVisible();
    await expect(section.getByTestId("benchmark-savings-rate")).toBeVisible();
    await expect(section.getByTestId("benchmark-emergency-fund")).toBeVisible();
    await expect(section.getByTestId("benchmark-debt-to-income")).toBeVisible();

    // Age display should show
    await expect(section.getByText("Age 30")).toBeVisible();

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
    // Set age via profile
    await page.goto("/?step=profile");
    await page.getByTestId("wizard-age-input").fill("45");
    await page.waitForTimeout(500);

    // Capture URL with state and navigate to dashboard
    const stateUrl = page.url();
    const dashUrl = stateUrl.replace(/step=profile&?/, "").replace(/&$/, "");
    await page.goto(dashUrl);
    await page.waitForFunction(() => window.location.search.includes("s="));

    // Reload
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Age should be preserved in benchmarks
    const section = page.getByTestId("benchmark-comparisons");
    await expect(section.getByText("Age 45")).toBeVisible();
    await expect(section.getByTestId("benchmark-net-worth")).toBeVisible();

    await captureScreenshot(page, "task-52-benchmark-url-persistence");
  });
});
