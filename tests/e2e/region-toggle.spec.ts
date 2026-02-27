import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Region Toggle", () => {
  test("renders region toggle in header with Both selected by default", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("radiogroup", { name: /Filter account types by region/i });
    await expect(toggle).toBeVisible();
    const bothButton = toggle.getByRole("radio", { name: /Both/i });
    await expect(bothButton).toHaveAttribute("aria-checked", "true");
    await captureScreenshot(page, "task-12-region-toggle-default");
  });

  test("switching to CA filters asset category suggestions", async ({ page }) => {
    await page.goto("/");
    // Click CA
    const toggle = page.getByRole("radiogroup", { name: /Filter account types by region/i });
    await toggle.getByRole("radio", { name: /CA/i }).click();
    // Verify CA is now selected
    await expect(toggle.getByRole("radio", { name: /CA/i })).toHaveAttribute("aria-checked", "true");
    // Open add asset form and check suggestions
    await page.getByText("+ Add Asset").click();
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.focus();
    // Should show CA vehicles like TFSA but not US vehicles like 401k
    await expect(page.getByRole("button", { name: "RRSP" }).last()).toBeVisible();
    // 401k should NOT appear
    const us401k = page.getByRole("button", { name: "401k" });
    await expect(us401k).toHaveCount(0);
    await captureScreenshot(page, "task-12-ca-suggestions");
  });

  test("switching to US filters asset category suggestions", async ({ page }) => {
    await page.goto("/");
    // Click US
    const toggle = page.getByRole("radiogroup", { name: /Filter account types by region/i });
    await toggle.getByRole("radio", { name: /US/i }).click();
    // Open add asset form
    await page.getByText("+ Add Asset").click();
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.focus();
    // Should show US vehicles like 401k but not CA vehicles like TFSA
    await expect(page.getByRole("button", { name: "401k" }).last()).toBeVisible();
    // Verify TFSA is not in the suggestion dropdown
    const addRow = page.locator(".animate-in");
    const suggestionButtons = addRow.getByRole("button");
    const allTexts = await suggestionButtons.allTextContents();
    expect(allTexts.some(t => t.includes("401k"))).toBe(true);
    expect(allTexts.some(t => t.includes("TFSA"))).toBe(false);
    await captureScreenshot(page, "task-12-us-suggestions");
  });

  test("switching to Both shows all category suggestions", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("radiogroup", { name: /Filter account types by region/i });
    // Switch to CA first, then back to Both
    await toggle.getByRole("radio", { name: /CA/i }).click();
    await toggle.getByRole("radio", { name: /Both/i }).click();
    // Open add asset form
    await page.getByText("+ Add Asset").click();
    const categoryInput = page.getByLabel("New asset category");
    await categoryInput.focus();
    // Should show both CA and US vehicles
    const addRow = page.locator(".animate-in");
    const suggestionButtons = addRow.getByRole("button");
    const allTexts = await suggestionButtons.allTextContents();
    expect(allTexts.some(t => t.includes("TFSA"))).toBe(true);
    expect(allTexts.some(t => t.includes("401k"))).toBe(true);
    expect(allTexts).toContain("Savings");
    await captureScreenshot(page, "task-12-both-suggestions");
  });

  test("region selection persists in URL and survives reload", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("radiogroup", { name: /Filter account types by region/i });
    // Get the initial URL s= param
    const initialS = await page.evaluate(() => new URL(window.location.href).searchParams.get("s"));
    // Select CA
    await toggle.getByRole("radio", { name: /CA/i }).click();
    await expect(toggle.getByRole("radio", { name: /CA/i })).toHaveAttribute("aria-checked", "true");
    // Wait for URL s= param to change from the initial value
    await page.waitForFunction((oldS) => {
      const newS = new URL(window.location.href).searchParams.get("s");
      return newS !== null && newS !== oldS;
    }, initialS);
    // Get the current URL and navigate to it to simulate a reload
    const currentUrl = page.url();
    await page.goto(currentUrl);
    // Verify CA is still selected after reload
    const toggleAfterReload = page.getByRole("radiogroup", { name: /Filter account types by region/i });
    await expect(toggleAfterReload.getByRole("radio", { name: /CA/i })).toHaveAttribute("aria-checked", "true");
    await captureScreenshot(page, "task-12-region-persists-reload");
  });

  test("region toggle has smooth visual transition", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("radiogroup", { name: /Filter account types by region/i });
    // Verify transition class is present on buttons
    const caButton = toggle.getByRole("radio", { name: /CA/i });
    await expect(caButton).toHaveClass(/transition-all/);
    await expect(caButton).toHaveClass(/duration-200/);
  });

  test("toggle shows flag icons for each region", async ({ page }) => {
    await page.goto("/");
    const toggle = page.getByRole("radiogroup", { name: /Filter account types by region/i });
    await expect(toggle.getByText("🇨🇦")).toBeVisible();
    await expect(toggle.getByText("🇺🇸")).toBeVisible();
    await expect(toggle.getByText("🌐")).toBeVisible();
    await captureScreenshot(page, "task-12-region-flags");
  });
});
