import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

// Precomputed URL encoding of a state with:
//   - TFSA asset ($50k, 7% ROI, $500/mo contribution)
//   - Salary income ($80k/yr)
//   - Rent expense ($2k/mo)
// Generated via: npx tsx -e "import {encodeState} from './src/lib/url-state'; ..."
const SURPLUS_WITH_CONTRIBUTIONS_URL =
  "/?s=!I1-8%3C_%3F%3EsMQTuP%3CjGU1E%3D6qhdK'ZA)%3F%3E%3EK%3BN%5B--%5CW0Q%3FQsUf5UQbgZ%24D%5DH93eA%23d%26rS4_H7U1bdX%5D3%22WJO%26(PtE%2FNWGo72WHfd%24Pstrhj-'%22b_Tj8SZV%23d%22Im9c5!%26q%2F.f%60";

function buildSurplusStateUrl(): string {
  return SURPLUS_WITH_CONTRIBUTIONS_URL;
}

test.describe("Task 125: surplus explainer virtual source IDs", () => {
  test("surplus explainer shows 'Contributions' card, not 'Assets'", async ({ page }) => {
    await page.goto(buildSurplusStateUrl());
    await page.waitForSelector('[data-testid="metric-card-monthly-cash-flow"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await surplusCard.scrollIntoViewIfNeeded();
    await surplusCard.click();

    const modal = page.locator('[data-testid="explainer-modal"]');
    await expect(modal).toBeVisible({ timeout: 3000 });

    // Wait for animations
    await page.waitForTimeout(800);

    // The contributions card should show "Contributions" title (from virtual-contributions virtual ID)
    const contributionsCard = page.locator('[data-testid="source-summary-title-virtual-contributions"]');
    await expect(contributionsCard).toBeVisible();
    await expect(contributionsCard).toHaveText("Contributions");

    // Must NOT show a card with the full assets section title
    const assetsCard = page.locator('[data-testid="source-summary-title-section-assets"]');
    await expect(assetsCard).not.toBeVisible();

    await captureScreenshot(page, "task-125-surplus-explainer-contributions");
  });

  test("surplus explainer contributions card shows contribution amount, not total assets", async ({
    page,
  }) => {
    await page.goto(buildSurplusStateUrl());
    await page.waitForSelector('[data-testid="metric-card-monthly-cash-flow"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await surplusCard.scrollIntoViewIfNeeded();
    await surplusCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await page.waitForTimeout(800);

    // The contributions total should be the $500/mo contribution, not $50,000 total assets
    const contribTotal = page.locator('[data-testid="source-summary-total-virtual-contributions"]');
    await expect(contribTotal).toBeVisible();
    const text = await contribTotal.textContent();
    expect(text).toContain("500"); // $500/mo contribution
    expect(text).not.toContain("50,000"); // not the total assets value
  });

  test("surplus explainer shows Income, Expenses, and Contributions source cards", async ({ page }) => {
    await page.goto(buildSurplusStateUrl());
    await page.waitForSelector('[data-testid="metric-card-monthly-cash-flow"]');

    const surplusCard = page.locator('[data-testid="metric-card-monthly-cash-flow"]');
    await surplusCard.scrollIntoViewIfNeeded();
    await surplusCard.click();

    await expect(page.locator('[data-testid="explainer-modal"]')).toBeVisible({ timeout: 3000 });
    await page.waitForTimeout(800);

    // Income and Expenses source cards should always be present
    await expect(page.locator('[data-testid="explainer-source-section-income"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-section-expenses"]')).toBeVisible();
    await expect(page.locator('[data-testid="explainer-source-virtual-contributions"]')).toBeVisible();

    await captureScreenshot(page, "task-125-surplus-explainer-full");
  });
});
