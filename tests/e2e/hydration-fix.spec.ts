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
    await page.waitForSelector("text=Financial Health Snapshot");

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
    await page.waitForSelector("text=Property");
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
    await page.waitForSelector("text=Financial Health Snapshot");
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

  test("property equity test ID is stable after reload", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=Property");

    // Verify property equity is rendered with stable test ID
    await expect(page.getByTestId("equity-p1")).toHaveText("$170,000");

    // Reload and verify same test ID
    await page.reload();
    await page.waitForSelector("text=Property");
    await expect(page.getByTestId("equity-p1")).toHaveText("$170,000");

    await captureScreenshot(page, "task-20-stable-property-ids");
  });

  test("data persists correctly after reload with stable IDs", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("text=Financial Health Snapshot");

    // Verify initial data renders
    await expect(page.getByText("Savings Account")).toBeVisible();
    await expect(page.getByText("Car Loan")).toBeVisible();
    await expect(page.getByText("Home")).toBeVisible();

    // Wait for URL to be set
    await page.waitForTimeout(500);

    // Reload and verify data persists
    await page.reload();
    await page.waitForSelector("text=Financial Health Snapshot");

    await expect(page.getByText("Savings Account")).toBeVisible();
    await expect(page.getByText("Car Loan")).toBeVisible();
    await expect(page.getByText("Home")).toBeVisible();
    await expect(page.getByTestId("equity-p1")).toHaveText("$170,000");
  });
});
