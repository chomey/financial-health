import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Tax Year Selector", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("fhs-wizard-done", "1");
    });
    await page.goto("/?step=profile");
    await page.waitForSelector('[data-testid="wizard-step-profile"]');
  });

  test("renders 2025 and 2026 tax year buttons", async ({ page }) => {
    const btn2025 = page.getByTestId("tax-year-2025");
    const btn2026 = page.getByTestId("tax-year-2026");

    await expect(btn2025).toBeVisible();
    await expect(btn2026).toBeVisible();
    // Default tax year is the current year (2026)
    await expect(btn2026).toHaveAttribute("aria-pressed", "true");
    await expect(btn2025).toHaveAttribute("aria-pressed", "false");

    await captureScreenshot(page, "task-153-tax-year-default");
  });

  test("switching tax year updates button state", async ({ page }) => {
    const btn2025 = page.getByTestId("tax-year-2025");
    const btn2026 = page.getByTestId("tax-year-2026");

    await btn2026.click();
    await expect(btn2026).toHaveAttribute("aria-pressed", "true");
    await expect(btn2025).toHaveAttribute("aria-pressed", "false");

    await captureScreenshot(page, "task-153-tax-year-2026");

    await btn2025.click();
    await expect(btn2025).toHaveAttribute("aria-pressed", "true");
    await expect(btn2026).toHaveAttribute("aria-pressed", "false");
  });

  test("tax year persists in URL state", async ({ page }) => {
    await page.getByTestId("tax-year-2026").click();
    await page.waitForTimeout(500);

    const url = page.url();
    await page.goto(url);
    await page.waitForSelector('[data-testid="tax-year-2026"]');

    const btn2026 = page.getByTestId("tax-year-2026");
    await expect(btn2026).toHaveAttribute("aria-pressed", "true");
  });
});
