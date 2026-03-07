import { test, expect } from "@playwright/test";
import { captureScreenshot } from "./helpers";

/**
 * Task 139: [MILESTONE] New insights E2E regression
 * Verifies all 5 new insight types render correctly across 3 scenarios:
 *   1. Young adult with student debt
 *   2. Mid-career homeowner
 *   3. High earner
 * Also checks WCAG AA contrast ratios.
 */

// --- Reusable helpers ---

async function setAge(page: import("@playwright/test").Page, age: string) {
  const addAgeBtn = page.getByTestId("add-age-button").first();
  if (await addAgeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await addAgeBtn.click();
    await page.waitForTimeout(300);
  } else {
    const ageDisplay = page.getByTestId("age-display").first();
    if (await ageDisplay.isVisible({ timeout: 1000 }).catch(() => false)) {
      await ageDisplay.click();
      await page.waitForTimeout(300);
    }
  }
  const ageInput = page.getByTestId("age-input").first();
  await expect(ageInput).toBeVisible({ timeout: 3000 });
  await ageInput.fill(age);
  await ageInput.press("Enter");
  await page.waitForTimeout(500);
}

async function addAsset(page: import("@playwright/test").Page, name: string, amount: string) {
  await page.click('text="+ Add Asset"');
  await page.fill('[aria-label="New asset category"]', name);
  await page.fill('[aria-label="New asset amount"]', amount);
  await page.click('[aria-label="Confirm add asset"]');
  await page.waitForTimeout(500);
}

async function addDebt(page: import("@playwright/test").Page, name: string, amount: string) {
  await page.click('text="+ Add Debt"');
  await page.fill('[aria-label="New debt category"]', name);
  await page.fill('[aria-label="New debt amount"]', amount);
  await page.click('[aria-label="Confirm add debt"]');
  await page.waitForTimeout(500);
}

async function setDebtMonthlyPayment(page: import("@playwright/test").Page, debtName: string, payment: string) {
  const paymentLabel = page.locator(`[aria-label="Edit monthly payment for ${debtName}"]`);
  if (await paymentLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
    await paymentLabel.click();
    await page.waitForTimeout(200);
  }
  const paymentInput = page.locator(`[aria-label*="Edit monthly payment for ${debtName}"]`).first();
  if (await paymentInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await paymentInput.click();
    await page.waitForTimeout(200);
  }
  // Find the visible input for this debt's monthly payment
  const input = page.locator(`input[aria-label*="monthly payment for ${debtName}"]`).first();
  await expect(input).toBeVisible({ timeout: 3000 });
  await input.fill(payment);
  await input.press("Enter");
  await page.waitForTimeout(300);
}

async function addIncome(page: import("@playwright/test").Page, name: string, amount: string) {
  await page.getByText("+ Add Income").click();
  await page.fill('[aria-label="New income category"]', name);
  await page.fill('[aria-label="New income amount"]', amount);
  await page.click('[aria-label="Confirm add income"]');
  await page.waitForTimeout(500);
}

async function addExpense(page: import("@playwright/test").Page, name: string, amount: string) {
  await page.getByText("+ Add Expense").click();
  await page.fill('[aria-label="New expense category"]', name);
  await page.fill('[aria-label="New expense amount"]', amount);
  await page.click('[aria-label="Confirm add expense"]');
  await page.waitForTimeout(500);
}

// --- Contrast ratio check ---

/**
 * WCAG AA requires 4.5:1 for normal text.
 * Computes relative luminance and contrast ratio for foreground/background.
 */
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

// --- Scenario 1: Young adult with student debt ---

