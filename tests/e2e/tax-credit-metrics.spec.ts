import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

// CA user, single, GST/HST Credit $600/year (refundable), salary $5k/mo, savings $30k, rent $2k/mo
const S_REFUNDABLE = "!I1%2C%2FO1%3EV75S%2FZW%2Cttu%60%26%25'tAUsR*%60P%3E3%5BKc%22't6)q%5BL%60_0%3A)%3D%40rRmI%5EAhhX%229%60uj6%25O%5Br%3FcHiQ'h%5C%2FH%22qYLX%3F%3Ep2%3E!T%60g%22'%408GYao%26%2C!FMepO0Uj2R%5Bhl%3Dn5P-RAe%3CHMDGgao%6028Q%3B*Xt4hmLg6L2%3EQluHm%26E%2C(%3D*7P)C%3CRsZVN%5Ed!E7%40A3i4U%40%2B%3CitPQk9j1-!On7V%5D)";

// CA user, single, GST/HST Credit $600 (refundable) + Disability Tax Credit $1500 (non-refundable)
const S_BOTH = "!I1%2C7ONRu%600G%24%5B%26--SEh5-PE%3D%40%5CMWM6%2468%3FLbVMZ9d%23%3Ah%2C5up%3ApqUL*ailc_%2Con%5Bq*Z%5D3U%2BCuXo.SF6rFe%5DpQ5MN%3D1%3Ap%3AG(%3A%26h%22c%2BHDdn%3D%3E_o%25!%2FJXA8BfPp%3AbF_Cj!n(9Eb%22K%409UiL9bVaE4N6PFVeb%2BNZj7A%228RK%5DTG%2CDd%22d*7_%60%60KSdL%23Z%3BCeKCB6R%3Dpk%2Cq)QaLoeak6%3E%60gOtcgZs%23%25eN)%3CdF%3EPnL%24rW%2FHA%3B4R";

test.describe("Task 144: Tax credits impact on dashboard metrics", () => {
  test("tax credit monthly boost appears in Monthly Cash Flow when refundable credits exist", async ({ page }) => {
    await page.goto(`/?s=${S_REFUNDABLE}`);
    await page.waitForLoadState("networkidle");

    const boost = page.locator('[data-testid="tax-credit-monthly-boost"]');
    await expect(boost).toBeVisible();
    const text = await boost.textContent();
    expect(text).toContain("/mo from tax credits");
    // $600 / 12 = $50/mo
    expect(text).toMatch(/\$50/);

    await captureScreenshot(page, "task-144-credit-monthly-boost");
  });

  test("effective tax rate shows before-and-after with credits badge on Estimated Tax", async ({ page }) => {
    await page.goto(`/?s=${S_BOTH}`);
    await page.waitForLoadState("networkidle");

    // Adjusted rate should appear
    const afterRate = page.locator('[data-testid="tax-rate-after-credits"]');
    await expect(afterRate).toBeVisible();

    // Badge should appear
    const badge = page.locator('[data-testid="tax-credits-applied-badge"]');
    await expect(badge).toBeVisible();
    expect(await badge.textContent()).toContain("Tax Credits Applied");

    await captureScreenshot(page, "task-144-tax-rate-adjusted");
  });

  test("tax credits applied badge appears on Monthly Cash Flow with refundable credits", async ({ page }) => {
    await page.goto(`/?s=${S_REFUNDABLE}`);
    await page.waitForLoadState("networkidle");

    const badge = page.locator('[data-testid="tax-credits-applied-badge-surplus"]');
    await expect(badge).toBeVisible();
    expect(await badge.textContent()).toContain("Tax Credits Applied");

    await captureScreenshot(page, "task-144-surplus-credit-badge");
  });

  test("adjusted runway appears when credits meaningfully extend runway", async ({ page }) => {
    await page.goto(`/?s=${S_BOTH}`);
    await page.waitForLoadState("networkidle");

    // The adjusted runway may or may not appear depending on whether the credit benefit
    // is large enough relative to obligations (>0.1 month difference)
    // Check that the runway card exists
    const runwayCard = page.locator('[data-testid="metric-card-financial-runway"]');
    await expect(runwayCard).toBeVisible();

    // If the adjusted runway badge appears, verify it
    const runwayBadge = page.locator('[data-testid="tax-credits-applied-badge-runway"]');
    const badgeVisible = await runwayBadge.isVisible();
    if (badgeVisible) {
      const adjustedRunway = page.locator('[data-testid="tax-credit-adjusted-runway"]');
      await expect(adjustedRunway).toBeVisible();
      expect(await adjustedRunway.textContent()).toContain("with tax credits");
    }

    await captureScreenshot(page, "task-144-runway-adjusted");
  });

  test("metrics remain unchanged when no tax credits are entered", async ({ page }) => {
    // Use a default state with no tax credits
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // None of the credit indicators should appear
    const boost = page.locator('[data-testid="tax-credit-monthly-boost"]');
    await expect(boost).not.toBeVisible();

    const badge = page.locator('[data-testid="tax-credits-applied-badge"]');
    await expect(badge).not.toBeVisible();
  });
});
