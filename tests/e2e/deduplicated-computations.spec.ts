import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

// Pre-encoded state with: TFSA ($50k, 7% ROI, $500/mo), Salary ($80k/yr), Rent ($2k/mo)
const STATE_URL =
  "/?s=!I1-8%3C_%3F%3EsMQTuP%3CjGU1E%3D6qhdK'ZA)%3F%3E%3EK%3BN%5B--%5CW0Q%3FQsUf5UQbgZ%24D%5DH93eA%23d%26rS4_H7U1bdX%5D3%22WJO%26(PtE%2FNWGo72WHfd%24Pstrhj-'%22b_Tj8SZV%23d%22Im9c5!%26q%2F.f%60";

test.describe("Task 147: Deduplicated computations", () => {
  test("dashboard metrics render correctly after computation consolidation", async ({ page }) => {
    await page.goto(STATE_URL);
    await page.waitForSelector("[data-testid='snapshot-dashboard']", { timeout: 10000 });

    // Monthly Cash Flow (surplus) metric should be visible and show a dollar amount
    const cashFlowCard = page.locator("[data-testid='metric-card-monthly-cash-flow']");
    await expect(cashFlowCard).toBeVisible();
    await expect(cashFlowCard).toContainText("$");

    // Runway metric should be visible
    const runwayCard = page.locator("[data-testid='metric-card-financial-runway']");
    await expect(runwayCard).toBeVisible();
    await expect(runwayCard).toContainText(/\d/);

    // Net worth metric should be visible
    const netWorthCard = page.locator("[data-testid='metric-card-net-worth']");
    await expect(netWorthCard).toBeVisible();
    await expect(netWorthCard).toContainText("$");

    await captureScreenshot(page, "task-147-dashboard-after-consolidation");
  });

  test("section summaries format currency correctly after consolidation", async ({ page }) => {
    await page.goto(STATE_URL);
    await page.waitForSelector("[data-testid='snapshot-dashboard']", { timeout: 10000 });

    // Asset section should show a formatted dollar amount
    const assetSection = page.locator("[data-testid='section-assets']");
    if (await assetSection.isVisible()) {
      await expect(assetSection).toContainText("$");
    }

    await captureScreenshot(page, "task-147-section-summaries-after-consolidation");
  });
});
