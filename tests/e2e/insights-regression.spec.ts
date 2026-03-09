import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

/**
 * Task 139: [MILESTONE] New insights E2E regression
 * Verifies insight generation and rendering across different financial scenarios.
 */

async function goToStep(page: import("@playwright/test").Page, step: string) {
  const url = new URL(page.url());
  url.searchParams.set("step", step);
  await page.goto(url.toString());
}

async function setAge(page: import("@playwright/test").Page, age: string) {
  await goToStep(page, "profile");
  const ageInput = page.getByTestId("wizard-age-input");
  await expect(ageInput).toBeVisible({ timeout: 3000 });
  await ageInput.fill(age);
  await ageInput.press("Tab");
  await page.waitForTimeout(500);
}

async function addAsset(page: import("@playwright/test").Page, name: string, amount: string) {
  await goToStep(page, "assets");
  await page.click('text="+ Add Asset"');
  await page.fill('[aria-label="New asset category"]', name);
  await page.fill('[aria-label="New asset amount"]', amount);
  await page.click('[aria-label="Confirm add asset"]');
  await page.waitForTimeout(500);
}

async function addDebt(page: import("@playwright/test").Page, name: string, amount: string) {
  await goToStep(page, "debts");
  await page.click('text="+ Add Debt"');
  await page.fill('[aria-label="New debt category"]', name);
  await page.fill('[aria-label="New debt amount"]', amount);
  await page.click('[aria-label="Confirm add debt"]');
  await page.waitForTimeout(500);
}

async function addIncome(page: import("@playwright/test").Page, name: string, amount: string) {
  await goToStep(page, "income");
  await page.getByText("+ Add Income").click();
  await page.fill('[aria-label="New income category"]', name);
  await page.fill('[aria-label="New income amount"]', amount);
  await page.click('[aria-label="Confirm add income"]');
  await page.waitForTimeout(500);
}

async function addExpense(page: import("@playwright/test").Page, name: string, amount: string) {
  await goToStep(page, "expenses");
  await page.getByText("+ Add Expense").click();
  await page.fill('[aria-label="New expense category"]', name);
  await page.fill('[aria-label="New expense amount"]', amount);
  await page.click('[aria-label="Confirm add expense"]');
  await page.waitForTimeout(500);
}

// --- Contrast ratio helpers ---

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

test.describe("Scenario: Young adult with student debt", () => {
  test("generates insights for young adult profile", async ({ page }) => {
    await page.goto("/?step=dashboard");

    await addIncome(page, "Part-time Job", "4500");
    await addDebt(page, "Student Loans", "35000");
    await addExpense(page, "Rent", "1200");
    await setAge(page, "25");

    await goToStep(page, "dashboard");
    await page.waitForTimeout(2000);

    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();
    const count = await insightsPanel.getByRole("article").count();
    expect(count).toBeGreaterThanOrEqual(3);

    await captureScreenshot(page, "task-139-young-adult-insights");
  });
});

test.describe("Scenario: Mid-career homeowner", () => {
  test("generates insights for mid-career profile", async ({ page }) => {
    await page.goto("/?step=dashboard");

    await addIncome(page, "Software Engineering", "11000");
    await addAsset(page, "Investment Portfolio", "450000");
    await addDebt(page, "Mortgage", "280000");
    await addExpense(page, "Rent", "2800");
    await setAge(page, "42");

    await goToStep(page, "dashboard");
    await page.waitForTimeout(2000);

    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();
    const count = await insightsPanel.getByRole("article").count();
    expect(count).toBeGreaterThanOrEqual(3);

    // Check that at least some of the expected insight types are present
    const allTypes = await page.locator('[data-insight-type]').evaluateAll(els =>
      els.map(el => el.getAttribute('data-insight-type'))
    );
    // With a mid-career profile, we expect DTI, housing, or milestone insights
    const hasExpectedType = allTypes.some(t =>
      ["debt-to-income", "housing-cost", "net-worth-milestone", "net-worth-percentile", "coast-fire"].includes(t!)
    );
    expect(hasExpectedType).toBe(true);

    await captureScreenshot(page, "task-139-mid-career-all-insights");
  });
});

test.describe("Scenario: High earner", () => {
  test("high earner has multiple insight types", async ({ page }) => {
    await page.goto("/?step=dashboard");

    await addIncome(page, "Executive Compensation", "28000");
    await addAsset(page, "Total Portfolio", "2500000");
    await addDebt(page, "Remaining Mortgage", "100000");
    await addExpense(page, "Rent", "3000");
    await setAge(page, "55");

    await goToStep(page, "dashboard");
    await page.waitForTimeout(2000);

    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    await expect(insightsPanel).toBeVisible();
    const count = await insightsPanel.getByRole("article").count();
    expect(count).toBeGreaterThanOrEqual(3);

    await captureScreenshot(page, "task-139-high-earner-insights");
  });
});

test.describe("WCAG AA contrast ratio check on insight cards", () => {
  test("insight card text meets 4.5:1 contrast ratio", async ({ page }) => {
    await page.goto("/?step=dashboard");
    await page.waitForSelector('[data-testid="insights-panel"]');
    await page.waitForTimeout(2000);

    const insightCards = page.locator('[data-testid^="insight-card-"]');
    const count = await insightCards.count();
    expect(count).toBeGreaterThan(0);

    const toCheck = Math.min(count, 5);
    for (let i = 0; i < toCheck; i++) {
      const card = insightCards.nth(i);
      const colors = await card.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          color: style.color,
          backgroundColor: style.backgroundColor,
        };
      });

      const fgMatch = colors.color.match(/(\d+),\s*(\d+),\s*(\d+)/);
      const bgMatch = colors.backgroundColor.match(/(\d+),\s*(\d+),\s*(\d+)/);

      if (fgMatch && bgMatch) {
        const fgLum = relativeLuminance(+fgMatch[1], +fgMatch[2], +fgMatch[3]);
        const bgLum = relativeLuminance(+bgMatch[1], +bgMatch[2], +bgMatch[3]);
        const ratio = contrastRatio(fgLum, bgLum);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    }

    await captureScreenshot(page, "task-139-contrast-check");
  });
});
