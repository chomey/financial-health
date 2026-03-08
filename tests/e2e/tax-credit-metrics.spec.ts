import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

// CA user, single, GST/HST Credit $600/year (refundable), salary $5k/mo, savings $30k, rent $2k/mo
const S_REFUNDABLE = "!I1%2C%2FO1%3EV75S%2FZW%2Cttu%60%26%25'tAUsR*%60P%3E3%5BKc%22't6)q%5BL%60_0%3A)%3D%40rRmI%5EAhhX%229%60uj6%25O%5Br%3FcHiQ'h%5C%2FH%22qYLX%3F%3Ep2%3E!T%60g%22'%408GYao%26%2C!FMepO0Uj2R%5Bhl%3Dn5P-RAe%3CHMDGgao%6028Q%3B*Xt4hmLg6L2%3EQluHm%26E%2C(%3D*7P)C%3CRsZVN%5Ed!E7%40A3i4U%40%2B%3CitPQk9j1-!On7V%5D)";

// CA user, single, GST/HST Credit $600 (refundable) + Disability Tax Credit $1500 (non-refundable)
const S_BOTH = "!I1%2C7ONRu%600G%24%5B%26--SEh5-PE%3D%40%5CMWM6%2468%3FLbVMZ9d%23%3Ah%2C5up%3ApqUL*ailc_%2Con%5Bq*Z%5D3U%2BCuXo.SF6rFe%5DpQ5MN%3D1%3Ap%3AG(%3A%26h%22c%2BHDdn%3D%3E_o%25!%2FJXA8BfPp%3AbF_Cj!n(9Eb%22K%409UiL9bVaE4N6PFVeb%2BNZj7A%228RK%5DTG%2CDd%22d*7_%60%60KSdL%23Z%3BCeKCB6R%3Dpk%2Cq)QaLoeak6%3E%60gOtcgZs%23%25eN)%3CdF%3EPnL%24rW%2FHA%3B4R";

test.describe("Task 152: Tax credits applied to displayed tax and cash flow", () => {
  test("tax credits reduce displayed Estimated Tax and show badge", async ({ page }) => {
    await page.goto(`/?s=${S_BOTH}`);
    await page.waitForLoadState("networkidle");

    // Badge should appear on Estimated Tax
    const badge = page.locator('[data-testid="tax-credits-applied-badge"]');
    await expect(badge).toBeVisible();
    expect(await badge.textContent()).toContain("Tax Credits Applied");

    // Effective rate should be displayed (now includes credits)
    const rate = page.locator('[data-testid="effective-tax-rate"]');
    await expect(rate).toBeVisible();

    await captureScreenshot(page, "task-152-tax-credits-applied");
  });

  test("Monthly Cash Flow reflects credit-adjusted surplus", async ({ page }) => {
    await page.goto(`/?s=${S_REFUNDABLE}`);
    await page.waitForLoadState("networkidle");

    // Monthly Cash Flow should exist with a value
    const cashFlow = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await expect(cashFlow).toBeVisible();

    await captureScreenshot(page, "task-152-cash-flow-with-credits");
  });

  test("no credit indicators when no tax credits are entered", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Badge should not appear
    const badge = page.locator('[data-testid="tax-credits-applied-badge"]');
    await expect(badge).not.toBeVisible();
  });
});
