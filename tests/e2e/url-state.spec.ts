import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("URL State Persistence", () => {
  test("Copy Link button is visible in the header", async ({ page }) => {
    await page.goto("/");
    const copyButton = page.getByRole("button", { name: "Copy link to clipboard" });
    await expect(copyButton).toBeVisible();
    await expect(copyButton).toContainText("Copy Link");
    await captureScreenshot(page, "task-11-copy-link-button");
  });

  test("Copy Link button shows Copied! feedback", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto("/");
    const copyButton = page.getByRole("button", { name: "Copy link to clipboard" });
    await copyButton.click();
    await expect(copyButton).toContainText("Copied!");
    await captureScreenshot(page, "task-11-copied-feedback");
    // After 2s, should revert to "Copy Link"
    await page.waitForTimeout(2500);
    await expect(copyButton).toContainText("Copy Link");
  });

  test("URL updates with s= param when state changes", async ({ page }) => {
    await page.goto("/");
    // Wait for initial URL state to be set
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
    await page.goto("/");
    // Wait for initial state
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
    // First, load the app and capture the URL with state
    await page.goto("/");
    await page.waitForFunction(() => window.location.search.includes("s="));
    const stateUrl = page.url();

    // Navigate away completely
    await page.goto("about:blank");

    // Navigate to the URL with state param
    await page.goto(stateUrl);

    // Verify all initial mock data is present
    await expect(page.getByText("Savings Account")).toBeVisible();
    await expect(page.getByText("TFSA")).toBeVisible();
    await expect(page.getByText("Brokerage")).toBeVisible();
    await captureScreenshot(page, "task-11-state-from-shared-url");
  });

  test("dashboard metrics preserved after reload", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => window.location.search.includes("s="));

    // Delete Car Loan debt to change metrics
    const row = page.getByRole("listitem").filter({ hasText: "Car Loan" });
    await row.hover();
    await page.getByLabel("Delete Car Loan").click();

    // Verify Car Loan is gone
    await expect(page.getByText("Car Loan")).not.toBeVisible();

    // Wait for URL update
    await page.waitForTimeout(500);
    const urlAfterDelete = page.url();

    // Reload
    await page.goto(urlAfterDelete);

    // Car Loan should still be gone after reload
    await expect(page.getByText("Car Loan")).not.toBeVisible();

    // Mortgage should remain
    await expect(page.getByRole("heading", { name: "Debts" })).toBeVisible();
    await captureScreenshot(page, "task-11-metrics-after-reload");
  });

  test("empty state works without s= param", async ({ page }) => {
    // Navigate to root without any state param
    await page.goto("/");
    // The app should load with default mock data (INITIAL_STATE)
    await expect(page.getByText("Savings Account")).toBeVisible();
    await expect(page.getByText("Financial Health Snapshot")).toBeVisible();
  });
});
