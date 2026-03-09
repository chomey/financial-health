import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Housing cost ratio insight", () => {
  // Housing-cost insight appears when housing expenses and income exist.
  // With default state, many higher-priority insights may push it below MAX_INSIGHTS=8 cap.
  // Use a minimal state with only income + housing expense to ensure it appears.

  async function setupMinimalHousingState(page: import("@playwright/test").Page) {
    // Start on assets step and delete all assets (reduces surplus/net-worth/savings/fire/withdrawal insights)
    await page.goto("/?step=assets");
    await page.waitForFunction(() => window.location.search.includes("s="));

    // Delete all default assets
    for (const name of ["Savings Account", "TFSA", "RRSP"]) {
      const row = page.getByRole("listitem").filter({ hasText: name });
      if (await row.isVisible()) {
        await row.hover();
        await page.getByLabel(`Delete ${name}`).click();
        await page.waitForTimeout(200);
      }
    }

    // Go to debts step and delete all debts
    let url = page.url();
    await page.goto(url.replace(/step=assets/, "step=debts"));
    await page.waitForTimeout(300);

    const carRow = page.getByRole("listitem").filter({ hasText: "Car Loan" });
    if (await carRow.isVisible()) {
      await carRow.hover();
      await page.getByLabel("Delete Car Loan").click();
      await page.waitForTimeout(200);
    }

    // Navigate to dashboard — should only have income + rent expense → housing-cost insight
    url = page.url();
    const dashUrl = url.replace(/step=debts&?/, "").replace(/[&?]$/, "");
    await page.goto(dashUrl);
    await page.waitForSelector('[data-testid="insights-panel"]');
  }

  test("shows housing-cost insight in the insights panel", async ({ page }) => {
    await setupMinimalHousingState(page);

    const housingInsight = page.locator('[data-insight-type="housing-cost"]');
    await expect(housingInsight).toBeVisible({ timeout: 5000 });

    await captureScreenshot(page, "task-136-housing-cost-insight-default");
  });

  test("housing-cost insight message includes ratio percentage", async ({ page }) => {
    await setupMinimalHousingState(page);

    const housingInsight = page.locator('[data-insight-type="housing-cost"]');
    await expect(housingInsight).toBeVisible({ timeout: 5000 });

    const text = await housingInsight.textContent();
    expect(text).toMatch(/\d+\.\d+%/);
  });

  test("housing-cost insight has house icon", async ({ page }) => {
    await setupMinimalHousingState(page);

    const housingInsight = page.locator('[data-insight-type="housing-cost"]');
    await expect(housingInsight).toBeVisible({ timeout: 5000 });

    await expect(housingInsight).toContainText("🏠");
  });

  test("clicking housing-cost insight opens explainer modal", async ({ page }) => {
    await setupMinimalHousingState(page);

    const housingInsight = page.locator('[data-insight-type="housing-cost"]');
    await expect(housingInsight).toBeVisible({ timeout: 5000 });

    await housingInsight.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });

    await captureScreenshot(page, "task-136-housing-cost-explainer-modal");
  });

  test("housing-cost insight references 30% guideline", async ({ page }) => {
    await setupMinimalHousingState(page);

    const housingInsight = page.locator('[data-insight-type="housing-cost"]');
    await expect(housingInsight).toBeVisible({ timeout: 5000 });

    const text = await housingInsight.textContent();
    expect(text).toContain("30%");
  });
});
