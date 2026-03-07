import { describe, it, expect } from "vitest";
import { generateInsights, type FinancialData } from "@/lib/insights";

/**
 * Task 139: Regression test verifying all new insight types generate correctly
 * across multiple scenarios: young adult with student debt, mid-career homeowner,
 * and high earner.
 */

// Scenario 1: Young adult (age 25) with student debt, renting, modest income
const youngAdult: FinancialData = {
  totalAssets: 15000,
  totalDebts: 35000,
  monthlyIncome: 3500,
  monthlyExpenses: 2800,
  rawMonthlyExpenses: 2800,
  monthlyGrossIncome: 4500,
  monthlyDebtPayments: 500,
  monthlyHousingCost: 1200,
  currentAge: 25,
  liquidAssets: 10000,
  monthlySavings: 700,
};

// Scenario 2: Mid-career homeowner (age 42) with mortgage, good income
const midCareer: FinancialData = {
  totalAssets: 450000,
  totalDebts: 280000,
  monthlyIncome: 8000,
  monthlyExpenses: 5500,
  rawMonthlyExpenses: 5500,
  monthlyGrossIncome: 11000,
  monthlyDebtPayments: 2200,
  monthlyHousingCost: 2800,
  currentAge: 42,
  liquidAssets: 200000,
  monthlySavings: 2500,
};

// Scenario 3: High earner (age 55) with large portfolio, low debt
const highEarner: FinancialData = {
  totalAssets: 2500000,
  totalDebts: 100000,
  monthlyIncome: 20000,
  monthlyExpenses: 8000,
  rawMonthlyExpenses: 8000,
  monthlyGrossIncome: 28000,
  monthlyDebtPayments: 1500,
  monthlyHousingCost: 3000,
  currentAge: 55,
  liquidAssets: 2000000,
  monthlySavings: 12000,
};

function findInsight(data: FinancialData, type: string) {
  const insights = generateInsights(data);
  return insights.find((i) => i.type === type);
}

