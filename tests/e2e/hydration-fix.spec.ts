import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Hydration mismatch fix", () => {
  test("no hydration errors on initial load", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForSelector("[aria-label='Copy link to clipboard']");

    // Wait for hydration to complete
    await page.waitForTimeout(1000);

    // Filter for hydration-specific errors
    const hydrationErrors = consoleErrors.filter(
      (e) =>
        e.includes("Hydration") ||
        e.includes("hydration") ||
        e.includes("did not match") ||
        e.includes("server-rendered")
    );
    expect(hydrationErrors).toHaveLength(0);

    await captureScreenshot(page, "task-20-no-hydration-errors");
  });

  test("no hydration errors after URL state reload", async ({ page }) => {
    // Load page and wait for URL state to be written
    await page.goto("/");
    await page.waitForFunction(() => window.location.search.includes("s="));
    await page.waitForTimeout(500);

    // Capture the URL with state
    const urlWithState = page.url();
    expect(urlWithState).toContain("s=");

    // Reload and check for hydration errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    await page.reload();
    await page.waitForSelector("[aria-label='Copy link to clipboard']");
    await page.waitForTimeout(1000);

    const hydrationErrors = consoleErrors.filter(
      (e) =>
        e.includes("Hydration") ||
        e.includes("hydration") ||
        e.includes("did not match") ||
        e.includes("server-rendered")
    );
    expect(hydrationErrors).toHaveLength(0);
  });

  test("asset data persists correctly after reload", async ({ page }) => {
    // Navigate to assets wizard step to see entries
    await page.goto("/?step=assets");
    await page.waitForFunction(() => window.location.search.includes("s="));

    // Verify initial data renders
    await expect(page.getByRole("listitem").filter({ hasText: "Savings Account" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "TFSA" })).toBeVisible();

    // Wait for URL to be set
    await page.waitForTimeout(500);

    // Reload and verify data persists
    await page.reload();
    await page.waitForFunction(() => window.location.search.includes("s="));

    await expect(page.getByRole("listitem").filter({ hasText: "Savings Account" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "TFSA" })).toBeVisible();

    await captureScreenshot(page, "task-20-data-persists-after-reload");
  });
});
