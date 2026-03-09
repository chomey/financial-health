/**
 * Simple mode smoke tests — verify the key deltas from advanced mode.
 * Not exhaustive; just checks that simple mode renders correctly
 * and doesn't break core functionality.
 */
import { test, expect } from "@playwright/test";
import { captureScreenshot, setSimpleMode } from "./helpers";

test.describe("Simple mode smoke", () => {
  test.beforeEach(async ({ page }) => {
    await setSimpleMode(page);
  });

  test("dashboard renders with 4 sections and 3 metric cards", async ({ page }) => {
    await page.goto("/?step=dashboard");
    await page.waitForLoadState("networkidle");

    // 4 nav sections (not 8)
    const stepper = page.getByRole("navigation", { name: "Dashboard sections" });
    await expect(stepper.getByRole("button")).toHaveCount(4);

    // 3 metric cards (not full set)
    const dashboard = page.getByTestId("snapshot-dashboard");
    await expect(dashboard.locator("[data-testid^='metric-card-']")).toHaveCount(3);

    // Upgrade banner visible
    await expect(page.getByTestId("simple-mode-upgrade-banner")).toBeVisible();
  });

  test("wizard has 6 steps, not 9", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    const stepper = page.getByRole("navigation", { name: "Wizard steps" });
    await expect(stepper.getByRole("listitem")).toHaveCount(6);
  });

  test("asset entry hides ROI, tax treatment, and employer match", async ({ page }) => {
    await page.goto("/?step=assets");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("roi-input")).not.toBeVisible();
    await expect(page.getByTestId("tax-treatment-pill")).not.toBeVisible();
    await expect(page.getByTestId("employer-match-toggle")).not.toBeVisible();
  });

  test("income entry hides income type selector", async ({ page }) => {
    await page.goto("/?step=income");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("income-type-select")).not.toBeVisible();
  });

  test("switching to advanced reveals all sections", async ({ page }) => {
    await page.goto("/?step=dashboard");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("mode-toggle-advanced").click();

    const stepper = page.getByRole("navigation", { name: "Dashboard sections" });
    await expect(stepper.getByRole("button")).toHaveCount(8);
    await expect(page.getByTestId("simple-mode-upgrade-banner")).not.toBeVisible();
  });

  test("quick-start profile loads and reaches dashboard", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    const renterProfile = page.getByTestId("sample-profile-ca-renter");
    await expect(renterProfile).toBeVisible();
    await renterProfile.click();

    await page.waitForFunction(() => window.location.search.includes("s="));
    await expect(page.getByTestId("snapshot-dashboard")).toBeVisible();
  });
});
