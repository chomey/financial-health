import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test("AU tax year choices use fiscal-year labels across the wizard", async ({ page }) => {
  await page.goto("/?step=welcome");
  await page.waitForSelector("[data-testid='country-jurisdiction-selector']");
  await page.getByTestId("country-au").click();

  await expect(page.getByTestId("tax-year-2025")).toHaveText("2024/25 FY");
  await expect(page.getByTestId("tax-year-2026")).toHaveText("2025/26 FY");
  await expect(page.getByTestId("tax-year-2026")).toHaveAccessibleName("Tax year 2025/26 FY");

  await page.getByTestId("wizard-step-profile").click();
  await expect(page.getByTestId("tax-year-2025")).toHaveText("2024/25 FY");
  await expect(page.getByTestId("tax-year-2026")).toHaveText("2025/26 FY");

  await captureScreenshot(page, "task-232-au-tax-year-labels");
});
