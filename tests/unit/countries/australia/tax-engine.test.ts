import { describe, it, expect } from "vitest";
import { australianTaxEngine } from "@/lib/countries/australia/tax-engine";
import { computeTax as legacyComputeTax, getMarginalRateForIncome } from "@/lib/tax-engine";
import { getWithdrawalTaxRate as legacyWithdrawalTax } from "@/lib/withdrawal-tax";

describe("australianTaxEngine.computeTax matches legacy", () => {
  for (const income of [0, 10_000, 50_000, 100_000, 200_000, 500_000]) {
    for (const jurisdiction of ["NSW", "VIC", "QLD", "WA"]) {
      for (const year of [2025, 2026]) {
        for (const type of ["employment", "capital-gains", "other"] as const) {
          it(`${income}/${jurisdiction}/${year}/${type}`, () => {
            const expected = legacyComputeTax(income, type, "AU", jurisdiction, year);
            const actual = australianTaxEngine.computeTax(income, type, jurisdiction, year);
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

describe("australianTaxEngine.computeTax breakdown", () => {
  it("populates breakdown with Income Tax (income-tax) and Medicare Levy (social)", () => {
    const result = australianTaxEngine.computeTax(100_000, "employment", "NSW", 2025);
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown).toHaveLength(2);

    const incomeTax = result.breakdown!.find((b) => b.kind === "income-tax");
    expect(incomeTax).toBeDefined();
    expect(incomeTax!.label).toBe("Income Tax");
    expect(incomeTax!.amount).toBeCloseTo(result.federalTax, 2);

    const medicare = result.breakdown!.find((b) => b.kind === "social");
    expect(medicare).toBeDefined();
    expect(medicare!.label).toBe("Medicare Levy");
    expect(medicare!.amount).toBeGreaterThan(0);
  });

  it("Medicare Levy line equals 2% above shade-out", () => {
    // At $100k, well above the shade-out, levy = 2% × $100k = $2,000.
    const result = australianTaxEngine.computeTax(100_000, "employment", "NSW", 2025);
    const medicare = result.breakdown!.find((b) => b.kind === "social");
    expect(medicare!.amount).toBeCloseTo(2_000, 0);
  });

  it("breakdown sums to totalTax exactly", () => {
    for (const income of [25_000, 30_000, 80_000, 150_000, 300_000]) {
      const result = australianTaxEngine.computeTax(income, "employment", "NSW", 2025);
      const sum = result.breakdown!.reduce((acc, line) => acc + line.amount, 0);
      expect(sum).toBeCloseTo(result.totalTax, 6);
    }
  });

  it("populates breakdown for capital gains too (50% CGT discount applied)", () => {
    const result = australianTaxEngine.computeTax(100_000, "capital-gains", "NSW", 2025);
    expect(result.breakdown).toHaveLength(2);
    const incomeTax = result.breakdown!.find((b) => b.kind === "income-tax");
    const medicare = result.breakdown!.find((b) => b.kind === "social");
    expect(incomeTax!.amount).toBeCloseTo(result.federalTax, 2);
    expect(incomeTax!.amount + medicare!.amount).toBeCloseTo(result.totalTax, 2);
  });

  it("Medicare Levy is 0 below the low-income threshold", () => {
    // $20k is below the $26k single threshold → levy = 0.
    const result = australianTaxEngine.computeTax(20_000, "employment", "NSW", 2025);
    const medicare = result.breakdown!.find((b) => b.kind === "social");
    expect(medicare!.amount).toBe(0);
  });

  it("Medicare Levy uses the phase-in rate inside the shade-out zone", () => {
    // $29k: 10% × ($29k − $26k) = $300.
    const result = australianTaxEngine.computeTax(29_000, "employment", "NSW", 2025);
    const medicare = result.breakdown!.find((b) => b.kind === "social");
    expect(medicare!.amount).toBeCloseTo(300, 0);
  });

  it("returns empty breakdown for zero income", () => {
    const result = australianTaxEngine.computeTax(0, "employment", "NSW", 2025);
    expect(result.totalTax).toBe(0);
    expect(result.breakdown).toEqual([]);
  });
});

describe("australianTaxEngine.getMarginalRate matches legacy", () => {
  for (const income of [10_000, 50_000, 100_000, 200_000, 500_000]) {
    for (const jurisdiction of ["NSW", "VIC", "QLD", "WA"]) {
      for (const year of [2025, 2026]) {
        it(`${income}/${jurisdiction}/${year}`, () => {
          const expected = getMarginalRateForIncome(income, "AU", jurisdiction, year);
          const actual = australianTaxEngine.getMarginalRate(income, jurisdiction, year);
          expect(actual).toBeCloseTo(expected, 6);
        });
      }
    }
  }

  it("returns 0 for zero income", () => {
    expect(australianTaxEngine.getMarginalRate(0, "NSW", 2025)).toBe(0);
  });
});

describe("australianTaxEngine.classifyTaxTreatment", () => {
  it("classifies Super (Pension Phase) as tax-free", () => {
    expect(australianTaxEngine.classifyTaxTreatment("Super (Pension Phase)")).toBe("tax-free");
  });

  it("classifies Super (Accumulation) as super-accumulation", () => {
    expect(australianTaxEngine.classifyTaxTreatment("Super (Accumulation)")).toBe("super-accumulation");
  });

  it("classifies First Home Super Saver as super-fhss", () => {
    expect(australianTaxEngine.classifyTaxTreatment("First Home Super Saver")).toBe("super-fhss");
  });

  it("classifies bare 'fhss' as super-fhss", () => {
    expect(australianTaxEngine.classifyTaxTreatment("fhss")).toBe("super-fhss");
  });

  it("classifies Brokerage as taxable", () => {
    expect(australianTaxEngine.classifyTaxTreatment("Brokerage")).toBe("taxable");
  });

  it("classifies Savings Account as taxable", () => {
    expect(australianTaxEngine.classifyTaxTreatment("Savings Account")).toBe("taxable");
  });

  it("does not let the generic 'pension' fallback shadow super pension", () => {
    // Super pension phase must beat any generic pension keyword.
    expect(australianTaxEngine.classifyTaxTreatment("Super (Pension Phase)")).not.toBe("tax-deferred");
  });

  it("matches case-insensitively", () => {
    expect(australianTaxEngine.classifyTaxTreatment("SUPER (ACCUMULATION)")).toBe("super-accumulation");
    expect(australianTaxEngine.classifyTaxTreatment("super (pension phase)")).toBe("tax-free");
  });
});

describe("australianTaxEngine.getWithdrawalTaxRate matches legacy", () => {
  for (const cat of [
    "Super (Pension Phase)",
    "Super (Accumulation)",
    "First Home Super Saver",
    "Brokerage",
    "Savings Account",
  ]) {
    for (const amount of [10_000, 50_000, 100_000]) {
      it(`${cat} ${amount}`, () => {
        const expected = legacyWithdrawalTax(cat, "AU", "NSW", amount, 100, undefined, 2025);
        const actual = australianTaxEngine.getWithdrawalTaxRate({
          category: cat,
          jurisdiction: "NSW",
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

  it("Super (Accumulation) is taxed at a flat 15% effective rate", () => {
    const result = australianTaxEngine.getWithdrawalTaxRate({
      category: "Super (Accumulation)",
      jurisdiction: "NSW",
      annualWithdrawal: 100_000,
      year: 2025,
    });
    expect(result.effectiveRate).toBe(0.15);
    expect(result.taxFreeAmount).toBe(85_000);
    expect(result.taxableAmount).toBe(100_000);
  });

  it("FHSS at low income (marginal effective < 30%) zeroes out via offset", () => {
    const result = australianTaxEngine.getWithdrawalTaxRate({
      category: "First Home Super Saver",
      jurisdiction: "NSW",
      annualWithdrawal: 15_000,
      year: 2025,
    });
    expect(result.effectiveRate).toBe(0);
    expect(result.taxFreeAmount).toBe(15_000);
  });

  it("Super (Pension Phase) withdrawal is fully tax-free", () => {
    const result = australianTaxEngine.getWithdrawalTaxRate({
      category: "Super (Pension Phase)",
      jurisdiction: "NSW",
      annualWithdrawal: 50_000,
      year: 2025,
    });
    expect(result.effectiveRate).toBe(0);
    expect(result.taxFreeAmount).toBe(50_000);
    expect(result.taxableAmount).toBe(0);
  });

  it("brokerage with 50% cost basis taxes only the gains", () => {
    const expected = legacyWithdrawalTax("Brokerage", "AU", "NSW", 50_000, 50, "capital-gains", 2025);
    const actual = australianTaxEngine.getWithdrawalTaxRate({
      category: "Brokerage",
      jurisdiction: "NSW",
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
    const result = australianTaxEngine.getWithdrawalTaxRate({
      category: "Super (Accumulation)",
      jurisdiction: "NSW",
      annualWithdrawal: 0,
    });
    expect(result.effectiveRate).toBe(0);
    expect(result.taxFreeAmount).toBe(0);
    expect(result.taxableAmount).toBe(0);
  });
});

describe("australianTaxEngine.getEarlyWithdrawalPenalties", () => {
  it("flags Super (Accumulation) under age 60", () => {
    const penalties = australianTaxEngine.getEarlyWithdrawalPenalties(["Super (Accumulation)"], 40);
    expect(penalties).toHaveLength(1);
    expect(penalties[0].category).toBe("Super (Accumulation)");
    expect(penalties[0].penaltyFreeAge).toBe(60);
    expect(penalties[0].penaltyPercent).toBe(0);
    expect(penalties[0].rule).toMatch(/preservation age 60/i);
  });

  it("does NOT flag First Home Super Saver (carve-out applies)", () => {
    const penalties = australianTaxEngine.getEarlyWithdrawalPenalties(["First Home Super Saver"], 30);
    expect(penalties).toEqual([]);
  });

  it("does NOT flag Super (Pension Phase) — name still matches super, but the user is at/over 60", () => {
    const penalties = australianTaxEngine.getEarlyWithdrawalPenalties(["Super (Pension Phase)"], 65);
    expect(penalties).toEqual([]);
  });

  it("does not flag Super (Accumulation) at age 60", () => {
    const penalties = australianTaxEngine.getEarlyWithdrawalPenalties(["Super (Accumulation)"], 60);
    expect(penalties).toEqual([]);
  });

  it("does not flag non-super accounts", () => {
    const penalties = australianTaxEngine.getEarlyWithdrawalPenalties(["Brokerage", "Savings"], 30);
    expect(penalties).toEqual([]);
  });

  it("returns empty array for missing or zero age", () => {
    expect(australianTaxEngine.getEarlyWithdrawalPenalties(["Super (Accumulation)"], 0)).toEqual([]);
  });

  it("matches the legacy AU branch result", () => {
    const cats = ["Super (Accumulation)", "First Home Super Saver", "Brokerage"];
    const expected = ["Super (Accumulation)"];
    const actual = australianTaxEngine.getEarlyWithdrawalPenalties(cats, 40);
    expect(actual.map((p) => p.category)).toEqual(expected);
  });
});
