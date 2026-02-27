import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Asset ROI and monthly contribution", () => {
  test("shows suggested ROI badges for known account types", async ({ page }) => {
    await page.goto("/");

    // TFSA should show 5% ROI (suggested)
    const tfsaRoi = page.getByTestId("roi-badge-a2");
    await expect(tfsaRoi).toBeVisible();
    await expect(tfsaRoi).toContainText("5% ROI (suggested)");

    // Savings Account should show 2% ROI (suggested)
    const savingsRoi = page.getByTestId("roi-badge-a1");
    await expect(savingsRoi).toContainText("2% ROI (suggested)");

    // Brokerage should show 7% ROI (suggested)
    const brokerageRoi = page.getByTestId("roi-badge-a3");
    await expect(brokerageRoi).toContainText("7% ROI (suggested)");

    await captureScreenshot(page, "task-22-roi-suggested-badges");
  });

  test("shows monthly contribution placeholder", async ({ page }) => {
    await page.goto("/");

    const contributionBadge = page.getByTestId("contribution-badge-a1");
    await expect(contributionBadge).toBeVisible();
    await expect(contributionBadge).toContainText("Monthly contribution");
  });

  test("allows editing ROI by clicking the badge", async ({ page }) => {
    await page.goto("/");

    // Click the TFSA ROI badge
    await page.getByTestId("roi-badge-a2").click();

    // Should show edit input
    const roiInput = page.getByLabel("Edit ROI for TFSA");
    await expect(roiInput).toBeVisible();

    // Type a custom ROI
    await roiInput.fill("8");
    await roiInput.press("Enter");

    // Should show the user-set value without (suggested)
    await expect(page.getByTestId("roi-badge-a2")).toContainText("8% ROI");
    await expect(page.getByTestId("roi-badge-a2")).not.toContainText("suggested");

    await captureScreenshot(page, "task-22-roi-edited");
  });

  test("allows editing monthly contribution by clicking the badge", async ({ page }) => {
    await page.goto("/");

    // Click the TFSA contribution badge
    await page.getByTestId("contribution-badge-a2").click();

    // Should show edit input
    const contribInput = page.getByLabel("Edit monthly contribution for TFSA");
    await expect(contribInput).toBeVisible();

    // Type a contribution amount
    await contribInput.fill("500");
    await contribInput.press("Enter");

    // Should show the formatted contribution badge
    await expect(page.getByTestId("contribution-badge-a2")).toContainText("+$500/mo");

    await captureScreenshot(page, "task-22-contribution-edited");
  });

  test("ROI persists in URL state after reload", async ({ page }) => {
    await page.goto("/");

    // Set ROI on TFSA
    await page.getByTestId("roi-badge-a2").click();
    await page.getByLabel("Edit ROI for TFSA").fill("9");
    await page.getByLabel("Edit ROI for TFSA").press("Enter");

    // Verify ROI was set
    await expect(page.getByTestId("roi-badge-a2")).toContainText("9% ROI");

    // Wait for URL update
    await page.waitForTimeout(500);

    // Reload the page
    const url = page.url();
    await page.goto(url);

    // ROI should be preserved
    await expect(page.getByTestId("roi-badge-a2")).toContainText("9% ROI");
    await expect(page.getByTestId("roi-badge-a2")).not.toContainText("suggested");
  });

  test("monthly contribution persists in URL state after reload", async ({ page }) => {
    await page.goto("/");

    // Set contribution on TFSA
    await page.getByTestId("contribution-badge-a2").click();
    await page.getByLabel("Edit monthly contribution for TFSA").fill("750");
    await page.getByLabel("Edit monthly contribution for TFSA").press("Enter");

    // Verify contribution was set
    await expect(page.getByTestId("contribution-badge-a2")).toContainText("+$750/mo");

    // Wait for URL update
    await page.waitForTimeout(500);

    // Reload the page
    const url = page.url();
    await page.goto(url);

    // Contribution should be preserved
    await expect(page.getByTestId("contribution-badge-a2")).toContainText("+$750/mo");

    await captureScreenshot(page, "task-22-url-persistence");
  });

  test("detail fields appear for all default assets", async ({ page }) => {
    await page.goto("/");

    // All three default assets should have detail rows
    await expect(page.getByTestId("asset-details-a1")).toBeVisible();
    await expect(page.getByTestId("asset-details-a2")).toBeVisible();
    await expect(page.getByTestId("asset-details-a3")).toBeVisible();

    await captureScreenshot(page, "task-22-all-detail-fields");
  });
});
