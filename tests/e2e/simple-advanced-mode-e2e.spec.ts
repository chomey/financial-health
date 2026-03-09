/**
 * Task 184: Simple/Advanced Mode E2E Tests
 *
 * Comprehensive E2E tests for mode switching:
 *   1. Mode toggle persists in URL
 *   2. Simple mode hides correct wizard steps and fields
 *   3. Advanced mode shows all fields
 *   4. Switching modes preserves data
 *   5. Simple mode dashboard shows correct subset of sections
 *   6. Quick-start profiles load correctly
 */

import { test, expect } from "@playwright/test";
import { captureScreenshot, setSimpleMode, gotoDashboard } from "./helpers";

test.describe("Task 184: Simple/Advanced Mode E2E", () => {
  // ── 1. Mode toggle persists in URL ──────────────────────────────────────────

  test("simple mode persists in URL after reload", async ({ page }) => {
    await setSimpleMode(page);
    await page.goto("/?step=profile");
    await page.waitForLoadState("networkidle");

    // Verify simple mode is active
    await expect(page.getByTestId("mode-toggle-simple")).toHaveAttribute("aria-pressed", "true");

    // Capture URL with state
    const url = page.url();
    expect(url).toContain("s=");

    // Reload same URL
    await page.goto(url);
    await page.waitForLoadState("networkidle");

    // Simple mode should still be active
    await expect(page.getByTestId("mode-toggle-simple")).toHaveAttribute("aria-pressed", "true");

    await captureScreenshot(page, "task-184-simple-mode-persists-url");
  });

  test("advanced mode persists in URL after reload", async ({ page }) => {
    await page.goto("/?step=profile");
    await page.waitForLoadState("networkidle");

    // Switch to advanced
    await page.getByTestId("mode-toggle-advanced").click();
    await expect(page.getByTestId("mode-toggle-advanced")).toHaveAttribute("aria-pressed", "true");

    const url = page.url();
    await page.goto(url);
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("mode-toggle-advanced")).toHaveAttribute("aria-pressed", "true");
  });

  // ── 2. Simple mode hides correct wizard steps and fields ────────────────────

  test("simple mode wizard: debts, property, stocks steps hidden", async ({ page }) => {
    await setSimpleMode(page);
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    // 6 steps visible
    await expect(page.getByTestId("wizard-step-welcome")).toBeVisible();
    await expect(page.getByTestId("wizard-step-profile")).toBeVisible();
    await expect(page.getByTestId("wizard-step-income")).toBeVisible();
    await expect(page.getByTestId("wizard-step-expenses")).toBeVisible();
    await expect(page.getByTestId("wizard-step-assets")).toBeVisible();
    await expect(page.getByTestId("wizard-step-tax-summary")).toBeVisible();

    // 3 steps hidden
    await expect(page.getByTestId("wizard-step-debts")).not.toBeVisible();
    await expect(page.getByTestId("wizard-step-property")).not.toBeVisible();
    await expect(page.getByTestId("wizard-step-stocks")).not.toBeVisible();
  });

  test("simple mode assets: ROI, tax treatment, contributions hidden", async ({ page }) => {
    await setSimpleMode(page);
    await page.goto("/?step=assets");
    await page.waitForLoadState("networkidle");

    // Core asset list visible
    await expect(page.getByRole("listitem").filter({ hasText: "Savings Account" }).first()).toBeVisible();

    // Advanced fields hidden
    await expect(page.locator("[data-testid^='roi-badge-']").first()).not.toBeVisible();
    await expect(page.locator("[data-testid^='tax-treatment-pill-']").first()).not.toBeVisible();
    await expect(page.locator("[data-testid^='contribution-badge-']").first()).not.toBeVisible();

    // Simple-mode home section visible
    await expect(page.getByTestId("simple-home-section")).toBeVisible();
  });

  test("simple mode expenses: debt payments subsection visible", async ({ page }) => {
    await setSimpleMode(page);
    await page.goto("/?step=expenses");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("simple-debt-payments-section")).toBeVisible();
  });

  test("simple mode income: income type hidden", async ({ page }) => {
    await setSimpleMode(page);
    await page.goto("/?step=income");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("[data-testid^='income-type-']").first()).not.toBeVisible();
  });

  // ── 3. Advanced mode shows all fields ───────────────────────────────────────

  test("advanced mode wizard: all 9 steps visible", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    // Ensure advanced mode
    await page.getByTestId("mode-toggle-advanced").click();

    const expectedSteps = [
      "welcome", "profile", "income", "expenses",
      "debts", "property", "assets", "stocks", "tax-summary",
    ];
    for (const step of expectedSteps) {
      await expect(page.getByTestId(`wizard-step-${step}`)).toBeVisible();
    }
  });

  test("advanced mode assets: ROI and tax treatment visible", async ({ page }) => {
    await page.goto("/?step=assets");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("[data-testid^='roi-badge-']").first()).toBeVisible();
    await expect(page.locator("[data-testid^='tax-treatment-pill-']").first()).toBeVisible();

    // Simple-mode home section hidden
    await expect(page.getByTestId("simple-home-section")).not.toBeVisible();
  });

  test("advanced mode expenses: no debt payments subsection", async ({ page }) => {
    await page.goto("/?step=expenses");
    await page.waitForLoadState("networkidle");

    await expect(page.getByTestId("simple-debt-payments-section")).not.toBeVisible();
  });

  // ── 4. Switching modes preserves data ───────────────────────────────────────

  test("enter data in advanced → switch to simple → switch back → data preserved", async ({ page }) => {
    // Start in advanced mode on assets step
    await page.goto("/?step=assets");
    await page.waitForLoadState("networkidle");

    // Add a new asset in advanced mode
    await page.getByText("+ Add Asset").click();
    await page.getByLabel("New asset category").fill("Brokerage");
    await page.getByLabel("New asset amount").fill("25000");
    await page.getByLabel("Confirm add asset").click();
    await expect(page.getByText("Brokerage")).toBeVisible();

    // Capture URL with state
    await page.waitForTimeout(500);
    const urlWithData = page.url();

    // Switch to simple mode
    await page.getByTestId("mode-toggle-simple").click();
    await expect(page.getByTestId("mode-toggle-simple")).toHaveAttribute("aria-pressed", "true");

    // Brokerage should still be in the asset list (data preserved)
    await expect(page.getByText("Brokerage")).toBeVisible();

    // Switch back to advanced
    await page.getByTestId("mode-toggle-advanced").click();
    await expect(page.getByTestId("mode-toggle-advanced")).toHaveAttribute("aria-pressed", "true");

    // Brokerage still there, with advanced fields visible
    await expect(page.getByText("Brokerage")).toBeVisible();
    await expect(page.locator("[data-testid^='roi-badge-']").first()).toBeVisible();

    await captureScreenshot(page, "task-184-data-preserved-after-mode-switch");
  });

  test("income entered in advanced persists through mode switches", async ({ page }) => {
    // Start advanced on income step
    await page.goto("/?step=income");
    await page.waitForLoadState("networkidle");

    // Add freelance income
    await page.getByText("+ Add Income").click();
    await page.getByLabel("New income category").fill("Freelance");
    await page.getByLabel("New income amount").fill("2000");
    await page.getByLabel("Confirm add income").click();
    await expect(page.getByText("Freelance")).toBeVisible();

    // Switch to simple → back to advanced
    await page.getByTestId("mode-toggle-simple").click();
    await expect(page.getByText("Freelance")).toBeVisible();

    await page.getByTestId("mode-toggle-advanced").click();
    await expect(page.getByText("Freelance")).toBeVisible();
  });

  test("debts entered in advanced survive round-trip through simple mode", async ({ page }) => {
    // Start advanced on debts step
    await page.goto("/?step=debts");
    await page.waitForLoadState("networkidle");

    // Add a credit card debt
    await page.getByText("+ Add Debt").click();
    await page.getByLabel("New debt category").fill("Credit Card");
    await page.getByLabel("New debt amount").fill("5000");
    await page.getByLabel("Confirm add debt").click();
    await expect(page.getByRole("button", { name: "Edit category for Credit Card" })).toBeVisible();

    // Switch to simple mode (debts step hidden, but data stays in state)
    await page.getByTestId("mode-toggle-simple").click();
    await expect(page.getByTestId("mode-toggle-simple")).toHaveAttribute("aria-pressed", "true");

    // Switch back to advanced
    await page.getByTestId("mode-toggle-advanced").click();

    // Navigate to debts step with preserved state
    const url = page.url();
    await page.goto(url.replace(/step=[^&]*/, "step=debts"));
    await page.waitForLoadState("networkidle");

    // Credit Card debt should still be there
    await expect(page.getByRole("button", { name: "Edit category for Credit Card" })).toBeVisible();

    await captureScreenshot(page, "task-184-debts-preserved-through-simple");
  });

  // ── 5. Simple mode dashboard shows correct subset ───────────────────────────

  test("simple mode dashboard: 4 sections, 3 metrics, upgrade banner", async ({ page }) => {
    await setSimpleMode(page);
    await gotoDashboard(page);
    await page.waitForLoadState("networkidle");

    // 4 nav sections
    const stepper = page.getByRole("navigation", { name: "Dashboard sections" });
    await expect(stepper.getByRole("button")).toHaveCount(4);

    // 3 metric cards
    const dashboard = page.getByTestId("snapshot-dashboard");
    await expect(dashboard.locator("[data-testid^='metric-card-']")).toHaveCount(3);

    // Hidden sections
    await expect(page.locator("#section-dash-cashflow")).not.toBeAttached();
    await expect(page.locator("#section-dash-breakdowns")).not.toBeAttached();
    await expect(page.locator("#section-dash-compare")).not.toBeAttached();
    await expect(page.locator("#section-dash-scenarios")).not.toBeAttached();

    // Upgrade banner
    await expect(page.getByTestId("simple-mode-upgrade-banner")).toBeVisible();

    await captureScreenshot(page, "task-184-simple-dashboard-sections");
  });

  test("advanced mode dashboard: 8 sections, all metric cards", async ({ page }) => {
    await gotoDashboard(page);
    await page.waitForLoadState("networkidle");

    // 8 nav sections
    const stepper = page.getByRole("navigation", { name: "Dashboard sections" });
    await expect(stepper.getByRole("button")).toHaveCount(8);

    // More than 3 metric cards
    const dashboard = page.getByTestId("snapshot-dashboard");
    const metricCount = await dashboard.locator("[data-testid^='metric-card-']").count();
    expect(metricCount).toBeGreaterThan(3);

    // No upgrade banner
    await expect(page.getByTestId("simple-mode-upgrade-banner")).not.toBeVisible();

    await captureScreenshot(page, "task-184-advanced-dashboard-sections");
  });

  // ── 6. Quick-start profiles load correctly ──────────────────────────────────

  test("CA renter quick-start profile loads and shows dashboard metrics", async ({ page }) => {
    await setSimpleMode(page);
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("sample-profile-ca-renter").click();
    await page.waitForFunction(() => window.location.search.includes("s="));

    // Dashboard should render with metrics
    const dashboard = page.getByTestId("snapshot-dashboard");
    await expect(dashboard).toBeVisible();
    await expect(dashboard.locator("[data-testid^='metric-card-']").first()).toBeVisible();

    await captureScreenshot(page, "task-184-ca-renter-dashboard");
  });

  test("CA homeowner quick-start profile loads and shows dashboard metrics", async ({ page }) => {
    await setSimpleMode(page);
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    await page.getByTestId("sample-profile-ca-homeowner").click();
    await page.waitForFunction(() => window.location.search.includes("s="));

    const dashboard = page.getByTestId("snapshot-dashboard");
    await expect(dashboard).toBeVisible();
    await expect(dashboard.locator("[data-testid^='metric-card-']").first()).toBeVisible();

    await captureScreenshot(page, "task-184-ca-homeowner-dashboard");
  });

  test("US renter quick-start profile loads after switching to US", async ({ page }) => {
    await setSimpleMode(page);
    // Switch to US on profile step first
    await page.goto("/?step=profile");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(300);

    // Go to welcome step to see US profiles
    const url = page.url();
    await page.goto(url.replace(/step=[^&]*/, "step=welcome"));
    await page.waitForLoadState("networkidle");

    const usRenter = page.getByTestId("sample-profile-us-renter");
    await expect(usRenter).toBeVisible();
    await usRenter.click();
    await page.waitForFunction(() => window.location.search.includes("s="));

    const dashboard = page.getByTestId("snapshot-dashboard");
    await expect(dashboard).toBeVisible();

    await captureScreenshot(page, "task-184-us-renter-dashboard");
  });

  test("US homeowner quick-start profile loads after switching to US", async ({ page }) => {
    await setSimpleMode(page);
    await page.goto("/?step=profile");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("country-us").click();
    await page.waitForTimeout(300);

    const url = page.url();
    await page.goto(url.replace(/step=[^&]*/, "step=welcome"));
    await page.waitForLoadState("networkidle");

    const usHomeowner = page.getByTestId("sample-profile-us-homeowner");
    await expect(usHomeowner).toBeVisible();
    await usHomeowner.click();
    await page.waitForFunction(() => window.location.search.includes("s="));

    const dashboard = page.getByTestId("snapshot-dashboard");
    await expect(dashboard).toBeVisible();

    await captureScreenshot(page, "task-184-us-homeowner-dashboard");
  });

  test("AU renter quick-start profile loads after switching to AU", async ({ page }) => {
    await setSimpleMode(page);
    await page.goto("/?step=profile");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("country-au").click();
    await page.waitForTimeout(300);

    const url = page.url();
    await page.goto(url.replace(/step=[^&]*/, "step=welcome"));
    await page.waitForLoadState("networkidle");

    const auRenter = page.getByTestId("sample-profile-au-renter");
    await expect(auRenter).toBeVisible();
    await auRenter.click();
    await page.waitForFunction(() => window.location.search.includes("s="));

    const dashboard = page.getByTestId("snapshot-dashboard");
    await expect(dashboard).toBeVisible();

    await captureScreenshot(page, "task-184-au-renter-dashboard");
  });

  test("AU homeowner quick-start profile loads after switching to AU", async ({ page }) => {
    await setSimpleMode(page);
    await page.goto("/?step=profile");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("country-au").click();
    await page.waitForTimeout(300);

    const url = page.url();
    await page.goto(url.replace(/step=[^&]*/, "step=welcome"));
    await page.waitForLoadState("networkidle");

    const auHomeowner = page.getByTestId("sample-profile-au-homeowner");
    await expect(auHomeowner).toBeVisible();
    await auHomeowner.click();
    await page.waitForFunction(() => window.location.search.includes("s="));

    const dashboard = page.getByTestId("snapshot-dashboard");
    await expect(dashboard).toBeVisible();

    await captureScreenshot(page, "task-184-au-homeowner-dashboard");
  });

  test("quick-start profiles are not visible in advanced mode", async ({ page }) => {
    await page.goto("/?step=welcome");
    await page.waitForLoadState("networkidle");

    // Advanced mode by default (from playwright config)
    await expect(page.getByTestId("sample-profile-ca-renter")).not.toBeAttached();
    await expect(page.getByTestId("sample-profile-ca-homeowner")).not.toBeAttached();

    // Advanced profiles should be visible
    await expect(page.getByTestId("sample-profile-fresh-grad")).toBeVisible();
  });
});
