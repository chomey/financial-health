import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Investment contributions in expenses", () => {
  test("shows auto-generated Investment Contributions row when assets have contributions", async ({ page }) => {
    await page.goto("/");

    // Default mock data has no contributions, so the row should not appear
    const contributionsRow = page.getByTestId("investment-contributions-row");
    await expect(contributionsRow).not.toBeVisible();

    // Add a monthly contribution to the first asset (Savings Account)
    await page.getByTestId("contribution-badge-a1").click();
    const contributionInput = page.getByLabel("Edit monthly contribution for Savings Account");
    await contributionInput.fill("500");
    await contributionInput.press("Enter");

    // Now the Investment Contributions row should appear in expenses
    await expect(contributionsRow).toBeVisible();
    await expect(contributionsRow).toContainText("Investment Contributions");
    await expect(contributionsRow).toContainText("auto");
    await expect(contributionsRow).toContainText("$500");

    await captureScreenshot(page, "task-35-investment-contributions-row");
  });

  test("surplus metric decreases when contributions are added", async ({ page }) => {
    await page.goto("/");

    // Initial surplus: $6,300 - $2,950 = $3,350
    const surplusCard = page.getByLabel(/Monthly Surplus:/);
    await expect(surplusCard).toContainText("$3,350");

    // Add a $500 contribution to Savings Account
    await page.getByTestId("contribution-badge-a1").click();
    const input = page.getByLabel("Edit monthly contribution for Savings Account");
    await input.fill("500");
    await input.press("Enter");

    // Surplus should now be $6,300 - $2,950 - $500 = $2,850
    await expect(surplusCard).toContainText("$2,850");

    await captureScreenshot(page, "task-35-surplus-with-contributions");
  });

  test("investment contributions row has auto badge and is read-only", async ({ page }) => {
    await page.goto("/");

    // Add a contribution so the row appears
    await page.getByTestId("contribution-badge-a1").click();
    const input = page.getByLabel("Edit monthly contribution for Savings Account");
    await input.fill("1000");
    await input.press("Enter");

    const contributionsRow = page.getByTestId("investment-contributions-row");
    await expect(contributionsRow).toBeVisible();
    await expect(contributionsRow).toContainText("$1,000");

    // The auto row should have the "auto" badge
    const autoBadge = contributionsRow.locator("text=auto");
    await expect(autoBadge).toBeVisible();

    // The auto row should not have a delete button
    const deleteButton = contributionsRow.locator('button[aria-label*="Delete"]');
    await expect(deleteButton).toHaveCount(0);
  });

  test("switching surplus target radio updates projection chart and asset projections", async ({ page }) => {
    await page.goto("/");

    // Default surplus target is the first asset (Savings Account, id=a1)
    // Surplus = $6,300 - $2,950 = $3,350/mo
    // Savings Account has 2% default ROI, Brokerage has 7%

    // Verify surplus badge is on the first asset initially
    const surplusBadgeA1 = page.getByTestId("surplus-amount-a1");
    await expect(surplusBadgeA1).toBeVisible();
    await expect(surplusBadgeA1).toContainText("$3,350");

    // Brokerage should NOT have a surplus badge
    const surplusBadgeA3 = page.getByTestId("surplus-amount-a3");
    await expect(surplusBadgeA3).not.toBeVisible();

    // Capture the initial per-asset inline projection for Savings Account (with surplus)
    const projA1 = page.getByTestId("asset-projection-a1");
    await expect(projA1).toBeVisible();
    const initialA1Text = await projA1.textContent();

    // Capture the initial per-asset inline projection for Brokerage (without surplus)
    const projA3 = page.getByTestId("asset-projection-a3");
    await expect(projA3).toBeVisible();
    const initialA3Text = await projA3.textContent();

    // Capture the initial projection summary table net worth at 10yr
    const summaryTable = page.getByTestId("projection-summary-table");
    await expect(summaryTable).toBeVisible();
    const initialSummaryText = await summaryTable.textContent();

    // Capture the initial asset projections table
    const assetTable = page.getByTestId("asset-projections-table");
    await expect(assetTable).toBeVisible();
    const initialAssetTableText = await assetTable.textContent();

    // --- Switch surplus target to Brokerage (a3, 7% ROI) ---
    const surplusRadioA3 = page.getByTestId("surplus-target-a3").locator("input[type=radio]");
    await surplusRadioA3.click();

    // Surplus badge should now be on Brokerage, not Savings Account
    await expect(surplusBadgeA1).not.toBeVisible();
    await expect(surplusBadgeA3).toBeVisible();
    await expect(surplusBadgeA3).toContainText("$3,350");

    // Per-asset inline projections should update:
    // Savings Account projection should decrease (lost surplus)
    const updatedA1Text = await projA1.textContent();
    expect(updatedA1Text).not.toBe(initialA1Text);

    // Brokerage projection should increase (gained surplus at higher ROI)
    const updatedA3Text = await projA3.textContent();
    expect(updatedA3Text).not.toBe(initialA3Text);

    // The projection summary table should update (higher ROI on surplus = higher net worth)
    const updatedSummaryText = await summaryTable.textContent();
    expect(updatedSummaryText).not.toBe(initialSummaryText);

    // The asset projections table should update
    const updatedAssetTableText = await assetTable.textContent();
    expect(updatedAssetTableText).not.toBe(initialAssetTableText);

    // --- Switch back to Savings Account (a1) to verify full reset ---
    const surplusRadioA1 = page.getByTestId("surplus-target-a1").locator("input[type=radio]");
    await surplusRadioA1.click();

    // Should revert to original state
    await expect(surplusBadgeA1).toBeVisible();
    await expect(surplusBadgeA3).not.toBeVisible();

    const revertedA1Text = await projA1.textContent();
    expect(revertedA1Text).toBe(initialA1Text);

    const revertedA3Text = await projA3.textContent();
    expect(revertedA3Text).toBe(initialA3Text);

    await captureScreenshot(page, "surplus-target-switch-projections");
  });

  test("expense total includes investment contributions", async ({ page }) => {
    await page.goto("/");

    // Add a $1,000 contribution
    await page.getByTestId("contribution-badge-a1").click();
    const input = page.getByLabel("Edit monthly contribution for Savings Account");
    await input.fill("1000");
    await input.press("Enter");

    // The expense section total should include the contribution
    // Default expenses: $2,200 + $600 + $150 = $2,950 + $1,000 contribution = $3,950
    const expenseSection = page.locator("section").filter({ hasText: "Monthly Expenses" });
    await expect(expenseSection.locator("text=Monthly Total: $3,950")).toBeVisible();

    await captureScreenshot(page, "task-35-expense-total-with-contributions");
  });
});