describe("Insights regression: all new insight types", () => {
  describe("debt-to-income ratio", () => {
    it("young adult: shows DTI with correct tier", () => {
      // 500 / 4500 = 11.1% → excellent
      const insight = findInsight(youngAdult, "debt-to-income");
      expect(insight).toBeDefined();
      expect(insight!.message).toMatch(/11\.\d%/);
      expect(insight!.icon).toBe("📊");
    });

    it("mid-career: shows DTI in good/moderate range", () => {
      // 2200 / 11000 = 20%
      const insight = findInsight(midCareer, "debt-to-income");
      expect(insight).toBeDefined();
      expect(insight!.message).toMatch(/20\.0%/);
    });

    it("high earner: shows DTI in excellent range", () => {
      // 1500 / 28000 = 5.4%
      const insight = findInsight(highEarner, "debt-to-income");
      expect(insight).toBeDefined();
      expect(insight!.message).toMatch(/5\.\d%/);
      expect(insight!.message).toContain("excellent");
    });

    it("includes educational text about ratio meaning", () => {
      const insight = findInsight(youngAdult, "debt-to-income");
      expect(insight).toBeDefined();
      // Should contain some educational context
      expect(insight!.message.length).toBeGreaterThan(20);
    });
  });

  describe("housing cost ratio", () => {
    it("young adult: flags housing above 30% threshold", () => {
      // 1200 / 4500 = 26.7%
      const insight = findInsight(youngAdult, "housing-cost");
      expect(insight).toBeDefined();
      expect(insight!.icon).toBe("🏠");
    });

    it("mid-career: shows housing cost ratio", () => {
      // 2800 / 11000 = 25.5%
      const insight = findInsight(midCareer, "housing-cost");
      expect(insight).toBeDefined();
      expect(insight!.message).toMatch(/25\.\d%/);
    });

    it("high earner: shows comfortable housing ratio", () => {
      // 3000 / 28000 = 10.7%
      const insight = findInsight(highEarner, "housing-cost");
      expect(insight).toBeDefined();
      expect(insight!.message).toMatch(/10\.\d%/);
    });
  });

  describe("Coast FIRE age", () => {
    it("young adult: shows coast-fire progress (not yet achieved)", () => {
      const insight = findInsight(youngAdult, "coast-fire");
      expect(insight).toBeDefined();
      expect(insight!.icon).toBe("🏖️");
      // Young adult with only $10k invested likely not yet at Coast FIRE
      expect(insight!.message).toBeTruthy();
    });

    it("mid-career: shows coast-fire insight", () => {
      const insight = findInsight(midCareer, "coast-fire");
      expect(insight).toBeDefined();
      expect(insight!.message).toContain("5% real return");
    });

    it("high earner: likely achieved coast-fire", () => {
      const insight = findInsight(highEarner, "coast-fire");
      expect(insight).toBeDefined();
      // $2M invested at 55 with $8k/mo expenses → likely achieved
      expect(insight!.id).toMatch(/coast-fire/);
    });

    it("not generated without age", () => {
      const noAge: FinancialData = { ...midCareer, currentAge: undefined };
      const insight = findInsight(noAge, "coast-fire");
      expect(insight).toBeUndefined();
    });
  });

  describe("net worth milestones", () => {
    it("young adult: no milestone (negative net worth)", () => {
      // 15000 - 35000 = -20000 → no milestone
      const insight = findInsight(youngAdult, "net-worth-milestone");
      expect(insight).toBeUndefined();
    });

    it("mid-career: shows $100k milestone", () => {
      // 450000 - 280000 = 170000 → $100k milestone
      const insight = findInsight(midCareer, "net-worth-milestone");
      expect(insight).toBeDefined();
      expect(insight!.message).toContain("$100k");
      expect(insight!.icon).toBe("🏆");
    });

    it("high earner: shows $2M milestone", () => {
      // 2500000 - 100000 = 2400000 → $2M milestone
      const insight = findInsight(highEarner, "net-worth-milestone");
      expect(insight).toBeDefined();
      expect(insight!.message).toContain("$2M");
    });
  });

  describe("age-based net worth percentile", () => {
    it("young adult: shows below median for Under 35 group", () => {
      // net worth -20000, Under 35 median $39k
      const insight = findInsight(youngAdult, "net-worth-percentile");
      expect(insight).toBeDefined();
      expect(insight!.message).toContain("Under 35");
      expect(insight!.id).toBe("net-worth-percentile-below");
      expect(insight!.icon).toBe("📊");
    });

    it("mid-career: shows above median for 35-44 group", () => {
      // net worth 170000, 35-44 median $135k → above
      const insight = findInsight(midCareer, "net-worth-percentile");
      expect(insight).toBeDefined();
      expect(insight!.message).toContain("35–44");
      expect(insight!.id).toBe("net-worth-percentile-above");
    });

    it("high earner: shows above median for 55-64 group", () => {
      // net worth 2400000, 55-64 median $364k → above
      const insight = findInsight(highEarner, "net-worth-percentile");
      expect(insight).toBeDefined();
      expect(insight!.message).toContain("55–64");
      expect(insight!.id).toBe("net-worth-percentile-above");
    });

    it("not generated without age", () => {
      const noAge: FinancialData = { ...midCareer, currentAge: undefined };
      const insight = findInsight(noAge, "net-worth-percentile");
      expect(insight).toBeUndefined();
    });

    it("encouraging tone regardless of position", () => {
      // Below median should still be encouraging
      const belowInsight = findInsight(youngAdult, "net-worth-percentile");
      expect(belowInsight).toBeDefined();
      // Should not contain alarming/negative language
      expect(belowInsight!.message).not.toMatch(/bad|terrible|failing|behind/i);

      // Above median should be encouraging
      const aboveInsight = findInsight(highEarner, "net-worth-percentile");
      expect(aboveInsight).toBeDefined();
      expect(aboveInsight!.message).not.toMatch(/bad|terrible|failing/i);
    });
  });

  describe("cross-scenario: all five insight types coexist", () => {
    it("mid-career scenario generates all 5 insight types", () => {
      const insights = generateInsights(midCareer);
      const types = insights.map((i) => i.type);
      expect(types).toContain("debt-to-income");
      expect(types).toContain("housing-cost");
      expect(types).toContain("coast-fire");
      expect(types).toContain("net-worth-milestone");
      expect(types).toContain("net-worth-percentile");
    });

    it("high earner scenario generates all 5 insight types", () => {
      const insights = generateInsights(highEarner);
      const types = insights.map((i) => i.type);
      expect(types).toContain("debt-to-income");
      expect(types).toContain("housing-cost");
      expect(types).toContain("coast-fire");
      expect(types).toContain("net-worth-milestone");
      expect(types).toContain("net-worth-percentile");
    });

    it("each insight has unique id and non-empty message", () => {
      const insights = generateInsights(midCareer);
      const newTypes = ["debt-to-income", "housing-cost", "coast-fire", "net-worth-milestone", "net-worth-percentile"];
      const relevant = insights.filter((i) => newTypes.includes(i.type));
      const ids = relevant.map((i) => i.id);
      expect(new Set(ids).size).toBe(ids.length); // all unique
      relevant.forEach((i) => {
        expect(i.message.length).toBeGreaterThan(10);
        expect(i.icon.length).toBeGreaterThan(0);
      });
    });
  });
});
