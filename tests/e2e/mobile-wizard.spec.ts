import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Mobile wizard (Task 115)", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    // Clear the wizard-done flag to simulate a fresh mobile user
    await page.addInitScript(() => {
      localStorage.removeItem("fhs-wizard-done");
    });
    await page.goto("/");
  });

  test("wizard appears on mobile for new users (no URL state)", async ({ page }) => {
    const wizard = page.getByTestId("mobile-wizard");
    await expect(wizard).toBeVisible();
    await captureScreenshot(page, "task-115-wizard-step1");
  });

  test("shows step 1 (income) first with step label", async ({ page }) => {
    await expect(page.getByTestId("wizard-step-income")).toBeVisible();
    await expect(page.getByTestId("wizard-step-label")).toContainText("Step 1 of 4");
    await expect(page.getByTestId("wizard-step-title")).toContainText("Monthly Income");
  });

  test("next button advances to step 2 (expenses)", async ({ page }) => {
    await page.getByTestId("wizard-next").click();
    await expect(page.getByTestId("wizard-step-expenses")).toBeVisible();
    await expect(page.getByTestId("wizard-step-label")).toContainText("Step 2 of 4");
    await expect(page.getByTestId("wizard-step-title")).toContainText("Monthly Expenses");
  });

  test("can navigate through all 4 steps", async ({ page }) => {
    // Step 1 -> 2
    await page.getByTestId("wizard-next").click();
    await expect(page.getByTestId("wizard-step-expenses")).toBeVisible();

    // Step 2 -> 3
    await page.getByTestId("wizard-next").click();
    await expect(page.getByTestId("wizard-step-assets")).toBeVisible();
    await expect(page.getByTestId("wizard-step-label")).toContainText("Step 3 of 4");

    // Step 3 -> 4 (final step shows "See my snapshot" button)
    await page.getByTestId("wizard-next").click();
    await expect(page.getByTestId("wizard-step-debts")).toBeVisible();
    await expect(page.getByTestId("wizard-complete")).toBeVisible();

    await captureScreenshot(page, "task-115-wizard-step4");
  });

  test("back button returns to previous step", async ({ page }) => {
    await page.getByTestId("wizard-next").click();
    await expect(page.getByTestId("wizard-step-expenses")).toBeVisible();

    await page.getByTestId("wizard-prev").click();
    await expect(page.getByTestId("wizard-step-income")).toBeVisible();
    await expect(page.getByTestId("wizard-step-label")).toContainText("Step 1 of 4");
  });

  test("step 1 has no back button", async ({ page }) => {
    await expect(page.getByTestId("wizard-prev")).not.toBeVisible();
  });

  test("preset buttons set the amount in the income input", async ({ page }) => {
    // Find a preset button with "5k" text in the income step
    const presetButtons = page.getByTestId("wizard-step-income").getByRole("button");
    // Click the $5k preset (second preset: 3k, 5k, 7k, 10k)
    await presetButtons.filter({ hasText: "5k" }).click();
    await expect(page.getByTestId("wizard-income-input")).toHaveValue("5000");

    await captureScreenshot(page, "task-115-wizard-presets");
  });

  test("completing wizard populates URL state and hides wizard", async ({ page }) => {
    // Step 1: income
    await page.getByTestId("wizard-income-input").fill("5000");
    await page.getByTestId("wizard-next").click();

    // Step 2: expenses — fill housing
    await page.getByTestId("wizard-housing-input").fill("1500");
    await page.getByTestId("wizard-next").click();

    // Step 3: assets — fill savings
    await page.getByTestId("wizard-savings-input").fill("10000");
    await page.getByTestId("wizard-next").click();

    // Step 4: complete (no debts)
    await page.getByTestId("wizard-complete").click();

    // Wizard should disappear
    await expect(page.getByTestId("mobile-wizard")).not.toBeVisible();

    // URL should now have ?s= param (state encoded)
    await page.waitForFunction(() => window.location.search.includes("s="));

    await captureScreenshot(page, "task-115-wizard-completed");
  });

  test("skip button dismisses wizard and sets localStorage flag", async ({ page }) => {
    await page.getByTestId("wizard-skip").click();
    await expect(page.getByTestId("mobile-wizard")).not.toBeVisible();

    // localStorage flag should be set
    const flag = await page.evaluate(() => localStorage.getItem("fhs-wizard-done"));
    expect(flag).toBe("1");

    await captureScreenshot(page, "task-115-wizard-skipped");
  });

  test("wizard does not appear when URL state exists", async ({ page }) => {
    // Navigate with existing state param — wizard should not show even on mobile
    await page.goto("/?s=AZGxp!V");
    await expect(page.getByTestId("mobile-wizard")).not.toBeVisible();
  });

  test("wizard does not appear on desktop viewport", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");
    await expect(page.getByTestId("mobile-wizard")).not.toBeVisible();
  });

  test("wizard does not appear when localStorage flag is set", async ({ page }) => {
    // Set the flag before navigation
    await page.addInitScript(() => {
      localStorage.setItem("fhs-wizard-done", "1");
    });
    await page.goto("/");
    await expect(page.getByTestId("mobile-wizard")).not.toBeVisible();
  });

  test("progress bar advances with each step", async ({ page }) => {
    const progress = page.getByTestId("wizard-progress");
    await expect(progress).toBeVisible();
    // Check aria-valuenow
    await expect(progress).toHaveAttribute("aria-valuenow", "1");

    await page.getByTestId("wizard-next").click();
    await expect(progress).toHaveAttribute("aria-valuenow", "2");

    await page.getByTestId("wizard-next").click();
    await expect(progress).toHaveAttribute("aria-valuenow", "3");
  });
});
