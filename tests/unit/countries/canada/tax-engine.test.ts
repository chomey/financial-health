import { describe, it, expect } from "vitest";
import { canadianTaxEngine } from "@/lib/countries/canada/tax-engine";
import { computeTax as legacyComputeTax, getMarginalRateForIncome } from "@/lib/tax-engine";
import { getWithdrawalTaxRate as legacyWithdrawalTax } from "@/lib/withdrawal-tax";

describe("canadianTaxEngine.computeTax matches legacy", () => {
  for (const income of [0, 10_000, 50_000, 100_000, 200_000, 500_000]) {
    for (const province of ["ON", "AB", "BC", "QC"]) {
      for (const year of [2025, 2026]) {
        for (const type of ["employment", "capital-gains", "other"] as const) {
          it(`${income}/${province}/${year}/${type}`, () => {
            const expected = legacyComputeTax(income, type, "CA", province, year);
            const actual = canadianTaxEngine.computeTax(income, type, province, year);
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

describe("canadianTaxEngine.computeTax breakdown", () => {
  it("populates breakdown with Federal Tax (income-tax) and Provincial Tax (sub-federal)", () => {
    const result = canadianTaxEngine.computeTax(100_000, "employment", "ON", 2025);
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown).toHaveLength(2);

    const federal = result.breakdown!.find((b) => b.kind === "income-tax");
    expect(federal).toBeDefined();
    expect(federal!.label).toBe("Federal Tax");
    expect(federal!.amount).toBeCloseTo(result.federalTax, 2);

    const provincial = result.breakdown!.find((b) => b.kind === "sub-federal");
    expect(provincial).toBeDefined();
    expect(provincial!.label).toBe("Provincial Tax");
    expect(provincial!.amount).toBeCloseTo(result.provincialStateTax, 2);
  });

  it("breakdown sums to totalTax", () => {
    const result = canadianTaxEngine.computeTax(150_000, "employment", "BC", 2025);
    const sum = result.breakdown!.reduce((acc, line) => acc + line.amount, 0);
    expect(sum).toBeCloseTo(result.totalTax, 2);
  });

  it("returns empty breakdown for zero income", () => {
    const result = canadianTaxEngine.computeTax(0, "employment", "ON", 2025);
    expect(result.totalTax).toBe(0);
    expect(result.breakdown).toEqual([]);
  });
});

describe("canadianTaxEngine.getMarginalRate matches legacy", () => {
  for (const income of [10_000, 50_000, 100_000, 200_000, 500_000]) {
    for (const province of ["ON", "AB", "BC", "QC"]) {
      for (const year of [2025, 2026]) {
        it(`${income}/${province}/${year}`, () => {
          const expected = getMarginalRateForIncome(income, "CA", province, year);
          const actual = canadianTaxEngine.getMarginalRate(income, province, year);
          expect(actual).toBeCloseTo(expected, 6);
        });
      }
    }
  }

  it("returns 0 for zero income", () => {
    expect(canadianTaxEngine.getMarginalRate(0, "ON", 2025)).toBe(0);
  });
});

describe("canadianTaxEngine.classifyTaxTreatment", () => {
  it("classifies TFSA as tax-free", () => {
    expect(canadianTaxEngine.classifyTaxTreatment("TFSA")).toBe("tax-free");
  });

  it("classifies FHSA as tax-free", () => {
    expect(canadianTaxEngine.classifyTaxTreatment("FHSA")).toBe("tax-free");
  });

  it("classifies RRSP as tax-deferred", () => {
    expect(canadianTaxEngine.classifyTaxTreatment("RRSP")).toBe("tax-deferred");
  });

  it("classifies RESP as tax-deferred", () => {
    expect(canadianTaxEngine.classifyTaxTreatment("RESP")).toBe("tax-deferred");
  });

  it("classifies LIRA as tax-deferred", () => {
    expect(canadianTaxEngine.classifyTaxTreatment("LIRA")).toBe("tax-deferred");
  });

  it("classifies Brokerage as taxable", () => {
    expect(canadianTaxEngine.classifyTaxTreatment("Brokerage")).toBe("taxable");
  });

  it("classifies Savings Account as taxable", () => {
    expect(canadianTaxEngine.classifyTaxTreatment("Savings Account")).toBe("taxable");
  });

  it("matches case-insensitively", () => {
    expect(canadianTaxEngine.classifyTaxTreatment("tfsa")).toBe("tax-free");
    expect(canadianTaxEngine.classifyTaxTreatment("rrsp")).toBe("tax-deferred");
  });
});

describe("canadianTaxEngine.getWithdrawalTaxRate matches legacy", () => {
  for (const cat of ["TFSA", "FHSA", "RRSP", "RESP", "LIRA", "Savings Account", "Brokerage"]) {
    for (const amount of [10_000, 50_000, 100_000]) {
      it(`${cat} ${amount}`, () => {
        const expected = legacyWithdrawalTax(cat, "CA", "ON", amount, 100, undefined, 2025);
        const actual = canadianTaxEngine.getWithdrawalTaxRate({
          category: cat,
          jurisdiction: "ON",
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
    const expected = legacyWithdrawalTax("Brokerage", "CA", "ON", 50_000, 50, "capital-gains", 2025);
    const actual = canadianTaxEngine.getWithdrawalTaxRate({
      category: "Brokerage",
      jurisdiction: "ON",
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
    const result = canadianTaxEngine.getWithdrawalTaxRate({
      category: "RRSP",
      jurisdiction: "ON",
      annualWithdrawal: 0,
    });
    expect(result.effectiveRate).toBe(0);
    expect(result.taxFreeAmount).toBe(0);
    expect(result.taxableAmount).toBe(0);
  });
});

describe("canadianTaxEngine.getEarlyWithdrawalPenalties", () => {
  it("flags RRSP under age 65", () => {
    const penalties = canadianTaxEngine.getEarlyWithdrawalPenalties(["RRSP"], 40);
    expect(penalties).toHaveLength(1);
    expect(penalties[0].category).toBe("RRSP");
    expect(penalties[0].penaltyFreeAge).toBe(65);
    expect(penalties[0].penaltyPercent).toBe(0);
    expect(penalties[0].rule).toMatch(/withholding/i);
  });

  it("flags LIRA under age 65", () => {
    const penalties = canadianTaxEngine.getEarlyWithdrawalPenalties(["LIRA"], 50);
    expect(penalties).toHaveLength(1);
    expect(penalties[0].category).toBe("LIRA");
  });

  it("does not flag RRSP at age 65", () => {
    const penalties = canadianTaxEngine.getEarlyWithdrawalPenalties(["RRSP"], 65);
    expect(penalties).toEqual([]);
  });

  it("does not flag TFSA at any age", () => {
    const penalties = canadianTaxEngine.getEarlyWithdrawalPenalties(["TFSA"], 30);
    expect(penalties).toEqual([]);
  });

  it("returns empty array for missing or zero age", () => {
    expect(canadianTaxEngine.getEarlyWithdrawalPenalties(["RRSP"], 0)).toEqual([]);
  });

  it("matches the legacy CA branch result", () => {
    // Legacy lives in src/lib/withdrawal-tax.ts. Compare directly.
    const cats = ["RRSP", "LIRA", "TFSA"];
    const expected = ["RRSP", "LIRA"];
    const actual = canadianTaxEngine.getEarlyWithdrawalPenalties(cats, 40);
    expect(actual.map((p) => p.category)).toEqual(expected);
  });
});