test.describe("Scenario: Young adult with student debt", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');
  });

  test("setup: add income, student debt, rent expense, and set age 25", async ({ page }) => {
    await addIncome(page, "Part-time Job", "4500");
    await addAsset(page, "Savings Account", "15000");
    await addDebt(page, "Student Loans", "35000");
    await setDebtMonthlyPayment(page, "Student Loans", "500");
    await addExpense(page, "Rent", "1200");
    await setAge(page, "25");
    await page.waitForTimeout(1000);

    // DTI insight should be visible
    const dti = page.locator('[data-insight-type="debt-to-income"]');
    await expect(dti).toBeVisible({ timeout: 5000 });

    // Housing cost insight should be visible
    const housing = page.locator('[data-insight-type="housing-cost"]');
    await expect(housing).toBeVisible({ timeout: 5000 });

    // Percentile insight should be visible (age is set)
    const percentile = page.locator('[data-insight-type="net-worth-percentile"]');
    await expect(percentile).toBeVisible({ timeout: 5000 });
    const percentileText = await percentile.textContent();
    expect(percentileText).toContain("Under 35");

    // Net worth milestone visible (default state has pre-existing assets)
    const milestone = page.locator('[data-insight-type="net-worth-milestone"]');
    await expect(milestone).toBeVisible({ timeout: 5000 });

    await captureScreenshot(page, "task-139-young-adult-insights");
  });
});

// --- Scenario 2: Mid-career homeowner ---

test.describe("Scenario: Mid-career homeowner", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');
  });

  test("all 5 insight types visible for mid-career profile", async ({ page }) => {
    await addIncome(page, "Software Engineering", "11000");
    await addAsset(page, "Investment Portfolio", "450000");
    await addDebt(page, "Mortgage", "280000");
    await setDebtMonthlyPayment(page, "Mortgage", "2200");
    await addExpense(page, "Rent", "2800"); // used as housing cost
    await setAge(page, "42");
    await page.waitForTimeout(1000);

    // All 5 insight types should render
    const dti = page.locator('[data-insight-type="debt-to-income"]');
    await expect(dti).toBeVisible({ timeout: 5000 });
    const dtiText = await dti.textContent();
    expect(dtiText).toMatch(/\d+\.\d+%/);

    const housing = page.locator('[data-insight-type="housing-cost"]');
    await expect(housing).toBeVisible({ timeout: 5000 });
    const housingText = await housing.textContent();
    expect(housingText).toContain("🏠");

    const coastFire = page.locator('[data-insight-type="coast-fire"]');
    await expect(coastFire).toBeVisible({ timeout: 5000 });
    const coastText = await coastFire.textContent();
    expect(coastText).toContain("5% real return");

    // Net worth: 450k - 280k = 170k → $100k milestone
    const milestone = page.locator('[data-insight-type="net-worth-milestone"]');
    await expect(milestone).toBeVisible({ timeout: 5000 });
    const milestoneText = await milestone.textContent();
    expect(milestoneText).toContain("$100k");
    expect(milestoneText).toContain("🏆");

    // Age 42 → 35-44 group, median $135k, net worth $170k → above
    const percentile = page.locator('[data-insight-type="net-worth-percentile"]');
    await expect(percentile).toBeVisible({ timeout: 5000 });
    const percentileText = await percentile.textContent();
    expect(percentileText).toContain("35–44");
    expect(percentileText).toContain("above");

    await captureScreenshot(page, "task-139-mid-career-all-insights");
  });
});

// --- Scenario 3: High earner ---

