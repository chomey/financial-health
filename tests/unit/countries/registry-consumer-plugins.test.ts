import { describe, it, expect } from "vitest";
import { getCountry, getRegisteredCountries } from "@/lib/countries";
import { INITIAL_STATE } from "@/lib/financial-types";

describe("Country registry consumer plugins (task 230)", () => {
  describe("taxEngine.computeBracketSegments", () => {
    for (const profile of getRegisteredCountries()) {
      describe(profile.code, () => {
        it("zero-income call returns reference brackets (all amounts zero)", () => {
          const result = profile.taxEngine.computeBracketSegments({
            jurisdiction: profile.defaultJurisdiction,
            year: 2025,
            grossAnnualIncome: 0,
            capGainsTotal: 0,
          });
          expect(result.federalBrackets.length).toBeGreaterThan(0);
          expect(result.regionalBrackets.length).toBeGreaterThanOrEqual(0);
          for (const seg of [...result.federalBrackets, ...result.regionalBrackets]) {
            expect(seg.amountInBracket).toBe(0);
            expect(seg.taxInBracket).toBe(0);
            expect(typeof seg.min).toBe("number");
            expect(typeof seg.max).toBe("number");
            expect(typeof seg.rate).toBe("number");
          }
          expect(typeof result.federalBPA).toBe("number");
          expect(typeof result.regionalBPA).toBe("number");
        });

        it("non-zero income populates at least one federal bracket amount", () => {
          const result = profile.taxEngine.computeBracketSegments({
            jurisdiction: profile.defaultJurisdiction,
            year: 2025,
            grossAnnualIncome: 80_000,
            capGainsTotal: 0,
          });
          const totalAmount = result.federalBrackets.reduce((s, b) => s + b.amountInBracket, 0);
          expect(totalAmount).toBeGreaterThan(0);
        });
      });
    }

    it("CA capital-gains inclusion halves taxable income", () => {
      const all100kCap = getCountry("CA").taxEngine.computeBracketSegments({
        jurisdiction: "ON",
        year: 2025,
        grossAnnualIncome: 100_000,
        capGainsTotal: 100_000,
      });
      const allEmployment = getCountry("CA").taxEngine.computeBracketSegments({
        jurisdiction: "ON",
        year: 2025,
        grossAnnualIncome: 100_000,
        capGainsTotal: 0,
      });
      const capSum = all100kCap.federalBrackets.reduce((s, b) => s + b.amountInBracket, 0);
      const empSum = allEmployment.federalBrackets.reduce((s, b) => s + b.amountInBracket, 0);
      // 50% inclusion → capital gains slot has roughly half the brackets used.
      expect(capSum).toBeLessThan(empSum);
    });

    it("AU regional brackets always render with zero amounts (no state income tax)", () => {
      const result = getCountry("AU").taxEngine.computeBracketSegments({
        jurisdiction: "NSW",
        year: 2025,
        grossAnnualIncome: 120_000,
        capGainsTotal: 0,
      });
      for (const seg of result.regionalBrackets) {
        expect(seg.amountInBracket).toBe(0);
        expect(seg.taxInBracket).toBe(0);
      }
    });

    it("US capital-gains-only income uses capital gains brackets", () => {
      const onlyCap = getCountry("US").taxEngine.computeBracketSegments({
        jurisdiction: "CA",
        year: 2025,
        grossAnnualIncome: 100_000,
        capGainsTotal: 100_000,
      });
      const onlyEmp = getCountry("US").taxEngine.computeBracketSegments({
        jurisdiction: "CA",
        year: 2025,
        grossAnnualIncome: 100_000,
        capGainsTotal: 0,
      });
      // Cap gains bracket structure differs from federal — at minimum the
      // top-bracket rates won't match. 37% federal vs 20% cap gains, etc.
      const capRates = onlyCap.federalBrackets.map((b) => b.rate).sort();
      const empRates = onlyEmp.federalBrackets.map((b) => b.rate).sort();
      expect(capRates).not.toEqual(empRates);
    });
  });

  describe("rmd plugin", () => {
    it("CA returns RRIF minimum label and computes for RRSP", () => {
      const rule = getCountry("CA").rmd;
      expect(rule.ruleName).toBe("RRIF minimum");
      expect(rule.computeRmd(400_000, 75, "RRSP")).toBeGreaterThan(0);
      expect(rule.computeRmd(400_000, 75, "TFSA")).toBe(0);
    });

    it("US returns RMD label and computes for 401k", () => {
      const rule = getCountry("US").rmd;
      expect(rule.ruleName).toBe("RMD");
      expect(rule.computeRmd(500_000, 75, "401k")).toBeGreaterThan(0);
      expect(rule.computeRmd(500_000, 75, "Roth IRA")).toBe(0);
      expect(rule.computeRmd(500_000, 75, "Roth 401k")).toBe(0);
    });

    it("AU returns 0 for every account (no forced withdrawal)", () => {
      const rule = getCountry("AU").rmd;
      expect(rule.computeRmd(100_000, 75, "Super (Accumulation)")).toBe(0);
      expect(rule.computeRmd(100_000, 75, "Super (Pension Phase)")).toBe(0);
    });

    it("every country returns 0 for users below the start age", () => {
      for (const profile of getRegisteredCountries()) {
        expect(profile.rmd.computeRmd(100_000, 40, "401k")).toBe(0);
        expect(profile.rmd.computeRmd(100_000, 40, "RRSP")).toBe(0);
      }
    });
  });

  describe("benchmarks plugin", () => {
    for (const profile of getRegisteredCountries()) {
      describe(profile.code, () => {
        it("exposes six age groups", () => {
          expect(profile.benchmarks.ageGroups.length).toBe(6);
        });

        it("each age group has expected fields", () => {
          for (const group of profile.benchmarks.ageGroups) {
            expect(group.label.length).toBeGreaterThan(0);
            expect(group.medianNetWorth).toBeGreaterThan(0);
            expect(group.medianSavingsRate).toBeGreaterThanOrEqual(0);
            expect(group.medianSavingsRate).toBeLessThanOrEqual(1);
            expect(group.medianDebtToIncomeRatio).toBeGreaterThanOrEqual(0);
          }
        });

        it("national average has expected fields", () => {
          const natl = profile.benchmarks.national;
          expect(natl.netWorth).toBeGreaterThan(0);
          expect(natl.income).toBeGreaterThan(0);
          expect(natl.emergencyMonths).toBeGreaterThan(0);
        });

        it("data source string is non-empty", () => {
          expect(profile.benchmarks.dataSource.length).toBeGreaterThan(0);
        });
      });
    }
  });

  describe("flowchartSteps plugin", () => {
    for (const profile of getRegisteredCountries()) {
      describe(profile.code, () => {
        it("returns a non-empty list of raw steps", () => {
          const steps = profile.flowchartSteps.build({ ...INITIAL_STATE, country: profile.code }, false);
          expect(steps.length).toBeGreaterThan(0);
          for (const step of steps) {
            expect(step.id.length).toBeGreaterThan(0);
            expect(step.title.length).toBeGreaterThan(0);
            expect(typeof step.isComplete).toBe("boolean");
            expect(typeof step.progress).toBe("number");
          }
        });

        it("step ids are country-prefixed (ca-, us-, au-)", () => {
          const steps = profile.flowchartSteps.build({ ...INITIAL_STATE, country: profile.code }, false);
          const prefix = profile.code.toLowerCase() + "-";
          for (const step of steps) {
            expect(step.id.startsWith(prefix)).toBe(true);
          }
        });
      });
    }
  });
});
