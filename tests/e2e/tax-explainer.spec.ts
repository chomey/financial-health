import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

test.describe("Tax Explainer Modal", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-estimated-tax"]');
  });

  test("clicking Estimated Tax card opens tax-specific explainer", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="explainer-modal"]');

    // Should show tax explainer, not generic source cards
    await expect(page.locator('[data-testid="tax-explainer"]')).toBeVisible();
    // Generic source cards should NOT be present
    await expect(page.locator('[data-testid="explainer-sources"]')).not.toBeVisible();
  });

  test("shows bracket bar with colored segments", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    const bracketBar = page.locator('[data-testid="tax-bracket-bar"]');
    await expect(bracketBar).toBeVisible();

    // At least one bracket segment should exist
    const segments = page.locator('[data-testid^="tax-bracket-segment-"]');
    const count = await segments.count();
    expect(count).toBeGreaterThan(0);

    // Segments should have background colors
    const firstSegment = segments.first();
    const bgColor = await firstSegment.evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );
    expect(bgColor).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("shows federal and provincial breakdown", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    const modal = page.locator('[data-testid="explainer-modal"]');
    const breakdown = modal.locator('[data-testid="tax-breakdown"]');
    await breakdown.scrollIntoViewIfNeeded();
    await expect(breakdown).toBeVisible();
    await expect(breakdown).toContainText("Federal");
    await expect(breakdown).toContainText("Provincial");
    await expect(breakdown).toContainText("Ontario");

    // Federal and provincial amounts should be displayed
    await expect(page.locator('[data-testid="tax-federal-amount"]')).toBeVisible();
    await expect(page.locator('[data-testid="tax-provincial-amount"]')).toBeVisible();
  });

  test("shows effective and marginal rates", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    const rates = page.locator('[data-testid="tax-rates"]');
    await expect(rates).toBeVisible();

    const effectiveRate = page.locator('[data-testid="tax-effective-rate"]');
    await expect(effectiveRate).toBeVisible();
    const effectiveText = await effectiveRate.textContent();
    expect(effectiveText).toMatch(/\d+\.\d+%/);

    const marginalRate = page.locator('[data-testid="tax-marginal-rate"]');
    await expect(marginalRate).toBeVisible();
    const marginalText = await marginalRate.textContent();
    expect(marginalText).toMatch(/\d+\.\d+%/);
  });

  test("shows after-tax income flow", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');

    const flow = page.locator('[data-testid="tax-after-tax-flow"]');
    await expect(flow).toBeVisible();
    await expect(flow).toContainText("Gross");
    await expect(flow).toContainText("Tax");
    await expect(flow).toContainText("After-tax");
  });

  test("modal closes on Escape key", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible();
  });

  test("captures screenshot of tax explainer", async ({ page }) => {
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');
    await captureScreenshot(page, "task-84-tax-explainer");
  });
});

test.describe("Tax Explainer - Zero Income", () => {
  test("clicking Estimated Tax card with $0 income opens explainer with bracket reference", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-estimated-tax"]');

    // Remove salary income
    const salaryRow = page.getByRole("listitem").filter({ hasText: "Salary" });
    await salaryRow.hover();
    await page.getByLabel("Delete Salary").click();
    await page.waitForTimeout(300);

    // Also remove all assets to eliminate investment interest income
    await page.click('button:has-text("Assets")');
    await page.waitForTimeout(300);
    for (const label of ["Savings Account", "TFSA", "RRSP"]) {
      const row = page.getByRole("listitem").filter({ hasText: label });
      if (await row.count() > 0) {
        await row.hover();
        await page.getByLabel(`Delete ${label}`).click();
        await page.waitForTimeout(200);
      }
    }
    await page.click('button:has-text("Dashboard")');
    await page.waitForTimeout(300);

    // Estimated Tax should show CA$0
    const taxCard = page.locator('[data-testid="metric-card-estimated-tax"]');
    await expect(taxCard).toContainText("CA$0");

    // Click should still open the explainer
    await taxCard.click();
    await page.waitForSelector('[data-testid="explainer-modal"]');

    // Should show tax explainer content
    await expect(page.locator('[data-testid="tax-explainer"]')).toBeVisible();

    // Should show the zero-income message
    const zeroMsg = page.locator('[data-testid="tax-zero-income-message"]');
    await expect(zeroMsg).toBeVisible();
    await expect(zeroMsg).toContainText("No income entered");
    await expect(zeroMsg).toContainText("Ontario");

    // Should show bracket tables (unfilled for zero income)
    await expect(page.locator('[data-testid="tax-federal-brackets-table"]')).toBeVisible();

    // Should show 0.0% rates
    await expect(page.locator('[data-testid="tax-effective-rate"]')).toContainText("0.0%");
    await expect(page.locator('[data-testid="tax-marginal-rate"]')).toContainText("0.0%");

    // Should NOT show after-tax flow
    await expect(page.locator('[data-testid="tax-after-tax-flow"]')).not.toBeVisible();

    await captureScreenshot(page, "task-89-tax-explainer-zero-income");
  });

  test("zero income explainer closes on Escape", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="metric-card-estimated-tax"]');

    // Remove income
    const salaryRow = page.getByRole("listitem").filter({ hasText: "Salary" });
    await salaryRow.hover();
    await page.getByLabel("Delete Salary").click();
    await page.waitForTimeout(300);

    // Open and close
    await page.click('[data-testid="metric-card-estimated-tax"]');
    await page.waitForSelector('[data-testid="tax-explainer"]');
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="explainer-modal"]')).not.toBeVisible();
  });
});
