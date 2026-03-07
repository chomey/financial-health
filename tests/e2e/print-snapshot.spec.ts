import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Print/PDF snapshot export (Task 114)", () => {
  test("print button is visible in the header", async ({ page }) => {
    await page.goto("/");
    const printBtn = page.getByTestId("print-snapshot-button");
    await expect(printBtn).toBeVisible();
    await expect(printBtn).toHaveText("Print");
    await captureScreenshot(page, "task-114-print-button-visible");
  });

  test("print footer is hidden in normal (screen) view", async ({ page }) => {
    await page.goto("/");
    const footer = page.getByTestId("print-footer");
    // In screen mode the footer has class 'hidden print:block' — not visible
    await expect(footer).not.toBeVisible();
  });

  test("print footer is visible in print media emulation", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ media: "print" });

    const footer = page.getByTestId("print-footer");
    await expect(footer).toBeVisible();

    // Footer should contain a URL element
    const urlEl = page.getByTestId("print-footer-url");
    await expect(urlEl).toBeVisible();

    // Footer should contain a date element
    const dateEl = page.getByTestId("print-footer-date");
    await expect(dateEl).toBeVisible();

    await captureScreenshot(page, "task-114-print-footer-visible");
  });

  test("print footer URL contains the current page URL", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ media: "print" });

    const urlEl = page.getByTestId("print-footer-url");
    await expect(urlEl).toBeVisible();
    const text = await urlEl.textContent();
    // Should contain "localhost" or the host
    expect(text).toMatch(/localhost|127\.0\.0\.1|financial/i);
  });

  test("print footer date is not empty", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ media: "print" });

    const dateEl = page.getByTestId("print-footer-date");
    const text = await dateEl.textContent();
    // Should contain a year
    expect(text).toMatch(/\d{4}/);
  });

  test("nav is hidden in print media", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ media: "print" });

    const nav = page.locator("nav");
    await expect(nav).not.toBeVisible();
  });

  test("entry panel is hidden in print media", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ media: "print" });

    const entryPanel = page.getByTestId("entry-panel");
    await expect(entryPanel).not.toBeVisible();
  });

  test("dashboard panel is visible in print media", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ media: "print" });

    const dashboardPanel = page.getByTestId("dashboard-panel");
    await expect(dashboardPanel).toBeVisible();
    await captureScreenshot(page, "task-114-print-dashboard-visible");
  });

  test("scenarios section is hidden in print media", async ({ page }) => {
    await page.goto("/");
    await page.emulateMedia({ media: "print" });

    const scenarios = page.locator('[aria-label="Scenario modeling"]');
    await expect(scenarios).not.toBeVisible();
  });

  test("print button itself has print:hidden class so it won't appear in PDF", async ({
    page,
  }) => {
    await page.goto("/");
    const printBtn = page.getByTestId("print-snapshot-button");
    // In screen mode it's visible
    await expect(printBtn).toBeVisible();

    // Switch to print mode — button should be hidden
    await page.emulateMedia({ media: "print" });
    await expect(printBtn).not.toBeVisible();
  });

  test("full print layout screenshot with sample profile loaded", async ({
    page,
  }) => {
    // Load a sample profile so there's meaningful data to show
    await page.goto("/");
    await page.getByTestId("sample-profile-mid-career").click();
    await page.waitForFunction(() => window.location.search.includes("s="));

    await page.emulateMedia({ media: "print" });
    await captureScreenshot(page, "task-114-print-layout-with-data");
  });
});
