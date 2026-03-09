import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("URL State Persistence", () => {
  test("Copy Link button is visible in the header", async ({ page }) => {
    await page.goto("/");
    const copyButton = page.getByRole("button", { name: "Copy link to clipboard" });
    await expect(copyButton).toBeVisible();
    await captureScreenshot(page, "task-11-copy-link-button");
  });

  test("Copy Link button shows Copied! feedback", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    const copyButton = page.getByRole("button", { name: "Copy link to clipboard" });
    await copyButton.click();
    // Icon-only button shows checkmark SVG after copy (no text)
    await expect(copyButton.locator("svg.text-emerald-500")).toBeVisible();
    await captureScreenshot(page, "task-11-copied-feedback");
    // After 2s, should revert to link icon
    await page.waitForTimeout(2500);
    await expect(copyButton.locator("svg.text-emerald-500")).not.toBeVisible();
  });

  test("URL updates with s= param when state changes", async ({ page }) => {
    // Navigate to the assets wizard step to add an asset
    await page.goto("/?step=assets");
    await page.waitForFunction(() => window.location.search.includes("s="));
    const initialUrl = page.url();
    expect(initialUrl).toContain("s=");

    // Add a new asset to change state
    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Test Asset");
    await page.getByLabel("New asset amount").fill("5000");
    await page.getByLabel("Confirm add asset").click();

    // URL should have changed
    await page.waitForFunction(
      (oldUrl: string) => window.location.href !== oldUrl,
      initialUrl
    );
    const newUrl = page.url();
    expect(newUrl).toContain("s=");
    expect(newUrl).not.toBe(initialUrl);
    await captureScreenshot(page, "task-11-url-updated-after-edit");
  });

  test("state persists across page reload", async ({ page }) => {
    // Navigate to assets wizard step
    await page.goto("/?step=assets");
    await page.waitForFunction(() => window.location.search.includes("s="));

    // Add a custom asset
    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Reload Test");
    await page.getByLabel("New asset amount").fill("99999");
    await page.getByLabel("Confirm add asset").click();

    // Wait for "Reload Test" to appear, then wait for URL to update
    await expect(page.getByText("Reload Test")).toBeVisible();
    await page.waitForTimeout(500);

    // Capture the URL
    const urlWithState = page.url();

    // Reload the page with the state URL
    await page.goto(urlWithState);

    // Verify the custom asset is still there
    await expect(page.getByText("Reload Test")).toBeVisible();
    await expect(page.getByText("$99,999")).toBeVisible();
    await captureScreenshot(page, "task-11-state-after-reload");
  });

  test("state restores from shared URL", async ({ page }) => {
    // Load the assets wizard step and capture URL with state
    await page.goto("/?step=assets");
    await page.waitForFunction(() => window.location.search.includes("s="));
    const stateUrl = page.url();

    // Navigate away completely
    await page.goto("about:blank");

    // Navigate to the URL with state param
    await page.goto(stateUrl);

    // Verify initial assets are present on the assets step (use listitem to avoid description matches)
    await expect(page.getByRole("listitem").filter({ hasText: "Savings Account" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "TFSA" })).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "RRSP" })).toBeVisible();
    await captureScreenshot(page, "task-11-state-from-shared-url");
  });

  test("dashboard metrics preserved after reload", async ({ page }) => {
    // Navigate to debts wizard step to delete a debt
    await page.goto("/?step=debts");
    await page.waitForFunction(() => window.location.search.includes("s="));

    // Delete Car Loan debt to change metrics
    const row = page.getByRole("listitem").filter({ hasText: /^Car Loan/ });
    await row.hover();
    await page.getByLabel("Delete Car Loan").click();

    // Verify Car Loan entry is gone (use listitem to avoid matching description text)
    await expect(page.getByRole("listitem").filter({ hasText: /^Car Loan/ })).not.toBeVisible();

    // Wait for URL update
    await page.waitForTimeout(500);
    const urlAfterDelete = page.url();

    // Reload on the debts step
    await page.goto(urlAfterDelete);

    // Car Loan entry should still be gone after reload
    await expect(page.getByRole("listitem").filter({ hasText: /^Car Loan/ })).not.toBeVisible();

    // Page should still be on the debts step
    await expect(page.getByText("+ Add Debt")).toBeVisible();
    await captureScreenshot(page, "task-11-metrics-after-reload");
  });

  test("empty state works without s= param", async ({ page }) => {
    // Navigate to root without any state param
    await page.goto("/");
    // The app should load and show the dashboard with the copy link button
    await expect(page.getByRole("button", { name: "Copy link to clipboard" })).toBeVisible();
  });
});
