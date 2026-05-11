import { describe, it, expect } from "vitest";
import { americanTaxEngine } from "@/lib/countries/usa/tax-engine";
import { computeTax as legacyComputeTax, getMarginalRateForIncome } from "@/lib/tax-engine";
import { getWithdrawalTaxRate as legacyWithdrawalTax } from "@/lib/withdrawal-tax";

describe("americanTaxEngine.computeTax matches legacy", () => {
  for (const income of [0, 10_000, 50_000, 100_000, 200_000, 500_000]) {
    for (const state of ["CA", "TX", "NY", "FL"]) {
      for (const year of [2025, 2026]) {
        for (const type of ["employment", "capital-gains", "other"] as const) {
          it(`${income}/${state}/${year}/${type}`, () => {
            const expected = legacyComputeTax(income, type, "US", state, year);
            const actual = americanTaxEngine.computeTax(income, type, state, year);
            expect(actual.totalTax).toBeCloseTo(expected.totalTax, 2);
            expect(actual.federalTax).toBeCloseTo(expected.federalTax, 2);
            expect(actual.provincialStateTax).toBeCloseTo(expected.provincialStateTax, 2);
            expect(actual.afterTaxIncome).toBeCloseTo(expected.afterTaxIncome, 2);
            expect(actual.effectiveRate).toBeCloseTo(expected.effectiveRate, 6);
            expect(actual.marginalRate).toBeCloseTo(expected.marginalRate, 6);
          });
        }
      }
    }
  }
});

describe("americanTaxEngine.computeTax breakdown", () => {
  it("populates breakdown with Federal Tax (income-tax) and State Tax (sub-federal)", () => {
    const result = americanTaxEngine.computeTax(100_000, "employment", "CA", 2025);
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown).toHaveLength(2);

    const federal = result.breakdown!.find((b) => b.kind === "income-tax");
    expect(federal).toBeDefined();
    expect(federal!.label).toBe("Federal Tax");
    expect(federal!.amount).toBeCloseTo(result.federalTax, 2);

    const state = result.breakdown!.find((b) => b.kind === "sub-federal");
    expect(state).toBeDefined();
    expect(state!.label).toBe("State Tax");
    expect(state!.amount).toBeCloseTo(result.provincialStateTax, 2);
  });

  it("breakdown sums to totalTax", () => {
    const result = americanTaxEngine.computeTax(150_000, "employment", "NY", 2025);
    const sum = result.breakdown!.reduce((acc, line) => acc + line.amount, 0);
    expect(sum).toBeCloseTo(result.totalTax, 2);
  });

  it("breakdown still includes a $0 State Tax line for no-income-tax states", () => {
    const result = americanTaxEngine.computeTax(100_000, "employment", "TX", 2025);
    expect(result.breakdown).toHaveLength(2);
    const state = result.breakdown!.find((b) => b.kind === "sub-federal");
    expect(state).toBeDefined();
    expect(state!.amount).toBe(0);
  });

  it("populates breakdown for capital gains too", () => {
    const result = americanTaxEngine.computeTax(100_000, "capital-gains", "CA", 2025);
    expect(result.breakdown).toHaveLength(2);
    const federal = result.breakdown!.find((b) => b.kind === "income-tax");
    const state = result.breakdown!.find((b) => b.kind === "sub-federal");
    expect(federal!.amount).toBeCloseTo(result.federalTax, 2);
    expect(state!.amount).toBeCloseTo(result.provincialStateTax, 2);
  });

  it("returns empty breakdown for zero income", () => {
    const result = americanTaxEngine.computeTax(0, "employment", "CA", 2025);
    expect(result.totalTax).toBe(0);
    expect(result.breakdown).toEqual([]);
  });
});

