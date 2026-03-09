import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Investment contributions", () => {
  test("switching surplus target radio moves surplus badge between assets", async ({ page }) => {
    await page.goto("/?step=assets");

    // Verify surplus badge is on the first asset initially
    const surplusBadgeA1 = page.getByTestId("surplus-amount-a1");
    await expect(surplusBadgeA1).toBeVisible();

    // RRSP (a3) should NOT have a surplus badge
    const surplusBadgeA3 = page.getByTestId("surplus-amount-a3");
    await expect(surplusBadgeA3).not.toBeVisible();

    // Switch surplus target to RRSP (a3)
    const surplusRadioA3 = page.getByTestId("surplus-target-a3").locator("input[type=radio]");
    await surplusRadioA3.click();

    // Surplus badge should now be on RRSP, not Savings Account
    await expect(surplusBadgeA1).not.toBeVisible();
    await expect(surplusBadgeA3).toBeVisible();

    // Switch back to Savings Account (a1) to verify full reset
    const surplusRadioA1 = page.getByTestId("surplus-target-a1").locator("input[type=radio]");
    await surplusRadioA1.click();

    // Should revert to original state
    await expect(surplusBadgeA1).toBeVisible();
    await expect(surplusBadgeA3).not.toBeVisible();

    await captureScreenshot(page, "surplus-target-switch-projections");
  });

  test("surplus metric decreases when contributions are added", async ({ page }) => {
    await page.goto("/?step=assets");

    // Check initial surplus on dashboard
    await page.getByTestId("wizard-skip-to-dashboard").click();
    await expect(page.getByTestId("snapshot-dashboard")).toBeVisible();
    const surplusCard = page.getByRole("group", { name: "Monthly Cash Flow" });
    const initialText = await surplusCard.textContent();

    // Go back to assets and add a contribution
    await page.goto("/?step=assets");
    await page.getByTestId("contribution-badge-a1").click();
    const input = page.getByLabel("Edit monthly contribution for Savings Account");
    await input.fill("500");
    await input.press("Enter");

    // Navigate to dashboard to check surplus changed
    await page.waitForTimeout(300);
    await page.getByTestId("wizard-skip-to-dashboard").click();
    await expect(page.getByTestId("snapshot-dashboard")).toBeVisible();

    const surplusCardAfter = page.getByRole("group", { name: "Monthly Cash Flow" });
    const afterText = await surplusCardAfter.textContent();

    // Surplus should have decreased
    expect(afterText).not.toEqual(initialText);

    await captureScreenshot(page, "task-35-surplus-with-contributions");
  });
});
