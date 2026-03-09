import { test, expect } from "@playwright/test";
import { captureScreenshot, setSimpleMode } from "./helpers";

test.describe("AssetEntry simple mode home section", () => {
  test("shows Home subsection in simple mode assets step", async ({ page }) => {
    await setSimpleMode(page);
    await page.goto("/?step=assets");
    await page.waitForLoadState("networkidle");

    // Home section should be visible in simple mode
    await expect(page.getByTestId("simple-home-section")).toBeVisible();
    await expect(page.getByText("Optional — leave blank if renting")).toBeVisible();

    await captureScreenshot(page, "task-181-asset-simple-home-section");
  });

  test("hides Home subsection in advanced mode", async ({ page }) => {
    await page.goto("/?step=assets");
    await page.waitForLoadState("networkidle");

    // Switch to advanced mode
    await page.getByTestId("mode-toggle-advanced").click();

    // Home section should not be visible
    await expect(page.getByTestId("simple-home-section")).not.toBeVisible();

    await captureScreenshot(page, "task-181-asset-advanced-mode-no-home-section");
  });

  test("can enter home value in simple mode", async ({ page }) => {
    await setSimpleMode(page);
    await page.goto("/?step=assets");
    await page.waitForLoadState("networkidle");

    // Click to edit the home value
    await page.getByTestId("simple-home-value").click();

    // Input should appear
    const input = page.getByTestId("simple-home-value-input");
    await expect(input).toBeVisible();

    // Enter an amount
    await input.fill("500000");
    await input.press("Enter");

    // Amount should be saved and displayed
    await expect(page.getByTestId("simple-home-value")).toContainText("500,000");

    await captureScreenshot(page, "task-181-asset-simple-home-value-entered");
  });
});