describe("americanTaxEngine.getMarginalRate matches legacy", () => {
  for (const income of [10_000, 50_000, 100_000, 200_000, 500_000]) {
    for (const state of ["CA", "TX", "NY", "FL"]) {
      for (const year of [2025, 2026]) {
        it(`${income}/${state}/${year}`, () => {
          const expected = getMarginalRateForIncome(income, "US", state, year);
          const actual = americanTaxEngine.getMarginalRate(income, state, year);
          expect(actual).toBeCloseTo(expected, 6);
        });
      }
    }
  }

  it("returns 0 for zero income", () => {
    expect(americanTaxEngine.getMarginalRate(0, "CA", 2025)).toBe(0);
  });
});

describe("americanTaxEngine.classifyTaxTreatment", () => {
  it("classifies Roth IRA as tax-free", () => {
    expect(americanTaxEngine.classifyTaxTreatment("Roth IRA")).toBe("tax-free");
  });

  it("classifies HSA as tax-free", () => {
    expect(americanTaxEngine.classifyTaxTreatment("HSA")).toBe("tax-free");
  });

  it("classifies Roth 401k as tax-free (roth takes priority over 401k)", () => {
    expect(americanTaxEngine.classifyTaxTreatment("Roth 401k")).toBe("tax-free");
  });

  it("classifies 401k as tax-deferred", () => {
    expect(americanTaxEngine.classifyTaxTreatment("401k")).toBe("tax-deferred");
  });

  it("classifies Traditional IRA as tax-deferred", () => {
    expect(americanTaxEngine.classifyTaxTreatment("Traditional IRA")).toBe("tax-deferred");
  });

  it("classifies 529 as tax-deferred", () => {
    expect(americanTaxEngine.classifyTaxTreatment("529")).toBe("tax-deferred");
  });

  it("classifies Brokerage as taxable", () => {
    expect(americanTaxEngine.classifyTaxTreatment("Brokerage")).toBe("taxable");
  });

  it("classifies Savings Account as taxable", () => {
    expect(americanTaxEngine.classifyTaxTreatment("Savings Account")).toBe("taxable");
  });

  it("matches case-insensitively", () => {
    expect(americanTaxEngine.classifyTaxTreatment("roth ira")).toBe("tax-free");
    expect(americanTaxEngine.classifyTaxTreatment("401K")).toBe("tax-deferred");
  });
});

describe("americanTaxEngine.getWithdrawalTaxRate matches legacy", () => {
  for (const cat of ["Roth IRA", "HSA", "401k", "Traditional IRA", "529", "Savings Account", "Brokerage"]) {
    for (const amount of [10_000, 50_000, 100_000]) {
      it(`${cat} ${amount}`, () => {
        const expected = legacyWithdrawalTax(cat, "US", "CA", amount, 100, undefined, 2025);
        const actual = americanTaxEngine.getWithdrawalTaxRate({
          category: cat,
          jurisdiction: "CA",
          annualWithdrawal: amount,
          costBasisPercent: 100,
          year: 2025,
        });
        expect(actual.effectiveRate).toBeCloseTo(expected.effectiveRate, 4);
        expect(actual.taxableAmount).toBeCloseTo(expected.taxableAmount, 2);
        expect(actual.taxFreeAmount).toBeCloseTo(expected.taxFreeAmount, 2);
      });
    }
  }

  it("brokerage with 50% cost basis taxes only the gains", () => {
    const expected = legacyWithdrawalTax("Brokerage", "US", "CA", 50_000, 50, "capital-gains", 2025);
    const actual = americanTaxEngine.getWithdrawalTaxRate({
      category: "Brokerage",
      jurisdiction: "CA",
      annualWithdrawal: 50_000,
      costBasisPercent: 50,
      roiTaxTreatment: "capital-gains",
      year: 2025,
    });
    expect(actual.taxFreeAmount).toBeCloseTo(expected.taxFreeAmount, 2);
    expect(actual.taxableAmount).toBeCloseTo(expected.taxableAmount, 2);
    expect(actual.effectiveRate).toBeCloseTo(expected.effectiveRate, 4);
  });

  it("returns zero result for zero withdrawal", () => {
    const result = americanTaxEngine.getWithdrawalTaxRate({
      category: "401k",
      jurisdiction: "CA",
      annualWithdrawal: 0,
    });
    expect(result.effectiveRate).toBe(0);
    expect(result.taxFreeAmount).toBe(0);
    expect(result.taxableAmount).toBe(0);
  });
});

