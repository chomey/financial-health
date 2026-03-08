/**
 * Financial Roadmap E2E Regression (Task 151)
 *
 * Full Playwright regression for the roadmap feature:
 *   1. CA default data — 10 CA steps, budget complete, EF visible, TFSA/RRSP detected
 *   2. Switch to US — steps swap to US variants (401k, HSA, IRA)
 *   3. Acknowledge employer match — URL fca= param, reload preserves state
 *   4. Skip HSA — N/A badge, URL fcs= param
 *   5. Undo acknowledgement — step reverts, URL cleared
 *   6. Add high-interest debt — "Pay High-Interest Debt" step becomes in-progress
 *   7. Add savings to hit 3-month EF — step completes
 *   8. Progress bar updates with each change
 */

import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Financial Roadmap Regression (Task 151)", () => {
  test.beforeEach(async ({ page }) => {
    // Prevent the mobile wizard from blocking UI interactions
    await page.addInitScript(() => {
      localStorage.setItem("fhs-wizard-done", "1");
    });
  });

  // ── Helper: scroll roadmap into view and wait for it ─────────────────────────

  async function openRoadmap(page: Parameters<typeof test>[1]) {
    await page.evaluate(() => {
      document.getElementById("roadmap")?.scrollIntoView({ behavior: "instant" });
    });
    const chart = page.locator('[data-testid="financial-flowchart"]');
    await expect(chart).toBeVisible();
    return chart;
  }

  // ── 1. CA default data ────────────────────────────────────────────────────────

  test("1: CA default — 10 CA steps, budget complete, EF hint, TFSA/RRSP detected", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const chart = await openRoadmap(page);

    // 10 step buttons rendered
    const stepButtons = chart.locator('[data-testid^="step-button-"]');
    await expect(stepButtons).toHaveCount(10);

    // All step IDs start with "ca-" (CA mode)
    const allIds = await stepButtons.evaluateAll((btns) =>
      btns.map((b) => b.getAttribute("data-testid") ?? ""),
    );
    expect(allIds.every((id) => id.startsWith("step-button-ca-"))).toBe(true);

    // Community credit shows CA
    await expect(chart).toContainText("r/PersonalFinanceCanada");

    // Budget step is complete — hint says income+expenses entered
    const budgetBtn = chart.locator('[data-testid="step-button-ca-budget"]');
    await expect(budgetBtn).toContainText("Income and expenses are entered");

    // Full EF step shows "months" in hint (complete or in-progress)
    const efBtn = chart.locator('[data-testid="step-button-ca-full-ef"]');
    const efText = await efBtn.textContent();
    expect(efText).toMatch(/months/i);

    // TFSA step shows it's detected
    const tfsaBtn = chart.locator('[data-testid="step-button-ca-tfsa"]');
    await expect(tfsaBtn).toContainText("You have a TFSA");

    // RRSP step shows it's detected
    const rrspBtn = chart.locator('[data-testid="step-button-ca-rrsp"]');
    await expect(rrspBtn).toContainText("You have an RRSP");

    // Progress bar is visible with aria role
    const progressBar = chart.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();
    await expect(progressBar).toHaveAttribute("aria-valuenow", "70");

    await captureScreenshot(page, "task-151-ca-roadmap-default");
  });

  // ── 2. Switch to US ───────────────────────────────────────────────────────────

  test("2: Switch to US — US step titles, no TFSA/RRSP, US community credit", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Click the US country button
    await page.getByTestId("country-us").click();

    // Wait for the flowchart to reflect US mode
    const chart = await openRoadmap(page);
    await expect(chart).toContainText("r/personalfinance How to handle $");

    // 10 steps still rendered
    const stepButtons = chart.locator('[data-testid^="step-button-"]');
    await expect(stepButtons).toHaveCount(10);

    // US-specific steps are present
    await expect(chart.locator('[data-testid="step-button-us-employer-match"]')).toBeVisible();
    await expect(chart.locator('[data-testid="step-button-us-hsa"]')).toBeVisible();
    await expect(chart.locator('[data-testid="step-button-us-ira"]')).toBeVisible();
    await expect(chart.locator('[data-testid="step-button-us-401k"]')).toBeVisible();
    await expect(chart.locator('[data-testid="step-button-us-taxable"]')).toBeVisible();

    // CA-specific steps are gone
    await expect(chart.locator('[data-testid="step-button-ca-tfsa"]')).not.toBeVisible();
    await expect(chart.locator('[data-testid="step-button-ca-rrsp"]')).not.toBeVisible();
    await expect(chart.locator('[data-testid="step-button-ca-resp-fhsa"]')).not.toBeVisible();

    // US step titles
    await expect(chart).toContainText("Employer 401(k) Match");
    await expect(chart).toContainText("Max HSA");
    await expect(chart).toContainText("Max IRA / Roth IRA");
    await expect(chart).toContainText("Max 401(k)");

    await captureScreenshot(page, "task-151-us-roadmap");
  });

  // ── 3. Acknowledge employer match ─────────────────────────────────────────────

  test("3: Acknowledge employer match — URL fca= param, reload preserves state", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch to US
    await page.getByTestId("country-us").click();

    const chart = await openRoadmap(page);
    await expect(chart).toContainText("Employer 401(k) Match");

    // Expand the employer match step
    await chart.locator('[data-testid="step-button-us-employer-match"]').click();
    const detail = chart.locator('[data-testid="step-detail-us-employer-match"]');
    await expect(detail).toBeVisible();

    // Check the acknowledge checkbox
    const ackCheckbox = chart.locator('[data-testid="ack-checkbox-us-employer-match"]');
    await ackCheckbox.check();
    await expect(ackCheckbox).toBeChecked();

    // URL should now contain fca=us-employer-match
    await expect(page).toHaveURL(/fca=.*us-employer-match/);

    // Progress bar should increase (step acknowledged = complete)
    const progressBar = chart.locator('[role="progressbar"]');
    const valuenow = await progressBar.getAttribute("aria-valuenow");
    expect(parseInt(valuenow ?? "0")).toBeGreaterThan(50);

    // Reload — acknowledgement persists
    await page.reload();
    await page.waitForLoadState("networkidle");
    const chartAfterReload = await openRoadmap(page);

    await chartAfterReload.locator('[data-testid="step-button-us-employer-match"]').click();
    const reloadedCheckbox = chartAfterReload.locator(
      '[data-testid="ack-checkbox-us-employer-match"]',
    );
    await expect(reloadedCheckbox).toBeChecked();
  });

  // ── 4. Skip HSA ──────────────────────────────────────────────────────────────

  test("4: Skip HSA — N/A badge, URL fcs= param", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Switch to US
    await page.getByTestId("country-us").click();

    const chart = await openRoadmap(page);

    // Expand the HSA step
    await chart.locator('[data-testid="step-button-us-hsa"]').click();
    const detail = chart.locator('[data-testid="step-detail-us-hsa"]');
    await expect(detail).toBeVisible();

    // Click the skip checkbox
    const skipCheckbox = chart.locator('[data-testid="skip-checkbox-us-hsa"]');
    await skipCheckbox.check();
    await expect(skipCheckbox).toBeChecked();

    // URL should contain fcs=us-hsa
    await expect(page).toHaveURL(/fcs=.*us-hsa/);

    // HSA step button should now show N/A badge
    const hsaBtn = chart.locator('[data-testid="step-button-us-hsa"]');
    await expect(hsaBtn).toContainText("N/A");
  });

  // ── 5. Undo acknowledgement ───────────────────────────────────────────────────

  test("5: Undo acknowledgement — CA employer match reverts, URL cleared", async ({ page }) => {
    // Start with pre-acknowledged CA employer match
    await page.goto("/?fca=ca-employer-match");
    await page.waitForLoadState("networkidle");

    const chart = await openRoadmap(page);

    // URL already has the fca param
    await expect(page).toHaveURL(/fca=.*ca-employer-match/);

    // Expand the employer match step
    await chart.locator('[data-testid="step-button-ca-employer-match"]').click();
    const detail = chart.locator('[data-testid="step-detail-ca-employer-match"]');
    await expect(detail).toBeVisible();

    // Checkbox is checked (pre-acked)
    const ackCheckbox = chart.locator('[data-testid="ack-checkbox-ca-employer-match"]');
    await expect(ackCheckbox).toBeChecked();

    // Undo button is visible
    const undoBtn = chart.locator('[data-testid="undo-button-ca-employer-match"]');
    await expect(undoBtn).toBeVisible();

    // Click undo
    await undoBtn.click();

    // URL should no longer contain fca=ca-employer-match
    const url = page.url();
    expect(url).not.toMatch(/fca=.*ca-employer-match/);

    // Checkbox is now unchecked
    await expect(ackCheckbox).not.toBeChecked();

    // Undo button is gone
    await expect(undoBtn).not.toBeVisible();
  });

  // ── 6. Add high-interest debt ─────────────────────────────────────────────────

  test("6: Add high-interest debt — Pay High-Interest Debt step becomes in-progress", async ({
    page,
  }) => {
    // Start with pre-acknowledged employer match so high-debt step can be in-progress
    await page.goto("/?fca=ca-employer-match");
    await page.waitForLoadState("networkidle");

    // Verify ca-high-debt is currently complete (no high-interest debt)
    {
      const chart = await openRoadmap(page);
      const highDebtBtn = chart.locator('[data-testid="step-button-ca-high-debt"]');
      await expect(highDebtBtn).toContainText("No high-interest debt detected");
    }

    // Scroll back to top to add debt via UI
    await page.evaluate(() => window.scrollTo(0, 0));

    // Add a new high-interest debt
    await page.getByText("+ Add Debt").click();
    await page.getByLabel("New debt category").fill("Credit Card");
    await page.getByLabel("New debt amount").fill("3000");
    await page.getByLabel("Confirm add debt").click();

    // Wait for the new debt to appear (scoped to debt list to avoid strict-mode collisions)
    await expect(page.getByRole("button", { name: "Edit category for Credit Card" })).toBeVisible();

    // Set the interest rate to 20%
    await page.getByLabel("Edit interest rate for Credit Card").click();
    const rateInput = page.getByLabel("Edit interest rate for Credit Card");
    await rateInput.fill("20");
    await rateInput.press("Enter");

    // Wait for URL to reflect the new state
    await page.waitForFunction(() => window.location.search.includes("s="));

    // Scroll to roadmap and verify the high-debt step is now in-progress
    const chart = await openRoadmap(page);
    const highDebtBtn = chart.locator('[data-testid="step-button-ca-high-debt"]');

    // The step hint should now mention Credit Card
    await expect(highDebtBtn).toContainText("Credit Card");

    // The step is no longer complete — it's in-progress or shows the debt
    const stepText = await highDebtBtn.textContent();
    expect(stepText).not.toMatch(/No high-interest debt detected/);
  });

  // ── 7. Add savings to complete 3-month EF ────────────────────────────────────

  test("7: Add savings to hit 3-month EF — step completes", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Load the fresh-grad profile (has income, expenses, TFSA+Savings = $3500, student loan $350/mo)
    // Monthly obligations = $2030 + $350 = $2380; 3-month target = $7140
    await page.getByTestId("sample-profile-fresh-grad").click();
    await page.waitForFunction(() => window.location.search.includes("s="));

    // Add ca-employer-match ack to URL so EF step can be the focus
    const currentUrl = page.url();
    const urlWithAck = currentUrl.includes("?")
      ? currentUrl + "&fca=ca-employer-match"
      : currentUrl + "?fca=ca-employer-match";
    await page.goto(urlWithAck);
    await page.waitForLoadState("networkidle");

    // Verify EF step is not yet complete (showing progress)
    {
      const chart = await openRoadmap(page);
      const efBtn = chart.locator('[data-testid="step-button-ca-full-ef"]');
      const efText = await efBtn.textContent();
      // Should show months covered but not complete
      expect(efText).toMatch(/of 3 months covered/i);
    }

    // Scroll back to add a savings account
    await page.evaluate(() => window.scrollTo(0, 0));

    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Emergency Fund");
    await page.getByLabel("New asset amount").fill("6000");
    await page.getByLabel("Confirm add asset").click();

    await expect(
      page.getByRole("button", { name: "Edit category for Emergency Fund" }),
    ).toBeVisible();

    // Wait for URL to update
    await page.waitForFunction(() => window.location.search.includes("s="));

    // Scroll to roadmap and verify EF step is now complete
    const chart = await openRoadmap(page);
    const efBtn = chart.locator('[data-testid="step-button-ca-full-ef"]');
    const efText = await efBtn.textContent();
    // $3500 existing + $6000 new = $9500 > $7140 → complete
    expect(efText).toMatch(/months — emergency fund complete/i);
  });

  // ── 8. Progress bar updates ───────────────────────────────────────────────────

  test("8: Progress bar updates — increases when employer match is acknowledged", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const chart = await openRoadmap(page);
    const progressBar = chart.locator('[role="progressbar"]');

    // Default: 7/10 = 70%
    await expect(progressBar).toHaveAttribute("aria-valuenow", "70");
    await expect(progressBar).toHaveAttribute("aria-label", "Roadmap progress: 7 of 10 steps");

    // Employer match is the first non-complete step, so it's auto-expanded on load.
    // Only click to expand if the detail panel isn't already visible.
    const empDetail = chart.locator('[data-testid="step-detail-ca-employer-match"]');
    if (!(await empDetail.isVisible())) {
      await chart.locator('[data-testid="step-button-ca-employer-match"]').click();
    }
    await expect(empDetail).toBeVisible();

    const ackCheckbox = chart.locator('[data-testid="ack-checkbox-ca-employer-match"]');
    await ackCheckbox.check();

    // Progress bar should update to 8/10 = 80%
    await expect(progressBar).toHaveAttribute("aria-valuenow", "80");
    await expect(progressBar).toHaveAttribute("aria-label", "Roadmap progress: 8 of 10 steps");

    // Undo — should revert to 7/10 = 70%
    const undoBtn = chart.locator('[data-testid="undo-button-ca-employer-match"]');
    await undoBtn.click();

    await expect(progressBar).toHaveAttribute("aria-valuenow", "70");
    await expect(progressBar).toHaveAttribute("aria-label", "Roadmap progress: 7 of 10 steps");
  });
});
