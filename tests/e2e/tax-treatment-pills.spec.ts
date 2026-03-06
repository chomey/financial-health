import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Tax treatment pills", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector("[data-testid='asset-empty-state'], [role='list'][aria-label='Asset items']");
  });

  test("shows auto-detected tax treatment pills on default assets", async ({ page }) => {
    // Default state has Savings Account (taxable), TFSA (tax-free), RRSP (tax-deferred)
    const assetList = page.locator("[role='list'][aria-label='Asset items']");
    await expect(assetList).toBeVisible();

    // Find pills by test ID pattern
    const pills = page.locator("[data-testid^='tax-treatment-pill-']");
    const count = await pills.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Check that pills have the correct auto-detected labels
    // Savings Account → Taxable
    const savingsRow = page.locator("[role='listitem']").filter({ hasText: "Savings Account" });
    await expect(savingsRow.locator("[data-testid^='tax-treatment-pill-']")).toContainText("Taxable");

    // TFSA → Tax-free
    const tfsaRow = page.locator("[role='listitem']").filter({ hasText: "TFSA" });
    await expect(tfsaRow.locator("[data-testid^='tax-treatment-pill-']")).toContainText("Tax-free");

    // RRSP → Tax-deferred
    const rrspRow = page.locator("[role='listitem']").filter({ hasText: "RRSP" });
    await expect(rrspRow.locator("[data-testid^='tax-treatment-pill-']")).toContainText("Tax-deferred");

    await captureScreenshot(page, "task-94-tax-treatment-pills-default");
  });

  test("clicking pill cycles tax treatment and shows override indicator", async ({ page }) => {
    // Find the Savings Account pill (auto-detected: Taxable)
    const savingsRow = page.locator("[role='listitem']").filter({ hasText: "Savings Account" });
    const pill = savingsRow.locator("[data-testid^='tax-treatment-pill-']");
    await expect(pill).toContainText("Taxable");
    // No asterisk since it's auto-detected
    await expect(pill).not.toContainText("*");

    // Click to cycle: Taxable → Tax-free
    await pill.click();
    await expect(pill).toContainText("Tax-free");
    await expect(pill).toContainText("*"); // Override indicator

    // Click again: Tax-free → Tax-deferred
    await pill.click();
    await expect(pill).toContainText("Tax-deferred");
    await expect(pill).toContainText("*");

    // Click again: Tax-deferred → Taxable (back to auto-detected, no asterisk)
    await pill.click();
    await expect(pill).toContainText("Taxable");
    await expect(pill).not.toContainText("*");

    await captureScreenshot(page, "task-94-tax-treatment-pill-cycled");
  });

  test("custom account name gets keyword-matched tax treatment", async ({ page }) => {
    // Add a new asset with a custom name containing a keyword
    const addButton = page.locator("text=+ Add Asset").first();
    await addButton.click();

    const categoryInput = page.locator("[aria-label='New asset category']");
    await categoryInput.fill("Company 401k");
    // Dismiss suggestions
    await page.keyboard.press("Tab");

    const amountInput = page.locator("[aria-label='New asset amount']");
    await amountInput.fill("50000");
    await page.locator("[aria-label='Confirm add asset']").click();

    // The new "Company 401k" should be auto-detected as Tax-deferred via keyword match
    const newRow = page.locator("[role='listitem']").filter({ hasText: "Company 401k" });
    await expect(newRow.locator("[data-testid^='tax-treatment-pill-']")).toContainText("Tax-deferred");

    await captureScreenshot(page, "task-94-keyword-matched-custom-account");
  });

  test("tax treatment override persists in URL", async ({ page }) => {
    // Override RRSP's tax treatment to tax-free
    const rrspRow = page.locator("[role='listitem']").filter({ hasText: "RRSP" });
    const pill = rrspRow.locator("[data-testid^='tax-treatment-pill-']");
    await expect(pill).toContainText("Tax-deferred");

    // Click to cycle: Tax-deferred → Taxable
    await pill.click();
    await expect(pill).toContainText("Taxable");

    // Click again: Taxable → Tax-free
    await pill.click();
    await expect(pill).toContainText("Tax-free");
    await expect(pill).toContainText("*");

    // Get current URL and reload
    const url = page.url();
    expect(url).toContain("s="); // State is encoded in URL

    await page.goto(url);
    await page.waitForSelector("[role='list'][aria-label='Asset items']");

    // After reload, RRSP should still show Tax-free with override indicator
    const rrspAfter = page.locator("[role='listitem']").filter({ hasText: "RRSP" });
    await expect(rrspAfter.locator("[data-testid^='tax-treatment-pill-']")).toContainText("Tax-free");
    await expect(rrspAfter.locator("[data-testid^='tax-treatment-pill-']")).toContainText("*");
  });
});