describe("americanTaxEngine.getEarlyWithdrawalPenalties", () => {
  it("flags 401k under age 59.5 with 10% penalty", () => {
    const penalties = americanTaxEngine.getEarlyWithdrawalPenalties(["401k"], 40);
    expect(penalties).toHaveLength(1);
    expect(penalties[0].category).toBe("401k");
    expect(penalties[0].penaltyFreeAge).toBe(59.5);
    expect(penalties[0].penaltyPercent).toBe(10);
    expect(penalties[0].rule).toMatch(/59½/);
  });

  it("flags Traditional IRA under 59.5", () => {
    const penalties = americanTaxEngine.getEarlyWithdrawalPenalties(["Traditional IRA"], 50);
    expect(penalties).toHaveLength(1);
    expect(penalties[0].category).toBe("Traditional IRA");
    expect(penalties[0].penaltyPercent).toBe(10);
  });

  it("flags 403b under 59.5", () => {
    const penalties = americanTaxEngine.getEarlyWithdrawalPenalties(["403b"], 40);
    expect(penalties).toHaveLength(1);
    expect(penalties[0].penaltyPercent).toBe(10);
  });

  it("flags 457 under 59.5", () => {
    const penalties = americanTaxEngine.getEarlyWithdrawalPenalties(["457"], 40);
    expect(penalties).toHaveLength(1);
    expect(penalties[0].penaltyPercent).toBe(10);
  });

  it("does NOT flag a plain 401k as a Roth (roth excluded from 401k-penalty arm)", () => {
    const penalties = americanTaxEngine.getEarlyWithdrawalPenalties(["Roth 401k"], 40);
    // Roth 401k is excluded from the 401k/IRA "10% on contributions" rule.
    // It also doesn't match the "Roth IRA earnings" rule (no "ira" substring).
    expect(penalties).toEqual([]);
  });

  it("flags Roth IRA earnings penalty under 59.5", () => {
    const penalties = americanTaxEngine.getEarlyWithdrawalPenalties(["Roth IRA"], 40);
    expect(penalties).toHaveLength(1);
    expect(penalties[0].category).toBe("Roth IRA");
    expect(penalties[0].penaltyPercent).toBe(10);
    expect(penalties[0].rule).toMatch(/earnings/i);
  });

  it("does not flag 401k at age 60", () => {
    const penalties = americanTaxEngine.getEarlyWithdrawalPenalties(["401k"], 60);
    expect(penalties).toEqual([]);
  });

  it("does not flag at age 59.5 exactly", () => {
    const penalties = americanTaxEngine.getEarlyWithdrawalPenalties(["401k"], 59.5);
    expect(penalties).toEqual([]);
  });

  it("does not flag HSA at any age", () => {
    const penalties = americanTaxEngine.getEarlyWithdrawalPenalties(["HSA"], 30);
    expect(penalties).toEqual([]);
  });

  it("returns empty array for missing or zero age", () => {
    expect(americanTaxEngine.getEarlyWithdrawalPenalties(["401k"], 0)).toEqual([]);
  });

  it("matches the legacy US branch result", () => {
    const cats = ["401k", "Traditional IRA", "Roth IRA", "HSA"];
    const expected = ["401k", "Traditional IRA", "Roth IRA"];
    const actual = americanTaxEngine.getEarlyWithdrawalPenalties(cats, 40);
    expect(actual.map((p) => p.category)).toEqual(expected);
  });
});
