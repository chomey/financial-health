import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Mode toggle", () => {
  test("defaults to simple mode — AppHeader shows Simple active", async ({ page }) => {
    await page.goto("/?step=dashboard");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("mode-toggle")).toBeVisible();
    const simpleBtn = page.getByTestId("mode-toggle-simple");
    const advancedBtn = page.getByTestId("mode-toggle-advanced");
    await expect(simpleBtn).toBeVisible();
    await expect(advancedBtn).toBeVisible();

    // Simple should be active (aria-pressed=true)
    await expect(simpleBtn).toHaveAttribute("aria-pressed", "true");
    await expect(advancedBtn).toHaveAttribute("aria-pressed", "false");

    await captureScreenshot(page, "task-176-mode-toggle-default-simple");
  });

  test("switching to advanced mode updates AppHeader toggle state", async ({ page }) => {
    await page.goto("/?step=dashboard");
    await page.waitForLoadState("networkidle");

    const advancedBtn = page.getByTestId("mode-toggle-advanced");
    await advancedBtn.click();

    await expect(page.getByTestId("mode-toggle-advanced")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("mode-toggle-simple")).toHaveAttribute("aria-pressed", "false");

    await captureScreenshot(page, "task-176-mode-toggle-advanced-active");
  });

  test("mode persists in URL — reload preserves advanced mode", async ({ page }) => {
    await page.goto("/?step=dashboard");
    await page.waitForLoadState("networkidle");

    // Switch to advanced
    await page.getByTestId("mode-toggle-advanced").click();

    // Get the URL with state
    const url = page.url();
    expect(url).toContain("s=");

    // Reload with the same URL (add step=dashboard to stay on dashboard)
    await page.goto(url.includes("step=") ? url : url + "&step=dashboard");
    await page.waitForLoadState("networkidle");

    // Should still be in advanced mode
    await expect(page.getByTestId("mode-toggle-advanced")).toHaveAttribute("aria-pressed", "true");

    await captureScreenshot(page, "task-176-mode-toggle-persists-url");
  });

  test("switching mode does not lose financial data — URL contains state", async ({ page }) => {
    await page.goto("/?step=dashboard");
    await page.waitForLoadState("networkidle");

    // Switch to advanced
    await page.getByTestId("mode-toggle-advanced").click();
    expect(page.url()).toContain("s=");

    // Switch back to simple — data still encoded
    await page.getByTestId("mode-toggle-simple").click();
    expect(page.url()).toContain("s=");

    await captureScreenshot(page, "task-176-mode-toggle-data-preserved");
  });

  test("ProfileStep shows mode selector with Simple/Advanced buttons", async ({ page }) => {
    // Navigate directly to profile step in wizard
    await page.goto("/?step=profile");
    await page.waitForLoadState("networkidle");

    const profileSimple = page.getByTestId("profile-mode-simple");
    const profileAdvanced = page.getByTestId("profile-mode-advanced");

    await expect(profileSimple).toBeVisible();
    await expect(profileAdvanced).toBeVisible();

    // Default: simple is active
    await expect(profileSimple).toHaveAttribute("aria-pressed", "true");
    await expect(profileAdvanced).toHaveAttribute("aria-pressed", "false");

    // Switch to advanced in profile step
    await profileAdvanced.click();
    await expect(profileAdvanced).toHaveAttribute("aria-pressed", "true");
    await expect(profileSimple).toHaveAttribute("aria-pressed", "false");

    // AppHeader mode toggle should also reflect the change
    await expect(page.getByTestId("mode-toggle-advanced")).toHaveAttribute("aria-pressed", "true");

    await captureScreenshot(page, "task-176-mode-toggle-profile-step");
  });
});
