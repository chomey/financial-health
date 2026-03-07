import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Fast Forward Enhanced Scenarios", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    // Expand the Fast Forward panel
    await page.getByTestId("fast-forward-toggle").click();
    await expect(page.getByTestId("fast-forward-panel")).toBeVisible();
  });

  test("shows scenario preset buttons", async ({ page }) => {
    const presets = page.getByTestId("scenario-presets");
    await expect(presets).toBeVisible();
    await expect(page.getByTestId("preset-conservative")).toBeVisible();
    await expect(page.getByTestId("preset-aggressive-saver")).toBeVisible();
    await expect(page.getByTestId("preset-early-retirement")).toBeVisible();
    await captureScreenshot(page, "task-106-presets");
  });

  test("conservative preset activates ROI adjustment", async ({ page }) => {
    await page.getByTestId("preset-conservative").click();
    // Should show scenario comparison results
    await expect(page.getByTestId("scenario-comparison")).toBeVisible();
    // ROI adjustment slider should reflect -2
    const roiSection = page.getByTestId("roi-adjustment");
    await expect(roiSection).toBeVisible();
    await captureScreenshot(page, "task-106-conservative-preset");
  });

  test("early-retirement preset activates retire today", async ({ page }) => {
    await page.getByTestId("preset-early-retirement").click();
    await expect(page.getByTestId("scenario-comparison")).toBeVisible();
    // Should show runway estimate
    await expect(page.getByTestId("runway-estimate")).toBeVisible();
    await captureScreenshot(page, "task-106-early-retirement");
  });

  test("clicking same preset again deactivates it", async ({ page }) => {
    await page.getByTestId("preset-conservative").click();
    await expect(page.getByTestId("scenario-comparison")).toBeVisible();
    // Click again to deactivate
    await page.getByTestId("preset-conservative").click();
    await expect(page.getByTestId("scenario-comparison")).not.toBeVisible();
  });

  test("retire today toggle zeros income and shows runway", async ({ page }) => {
    const retireSection = page.getByTestId("retire-today");
    await expect(retireSection).toBeVisible();
    await page.getByTestId("retire-today-checkbox").check();
    // Should show comparison with runway
    await expect(page.getByTestId("scenario-comparison")).toBeVisible();
    await expect(page.getByTestId("runway-estimate")).toBeVisible();
    await expect(page.getByTestId("runway-estimate")).toContainText("savings would last");
    await captureScreenshot(page, "task-106-retire-today");
  });

  test("ROI adjustment slider changes scenario", async ({ page }) => {
    const slider = page.getByTestId("roi-adjustment-slider");
    await expect(slider).toBeVisible();
    // Set slider to -3
    await slider.fill("-3");
    await expect(page.getByTestId("scenario-comparison")).toBeVisible();
    await captureScreenshot(page, "task-106-roi-adjustment");
  });

  test("reset button clears all modifications", async ({ page }) => {
    // Apply a preset
    await page.getByTestId("preset-conservative").click();
    await expect(page.getByTestId("scenario-comparison")).toBeVisible();
    // Click reset
    await page.getByTestId("reset-scenario").click();
    await expect(page.getByTestId("scenario-comparison")).not.toBeVisible();
  });
});
