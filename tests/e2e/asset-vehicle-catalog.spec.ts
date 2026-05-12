import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("AssetEntry reads from VehicleCatalog", () => {
  test("grouped dropdown shows country groups with correct labels", async ({ page }) => {
    await page.goto("/?step=assets");
    await page.getByText("+ Add Asset").click();

    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();

    // All 4 group headers should be visible in the empty-query dropdown
    await expect(page.getByTestId("suggestion-group-header").filter({ hasText: "🇨🇦 Canada" })).toBeVisible();
    await expect(page.getByTestId("suggestion-group-header").filter({ hasText: "🇺🇸 USA" })).toBeVisible();
    await expect(page.getByTestId("suggestion-group-header").filter({ hasText: "🇦🇺 Australia" })).toBeVisible();
    await expect(page.getByTestId("suggestion-group-header").filter({ hasText: "General" })).toBeVisible();

    await captureScreenshot(page, "task-227-grouped-dropdown-country-headers");
  });

  test("CA vehicle categories show 🇨🇦 flag emoji", async ({ page }) => {
    await page.goto("/?step=assets");
    await page.getByText("+ Add Asset").click();

    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();
    await categoryInput.fill("TFSA");

    // Flag emoji should appear next to TFSA in suggestions
    const tfsa = page.locator("button", { hasText: "TFSA" }).first();
    await expect(tfsa.locator("span[aria-hidden]")).toHaveText("🇨🇦");

    await captureScreenshot(page, "task-227-ca-flag-in-dropdown");
  });

  test("US vehicle categories show 🇺🇸 flag emoji", async ({ page }) => {
    await page.goto("/?step=assets");
    await page.getByText("+ Add Asset").click();

    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();
    await categoryInput.fill("401k");

    const item = page.locator("button", { hasText: "401k" }).first();
    await expect(item.locator("span[aria-hidden]")).toHaveText("🇺🇸");

    await captureScreenshot(page, "task-227-us-flag-in-dropdown");
  });

  test("AU vehicle categories show 🇦🇺 flag emoji", async ({ page }) => {
    await page.goto("/?step=assets");
    await page.getByText("+ Add Asset").click();

    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();
    await categoryInput.fill("Super");

    const item = page.locator("button", { hasText: "Super (Accumulation)" }).first();
    await expect(item.locator("span[aria-hidden]")).toHaveText("🇦🇺");

    await captureScreenshot(page, "task-227-au-flag-in-dropdown");
  });

  test("General categories have no flag emoji", async ({ page }) => {
    await page.goto("/?step=assets");
    await page.getByText("+ Add Asset").click();

    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.click();
    await categoryInput.fill("Savings");

    // Savings should appear without a flag span
    const savingsBtn = page.locator("button", { hasText: "Savings" }).first();
    await expect(savingsBtn).toBeVisible();
    // No aria-hidden flag span for universal categories
    await expect(savingsBtn.locator("span[aria-hidden]")).toHaveCount(0);

    await captureScreenshot(page, "task-227-savings-no-flag");
  });
});
