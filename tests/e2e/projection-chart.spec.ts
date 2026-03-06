import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Projection Chart", () => {
  test("renders the projection chart section", async ({ page }) => {
    await page.goto("/");
    const chart = page.getByTestId("projection-chart");
    await expect(chart).toBeVisible();

    // Verify heading
    await expect(chart.getByText("Financial Projection")).toBeVisible();

    // Verify scenario buttons
    await expect(chart.getByTestId("scenario-conservative")).toBeVisible();
    await expect(chart.getByTestId("scenario-moderate")).toBeVisible();
    await expect(chart.getByTestId("scenario-optimistic")).toBeVisible();

    // Verify chart container
    await expect(chart.getByTestId("projection-chart-container")).toBeVisible();

    await captureScreenshot(page, "task-25-projection-chart-loaded");
  });

  test("scenario buttons toggle active state", async ({ page }) => {
    await page.goto("/");
    const chart = page.getByTestId("projection-chart");

    // Moderate should be active by default (has colored background)
    const moderateBtn = chart.getByTestId("scenario-moderate");
    await expect(moderateBtn).toHaveCSS("background-color", "rgb(16, 185, 129)");

    // Click conservative — clicking opens ZoomableCard overlay, close it first
    const conservativeBtn = chart.getByTestId("scenario-conservative");
    await conservativeBtn.click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    await expect(conservativeBtn).toHaveCSS("background-color", "rgb(245, 158, 11)");

    // Click optimistic
    const optimisticBtn = chart.getByTestId("scenario-optimistic");
    await optimisticBtn.click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(200);
    await expect(optimisticBtn).toHaveCSS("background-color", "rgb(59, 130, 246)");

    await captureScreenshot(page, "task-25-scenario-optimistic");
  });

  test("chart legend is visible", async ({ page }) => {
    await page.goto("/");
    const chart = page.getByTestId("projection-chart");

    await expect(chart.getByText("Net Worth", { exact: true }).first()).toBeVisible();
    await expect(chart.getByText("Assets", { exact: true }).first()).toBeVisible();
    await expect(chart.getByText("Debts", { exact: true }).first()).toBeVisible();
  });

  test("projection section has correct aria label", async ({ page }) => {
    await page.goto("/");
    const section = page.getByRole("region", { name: "Financial projection", exact: true });
    await expect(section.first()).toBeVisible();
  });
});
