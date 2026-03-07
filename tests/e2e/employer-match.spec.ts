import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Employer match modeling (Task 112)", () => {
  test("employer match section is visible for RRSP but not for Savings Account", async ({ page }) => {
    await page.goto("/");

    // a3 is RRSP in INITIAL_STATE — should show employer match section
    const rrspMatch = page.getByTestId("employer-match-section-a3");
    await expect(rrspMatch).toBeVisible();

    // a1 is Savings Account — should NOT show employer match section
    const savingsMatch = page.getByTestId("employer-match-section-a1");
    await expect(savingsMatch).not.toBeVisible();
  });

  test("employer match pct and cap buttons are visible for RRSP", async ({ page }) => {
    await page.goto("/");

    const pctBtn = page.getByTestId("employer-match-pct-a3");
    const capBtn = page.getByTestId("employer-match-cap-a3");

    await expect(pctBtn).toBeVisible();
    await expect(capBtn).toBeVisible();
    await expect(pctBtn).toHaveText("Employer match %");
    await expect(capBtn).toHaveText("salary cap %");

    await captureScreenshot(page, "task-112-employer-match-empty");
  });

  test("setting employer match pct shows violet badge", async ({ page }) => {
    await page.goto("/");

    // Click to edit employer match pct for RRSP
    await page.getByTestId("employer-match-pct-a3").click();

    const input = page.getByLabel("Edit employer match percent for RRSP");
    await expect(input).toBeVisible();
    await input.fill("50");
    await input.press("Enter");

    // Badge should update to show configured value
    const pctBtn = page.getByTestId("employer-match-pct-a3");
    await expect(pctBtn).toContainText("50% match");
  });

  test("setting employer match cap shows violet badge", async ({ page }) => {
    await page.goto("/");

    // Set cap for RRSP
    await page.getByTestId("employer-match-cap-a3").click();

    const input = page.getByLabel("Edit employer match cap for RRSP");
    await expect(input).toBeVisible();
    await input.fill("6");
    await input.press("Enter");

    const capBtn = page.getByTestId("employer-match-cap-a3");
    await expect(capBtn).toContainText("up to 6% salary");
  });

  test("employer match amount badge appears when both pct, cap, and monthly contribution are set", async ({ page }) => {
    await page.goto("/");

    // First set a monthly contribution on RRSP (a3)
    await page.getByTestId("contribution-badge-a3").click();
    const contribInput = page.getByLabel("Edit monthly contribution for RRSP");
    await contribInput.fill("500");
    await contribInput.press("Enter");

    // Set employer match pct
    await page.getByTestId("employer-match-pct-a3").click();
    await page.getByLabel("Edit employer match percent for RRSP").fill("50");
    await page.getByLabel("Edit employer match percent for RRSP").press("Enter");

    // Set employer match cap
    await page.getByTestId("employer-match-cap-a3").click();
    await page.getByLabel("Edit employer match cap for RRSP").fill("6");
    await page.getByLabel("Edit employer match cap for RRSP").press("Enter");

    // Match amount should appear
    // Salary: $4500/mo × 12 = $54k, cap 6% = $3240/yr = $270/mo
    // Match: $500 × 50% = $250 → min($250, $270) = $250
    const matchAmount = page.getByTestId("employer-match-amount-a3");
    await expect(matchAmount).toBeVisible();
    await expect(matchAmount).toContainText("$250");
    await expect(matchAmount).toContainText("/mo employer match");

    await captureScreenshot(page, "task-112-employer-match-amount");
  });

  test("employer match insight appears in insights panel", async ({ page }) => {
    await page.goto("/");

    // Set monthly contribution on RRSP
    await page.getByTestId("contribution-badge-a3").click();
    await page.getByLabel("Edit monthly contribution for RRSP").fill("500");
    await page.getByLabel("Edit monthly contribution for RRSP").press("Enter");

    // Set employer match
    await page.getByTestId("employer-match-pct-a3").click();
    await page.getByLabel("Edit employer match percent for RRSP").fill("50");
    await page.getByLabel("Edit employer match percent for RRSP").press("Enter");

    await page.getByTestId("employer-match-cap-a3").click();
    await page.getByLabel("Edit employer match cap for RRSP").fill("6");
    await page.getByLabel("Edit employer match cap for RRSP").press("Enter");

    // Wait for insights to update
    await page.waitForTimeout(300);

    // Employer match insight should appear
    const insightText = page.locator("text=free money");
    await expect(insightText).toBeVisible();

    await captureScreenshot(page, "task-112-employer-match-insight");
  });

  test("employer match not shown for TFSA (a2)", async ({ page }) => {
    await page.goto("/");

    const tfsaMatch = page.getByTestId("employer-match-section-a2");
    await expect(tfsaMatch).not.toBeVisible();
  });

  test("employer match cap limits the computed match when contribution is large", async ({ page }) => {
    await page.goto("/");

    // Set a large monthly contribution on RRSP
    await page.getByTestId("contribution-badge-a3").click();
    await page.getByLabel("Edit monthly contribution for RRSP").fill("2000");
    await page.getByLabel("Edit monthly contribution for RRSP").press("Enter");

    // 100% match, 3% salary cap
    await page.getByTestId("employer-match-pct-a3").click();
    await page.getByLabel("Edit employer match percent for RRSP").fill("100");
    await page.getByLabel("Edit employer match percent for RRSP").press("Enter");

    await page.getByTestId("employer-match-cap-a3").click();
    await page.getByLabel("Edit employer match cap for RRSP").fill("3");
    await page.getByLabel("Edit employer match cap for RRSP").press("Enter");

    // Salary: $4500/mo × 12 = $54k, cap 3% = $1620/yr = $135/mo
    // Match: $2000 × 100% = $2000 → capped at $135/mo
    const matchAmount = page.getByTestId("employer-match-amount-a3");
    await expect(matchAmount).toBeVisible();
    await expect(matchAmount).toContainText("$135");

    await captureScreenshot(page, "task-112-employer-match-capped");
  });
});