test.describe("Scenario: High earner", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');
  });

  test("high earner sees $2M milestone and above-median percentile", async ({ page }) => {
    await addIncome(page, "Executive Compensation", "28000");
    await addAsset(page, "Total Portfolio", "2500000");
    await addDebt(page, "Remaining Mortgage", "100000");
    await setDebtMonthlyPayment(page, "Remaining Mortgage", "1500");
    await addExpense(page, "Rent", "3000");
    await setAge(page, "55");
    await page.waitForTimeout(1000);

    // DTI should show excellent range (low ratio)
    const dti = page.locator('[data-insight-type="debt-to-income"]');
    await expect(dti).toBeVisible({ timeout: 5000 });

    // Housing cost insight
    const housing = page.locator('[data-insight-type="housing-cost"]');
    await expect(housing).toBeVisible({ timeout: 5000 });

    // Coast FIRE — $2.5M at 55 with modest expenses → likely achieved
    const coastFire = page.locator('[data-insight-type="coast-fire"]');
    await expect(coastFire).toBeVisible({ timeout: 5000 });

    // Net worth: 2.5M - 100k = 2.4M → $2M milestone
    const milestone = page.locator('[data-insight-type="net-worth-milestone"]');
    await expect(milestone).toBeVisible({ timeout: 5000 });
    const milestoneText = await milestone.textContent();
    expect(milestoneText).toContain("$2M");

    // Age 55 → 55-64 group, median $364k → well above
    const percentile = page.locator('[data-insight-type="net-worth-percentile"]');
    await expect(percentile).toBeVisible({ timeout: 5000 });
    const percentileText = await percentile.textContent();
    expect(percentileText).toContain("55–64");
    expect(percentileText).toContain("above");

    await captureScreenshot(page, "task-139-high-earner-insights");
  });
});

// --- WCAG AA contrast ratio check ---

test.describe("WCAG AA contrast ratio check on insight cards", () => {
  test("insight card text meets 4.5:1 contrast ratio", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    // Add enough data to generate at least one insight
    await addIncome(page, "Salary", "8000");
    await addAsset(page, "Investments", "200000");
    await addDebt(page, "Car Loan", "15000");
    await setDebtMonthlyPayment(page, "Car Loan", "400");
    await setAge(page, "35");
    await page.waitForTimeout(1000);

    // Check contrast on all visible insight cards
    const insightCards = page.locator('[data-testid^="insight-card-"]');
    const count = await insightCards.count();
    expect(count).toBeGreaterThan(0);

    // Sample up to 5 cards for contrast check
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

      // Parse rgb values
      const fgMatch = colors.color.match(/(\d+),\s*(\d+),\s*(\d+)/);
      const bgMatch = colors.backgroundColor.match(/(\d+),\s*(\d+),\s*(\d+)/);

      if (fgMatch && bgMatch) {
        const fgLum = relativeLuminance(+fgMatch[1], +fgMatch[2], +fgMatch[3]);
        const bgLum = relativeLuminance(+bgMatch[1], +bgMatch[2], +bgMatch[3]);
        const ratio = contrastRatio(fgLum, bgLum);

        // WCAG AA: 4.5:1 for normal text
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    }

    await captureScreenshot(page, "task-139-contrast-check");
  });
});

// --- Full regression: all insight types coexist ---

test.describe("Full regression: all new insights coexist", () => {
  test("mid-career scenario has exactly all 5 new insight types", async ({ page }) => {
    await page.goto("/");
    await page.waitForSelector('[data-testid="insights-panel"]');

    await addIncome(page, "Engineering Lead", "11000");
    await addAsset(page, "Portfolio", "400000");
    await addDebt(page, "Home Loan", "250000");
    await setDebtMonthlyPayment(page, "Home Loan", "2000");
    await addExpense(page, "Rent", "2500");
    await setAge(page, "40");
    await page.waitForTimeout(1500);

    // Verify each of the 5 types is present
    const newTypes = [
      "debt-to-income",
      "housing-cost",
      "coast-fire",
      "net-worth-milestone",
      "net-worth-percentile",
    ];
    for (const type of newTypes) {
      const insight = page.locator(`[data-insight-type="${type}"]`);
      await expect(insight).toBeVisible({ timeout: 5000 });
    }

    // Verify no duplicate insight types among the new ones
    const insightsPanel = page.locator('[data-testid="insights-panel"]');
    for (const type of newTypes) {
      const matches = insightsPanel.locator(`[data-insight-type="${type}"]`);
      const matchCount = await matches.count();
      expect(matchCount).toBe(1);
    }

    await captureScreenshot(page, "task-139-all-five-insights");
  });
});
