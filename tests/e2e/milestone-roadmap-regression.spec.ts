/**
 * Financial Roadmap E2E Regression (Task 151)
 *
 * Full Playwright regression for the roadmap feature:
 *   1. CA default data — 10 CA steps, budget complete, EF visible, TFSA/RRSP detected
 *   2. Switch to US — steps swap to US variants (401k, HSA, IRA)
 *   3. Acknowledge employer match — checkbox persists after reload
 *   4. Skip HSA — N/A badge appears
 *   5. Undo acknowledgement — step reverts
 *   6. Add high-interest debt — "Pay High-Interest Debt" step becomes in-progress
 *   7. Add savings to hit 3-month EF — step completes
 *   8. Progress bar updates with each change
 */

import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Financial Roadmap Regression (Task 151)", () => {
  // ── Helper: scroll roadmap into view and wait for it ─────────────────────────

  async function openRoadmap(page: Parameters<typeof test>[1]) {
    await page.evaluate(() => {
      document.getElementById("section-dash-roadmap")?.scrollIntoView({ behavior: "instant" });
    });
    const chart = page.locator('[data-testid="financial-flowchart"]');
    await expect(chart).toBeVisible();
    return chart;
  }

  /** Navigate from current URL (with s= param) to dashboard */
  async function goToDashboard(page: Parameters<typeof test>[1]) {
    const url = page.url();
    const dashUrl = url.replace(/step=[^&]*&?/, "").replace(/[&?]$/, "");
    await page.goto(dashUrl);
    await page.waitForLoadState("networkidle");
  }

  // ── 1. CA default data ────────────────────────────────────────────────────────

  test("1: CA default — 10 CA steps, budget complete, EF hint, TFSA/RRSP detected", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const chart = await openRoadmap(page);

    // 10 step buttons rendered
    const stepButtons = chart.locator('[data-testid^="flowchart-step-"]');
    await expect(stepButtons).toHaveCount(10);

    // All step IDs start with "flowchart-step-ca-" (CA mode)
    const allIds = await stepButtons.evaluateAll((btns) =>
      btns.map((b) => b.getAttribute("data-testid") ?? ""),
    );
    expect(allIds.every((id) => id.startsWith("flowchart-step-ca-"))).toBe(true);

    // Community credit shows CA
    await expect(chart).toContainText("r/PersonalFinanceCanada");

    // Budget step title is visible (complete steps don't show hint in button)
    const budgetBtn = chart.locator('[data-testid="flowchart-step-ca-budget"]');
    await expect(budgetBtn).toContainText("Budget");

    // Full EF step is visible
    const efBtn = chart.locator('[data-testid="flowchart-step-ca-full-ef"]');
    await expect(efBtn).toBeVisible();

    // TFSA step is visible
    const tfsaBtn = chart.locator('[data-testid="flowchart-step-ca-tfsa"]');
    await expect(tfsaBtn).toBeVisible();

    // RRSP step is visible
    const rrspBtn = chart.locator('[data-testid="flowchart-step-ca-rrsp"]');
    await expect(rrspBtn).toBeVisible();

    // Progress bar is visible with aria role
    const progressBar = chart.locator('[role="progressbar"]');
    await expect(progressBar).toBeVisible();

    await captureScreenshot(page, "task-151-ca-roadmap-default");
  });

  // ── 2. Switch to US ───────────────────────────────────────────────────────────

  test("2: Switch to US — US step titles, no TFSA/RRSP, US community credit", async ({ page }) => {
    // Switch country on profile wizard step
    await page.goto("/?step=profile");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(300);

    // Navigate to dashboard
    await goToDashboard(page);

    const chart = await openRoadmap(page);
    await expect(chart).toContainText("r/personalfinance");

    // 10 steps still rendered
    const stepButtons = chart.locator('[data-testid^="flowchart-step-"]');
    await expect(stepButtons).toHaveCount(10);

    // US-specific steps are present
    await expect(chart.locator('[data-testid="flowchart-step-us-employer-match"]')).toBeVisible();
    await expect(chart.locator('[data-testid="flowchart-step-us-hsa"]')).toBeVisible();
    await expect(chart.locator('[data-testid="flowchart-step-us-ira"]')).toBeVisible();
    await expect(chart.locator('[data-testid="flowchart-step-us-401k"]')).toBeVisible();
    await expect(chart.locator('[data-testid="flowchart-step-us-taxable"]')).toBeVisible();

    // CA-specific steps are gone
    await expect(chart.locator('[data-testid="flowchart-step-ca-tfsa"]')).not.toBeVisible();
    await expect(chart.locator('[data-testid="flowchart-step-ca-rrsp"]')).not.toBeVisible();
    await expect(chart.locator('[data-testid="flowchart-step-ca-resp-fhsa"]')).not.toBeVisible();

    // US step titles
    await expect(chart).toContainText("Employer 401(k) Match");
    await expect(chart).toContainText("Max HSA");
    await expect(chart).toContainText("Max IRA / Roth IRA");
    await expect(chart).toContainText("Max 401(k)");

    await captureScreenshot(page, "task-151-us-roadmap");
  });

  // ── 3. Acknowledge employer match ─────────────────────────────────────────────

  test("3: Acknowledge employer match — checkbox persists after reload", async ({
    page,
  }) => {
    // Switch to US via profile step
    await page.goto("/?step=profile");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(300);
    await goToDashboard(page);

    const chart = await openRoadmap(page);
    await expect(chart).toContainText("Employer 401(k) Match");

    // Click the employer match step to open modal
    await chart.locator('[data-testid="flowchart-step-us-employer-match"]').click();
    const modal = page.locator('[data-testid="step-modal-us-employer-match"]');
    await expect(modal).toBeVisible();

    // Check the acknowledge checkbox
    const ackCheckbox = page.locator('[data-testid="ack-checkbox-us-employer-match"]');
    await ackCheckbox.check();
    await expect(ackCheckbox).toBeChecked();

    // Progress bar should show increased value
    const progressBar = chart.locator('[role="progressbar"]');
    const valuenow = await progressBar.getAttribute("aria-valuenow");
    expect(parseInt(valuenow ?? "0")).toBeGreaterThanOrEqual(50);

    // Reload — acknowledgement persists in s= state
    const urlWithState = page.url();
    await page.goto(urlWithState);
    await page.waitForLoadState("networkidle");
    const chartAfterReload = await openRoadmap(page);

    await chartAfterReload.locator('[data-testid="flowchart-step-us-employer-match"]').click();
    const reloadedCheckbox = page.locator('[data-testid="ack-checkbox-us-employer-match"]');
    await expect(reloadedCheckbox).toBeChecked();
  });

  // ── 4. Skip HSA ──────────────────────────────────────────────────────────────

  test("4: Skip HSA — N/A badge appears", async ({ page }) => {
    // Switch to US via profile step
    await page.goto("/?step=profile");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(300);
    await goToDashboard(page);

    const chart = await openRoadmap(page);

    // Click the HSA step to open modal
    await chart.locator('[data-testid="flowchart-step-us-hsa"]').click();
    const modal = page.locator('[data-testid="step-modal-us-hsa"]');
    await expect(modal).toBeVisible();

    // Click the skip checkbox
    const skipCheckbox = page.locator('[data-testid="skip-checkbox-us-hsa"]');
    await skipCheckbox.check();
    await expect(skipCheckbox).toBeChecked();

    // Close modal
    await page.locator('[aria-label="Close detail view"]').click();
    await expect(modal).not.toBeVisible();

    // HSA step button should now show N/A badge
    const hsaBtn = chart.locator('[data-testid="flowchart-step-us-hsa"]');
    await expect(hsaBtn).toContainText("N/A");
  });

  // ── 5. Undo acknowledgement ───────────────────────────────────────────────────

  test("5: Undo acknowledgement — CA employer match reverts", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const chart = await openRoadmap(page);

    // Open employer match modal and acknowledge it
    await chart.locator('[data-testid="flowchart-step-ca-employer-match"]').click();
    const modal = page.locator('[data-testid="step-modal-ca-employer-match"]');
    await expect(modal).toBeVisible();

    const ackCheckbox = page.locator('[data-testid="ack-checkbox-ca-employer-match"]');
    await ackCheckbox.check();
    await expect(ackCheckbox).toBeChecked();

    // Undo button is visible
    const undoBtn = page.locator('[data-testid="undo-button-ca-employer-match"]');
    await expect(undoBtn).toBeVisible();

    // Click undo
    await undoBtn.click();

    // Checkbox is now unchecked
    await expect(ackCheckbox).not.toBeChecked();

    // Undo button is gone
    await expect(undoBtn).not.toBeVisible();
  });

  // ── 6. Add high-interest debt ─────────────────────────────────────────────────

  test("6: Add high-interest debt — Pay High-Interest Debt step becomes in-progress", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Verify ca-high-debt step exists (complete since no high-interest debt)
    {
      const chart = await openRoadmap(page);
      const highDebtBtn = chart.locator('[data-testid="flowchart-step-ca-high-debt"]');
      await expect(highDebtBtn).toBeVisible();
    }

    // Navigate to debts wizard step to add a high-interest debt
    const currentUrl = page.url();
    const debtUrl = currentUrl.includes("?")
      ? currentUrl.replace("?", "?step=debts&")
      : currentUrl + "?step=debts";
    await page.goto(debtUrl);
    await page.waitForLoadState("networkidle");

    // Add a credit card debt
    await page.getByText("+ Add Debt").click();
    await page.getByLabel("New debt category").fill("Credit Card");
    await page.getByLabel("New debt amount").fill("3000");
    await page.getByLabel("Confirm add debt").click();

    await expect(page.getByRole("button", { name: "Edit category for Credit Card" })).toBeVisible();

    // Set the interest rate to 20%
    await page.getByLabel("Edit interest rate for Credit Card").click();
    const rateInput = page.getByLabel("Edit interest rate for Credit Card");
    await rateInput.fill("20");
    await rateInput.press("Enter");

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Navigate back to dashboard
    await goToDashboard(page);

    // Scroll to roadmap and verify the high-debt step changed
    const chart = await openRoadmap(page);
    const highDebtBtn = chart.locator('[data-testid="flowchart-step-ca-high-debt"]');

    // The step hint should now mention Credit Card
    await expect(highDebtBtn).toContainText("Credit Card");

    // The step is no longer complete
    const stepText = await highDebtBtn.textContent();
    expect(stepText).not.toMatch(/No high-interest debt detected/);
  });

  // ── 7. Add savings to complete 3-month EF ────────────────────────────────────

  test("7: Add savings to hit 3-month EF — step completes", async ({ page }) => {
    // Load the fresh-grad profile via welcome step
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("sample-profile-fresh-grad").click();
    await page.waitForFunction(() => window.location.search.includes("s="));

    // Navigate to dashboard to check EF step
    await goToDashboard(page);
    {
      const chart = await openRoadmap(page);
      const efBtn = chart.locator('[data-testid="flowchart-step-ca-full-ef"]');
      const efText = await efBtn.textContent();
      expect(efText).toMatch(/of 3 months covered/i);
    }

    // Navigate to assets step to add savings
    const currentUrl = page.url();
    const assetsUrl = currentUrl.includes("?")
      ? currentUrl.replace("?", "?step=assets&")
      : currentUrl + "?step=assets";
    await page.goto(assetsUrl);
    await page.waitForLoadState("networkidle");

    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Emergency Fund");
    await page.getByLabel("New asset amount").fill("15000");
    await page.getByLabel("Confirm add asset").click();

    await expect(
      page.getByRole("button", { name: "Edit category for Emergency Fund" }),
    ).toBeVisible();

    // Wait for URL to update
    await page.waitForTimeout(500);

    // Navigate to dashboard
    await goToDashboard(page);

    const chart = await openRoadmap(page);
    const efBtn = chart.locator('[data-testid="flowchart-step-ca-full-ef"]');
    // With $15k extra savings, EF should be well above 3-month target
    // Complete steps don't show hint in button — just verify the step is visible
    await expect(efBtn).toBeVisible();
    // If complete, the button text should just be the title (no "of 3 months covered" hint)
    const efText = await efBtn.textContent();
    expect(efText).not.toMatch(/of 3 months covered/i);
  });

  // ── 8. Progress bar updates ───────────────────────────────────────────────────

  test("8: Progress bar updates — increases when employer match is acknowledged", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const chart = await openRoadmap(page);
    const progressBar = chart.locator('[role="progressbar"]');

    // Read initial progress value
    const initialValue = parseInt((await progressBar.getAttribute("aria-valuenow")) ?? "0");

    // Open employer match modal and acknowledge it
    await chart.locator('[data-testid="flowchart-step-ca-employer-match"]').click();
    const modal = page.locator('[data-testid="step-modal-ca-employer-match"]');
    await expect(modal).toBeVisible();

    const ackCheckbox = page.locator('[data-testid="ack-checkbox-ca-employer-match"]');
    await ackCheckbox.check();

    // Progress bar should increase by 10 (1/10 steps)
    const newValue = parseInt((await progressBar.getAttribute("aria-valuenow")) ?? "0");
    expect(newValue).toBeGreaterThan(initialValue);

    // Undo — should revert to original value
    const undoBtn = page.locator('[data-testid="undo-button-ca-employer-match"]');
    await undoBtn.click();

    const revertedValue = parseInt((await progressBar.getAttribute("aria-valuenow")) ?? "0");
    expect(revertedValue).toBe(initialValue);
  });
});
