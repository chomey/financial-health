import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

// Pre-encoded states (percent-encoded) generated via:
// npx tsx -e "import {encodeState} from './src/lib/url-state.ts'; console.log(encodeURIComponent(encodeState({...})))"

// CA user, single, GST/HST Credit $500/year, income $72k/year
const S1 = "!I1-8%3C_%3F%3EsMN64a8qBg%2C5cS!%3A%3Dij%3AX27F%5CU%5EG7%60*Y%3D(qeUr%5Ecq%5En%3BIA%2Br.8t%2FO)H'%2C%25h1H9%3FmbL4%24*KI99S8Vgk.ud4b%3F%248S%3BU9D180Gj)AiJ)!%25!P%24dn940%26sI%3F6Ps%3EPL'a)F41%5C9%24%5CHiPDs%2F%2Bi";

// US user, CA jurisdiction, married-separately, EITC $3000 (ineligible MFS) + Child Tax Credit $2000, income $48k/year
const S2 = "!I1%2CON_9bs0G%26p%3B9%25%5D%3DoL%26*e%25-D%3CcPert%3F7aVH%2BHPV%60P%3Aaa%5CL%5CU)lGA0K%5Cm21C0r)QNC%2C%259eq%3FS%24%3ES%3C75%3FW(%3FMH%3DLnQ%3DZcpIMrI%5B%3CPGTm2sDbT*%40%5CX%5EjS5%3COP%5BC3l%25M%60cLoG1R%5B*fL%3E'3jM31%5B!%5C9E%3E%40Q!%3Bl2eNE.%3C.3NWQ53kdmj9eo47H%3A6N%3B-0AQFJW%3B6%3A%26h71%5E'U%22R-5B'1b4";

// CA user, single, Canada Workers Benefit $5000 refundable, income $18k/year
const S3 = "!I1-8%3C_%3F%3EsMN64a8qBg%2C5cS!%3A%3Dij%3AX27F%5CU%5EG7%60*Y%3D(qeUr%5Ep4%5En%3BIA%2Br.8t%2FO)H'%2BpXB*c3K4f3s*AnP2WF2'Cui8%26f%26%3ATMm%3F9%3EMA%3BXZo2%3D%24m9%2C'4Q_jrXC%5Cda0nJ81!%3Fdn940%26sI%3F6PsFK.'a)F41%5C9%24%5CHiW3N0%5D%3C";

// CA user, single, GST/HST Credit $400, low income $24k/year → should suggest CWB
const S4 = "!I1-8%3C_%3F%3EsMN64a8qBg%2C5cS!%3A%3Dij%3AX27F%5CU%5EG7%60*Y%3D(qeUr%5EWm%5En%3BIA%2Br.8t%2FO)H'%2C%25gq%3D9%24R%5B!3%5DdD%5E8s8%2F5gk.ud4b%3F%248S%3BU9D18%2F%3CJ(%6038'!%25!P%24dn940%26sI%3F6Ps%3EPL'a)F41%5C9%24%5CHiO0%40%2F%26q";

test.describe("Task 143: Tax credit insights with income eligibility awareness", () => {
  test("tax-credits-summary insight appears when credits are entered", async ({ page }) => {
    await page.goto(`/?s=${S1}`);
    await page.waitForLoadState("networkidle");

    const summaryInsight = page.locator('[data-insight-type="tax-credits-summary"]');
    await expect(summaryInsight).toBeVisible();
    const text = await summaryInsight.textContent();
    expect(text).toContain("$500");
    expect(text).toContain("tax credits");

    await captureScreenshot(page, "task-143-tax-credits-summary");
  });

  test("tax-credits-ineligible insight appears for MFS-ineligible US credits", async ({ page }) => {
    await page.goto(`/?s=${S2}`);
    await page.waitForLoadState("networkidle");

    const ineligibleInsight = page.locator('[data-insight-type="tax-credits-ineligible"]');
    await expect(ineligibleInsight).toBeVisible();
    const text = await ineligibleInsight.textContent();
    expect(text).toContain("Married Filing Separately");
    expect(text).toContain("tax professional");

    await captureScreenshot(page, "task-143-tax-credits-ineligible");
  });

  test("tax-credits-refundable insight appears when refundable credits exceed tax", async ({ page }) => {
    await page.goto(`/?s=${S3}`);
    await page.waitForLoadState("networkidle");

    const refundableInsight = page.locator('[data-insight-type="tax-credits-refundable"]');
    await expect(refundableInsight).toBeVisible();
    const text = await refundableInsight.textContent();
    expect(text).toContain("tax refund");

    await captureScreenshot(page, "task-143-tax-credits-refundable");
  });

  test("tax-credits-unclaimed suggests CWB for low-income CA user", async ({ page }) => {
    await page.goto(`/?s=${S4}`);
    await page.waitForLoadState("networkidle");

    const unclaimedInsights = page.locator('[data-insight-type="tax-credits-unclaimed"]');
    const count = await unclaimedInsights.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(2);

    const allText = await unclaimedInsights.allTextContents();
    expect(allText.some((t) => t.includes("Canada Workers Benefit"))).toBe(true);

    await captureScreenshot(page, "task-143-tax-credits-unclaimed");
  });
});
