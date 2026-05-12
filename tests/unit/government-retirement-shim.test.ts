import { describe, it, expect } from "vitest";
import { computeMonthlyGovernmentIncome, type GovernmentRetirementIncome } from "@/lib/government-retirement";
import { getCountry } from "@/lib/countries";

describe("computeMonthlyGovernmentIncome shim", () => {
  describe("CA — delegates to canadianGovernmentRetirement.computeMonthly", () => {
    it("returns CPP + OAS sum", () => {
      expect(computeMonthlyGovernmentIncome("CA", { cppMonthly: 1000, oasMonthly: 700 })).toBe(1700);
    });

    it("returns 0 when gri is undefined", () => {
      expect(computeMonthlyGovernmentIncome("CA", undefined)).toBe(0);
    });

    it("returns 0 when both fields are absent", () => {
      expect(computeMonthlyGovernmentIncome("CA", {})).toBe(0);
    });

    it("matches country plugin directly", () => {
      const gri: GovernmentRetirementIncome = { cppMonthly: 800, oasMonthly: 600 };
      expect(computeMonthlyGovernmentIncome("CA", gri)).toBe(
        getCountry("CA").governmentRetirement.computeMonthly(gri),
      );
    });
  });

  describe("US — delegates to usaGovernmentRetirement.computeMonthly", () => {
    it("returns ssMonthly", () => {
      expect(computeMonthlyGovernmentIncome("US", { ssMonthly: 1800 })).toBe(1800);
    });

    it("returns 0 when gri is undefined", () => {
      expect(computeMonthlyGovernmentIncome("US", undefined)).toBe(0);
    });

    it("returns 0 when ssMonthly is absent", () => {
      expect(computeMonthlyGovernmentIncome("US", {})).toBe(0);
    });

    it("matches country plugin directly", () => {
      const gri: GovernmentRetirementIncome = { ssMonthly: 2000 };
      expect(computeMonthlyGovernmentIncome("US", gri)).toBe(
        getCountry("US").governmentRetirement.computeMonthly(gri),
      );
    });
  });

  describe("AU — delegates to australianGovernmentRetirement.computeMonthly", () => {
    it("converts fortnightly Age Pension to monthly", () => {
      // 26 fortnights / 12 months ≈ 2.1667
      const fortnightly = 1000;
      const expected = (fortnightly * 26) / 12;
      expect(computeMonthlyGovernmentIncome("AU", { agePensionFortnightly: fortnightly })).toBeCloseTo(expected);
    });

    it("returns 0 when gri is undefined", () => {
      expect(computeMonthlyGovernmentIncome("AU", undefined)).toBe(0);
    });

    it("returns 0 when agePensionFortnightly is absent", () => {
      expect(computeMonthlyGovernmentIncome("AU", {})).toBe(0);
    });

    it("matches country plugin directly", () => {
      const gri: GovernmentRetirementIncome = { agePensionFortnightly: 800 };
      expect(computeMonthlyGovernmentIncome("AU", gri)).toBe(
        getCountry("AU").governmentRetirement.computeMonthly(gri),
      );
    });
  });

  describe("GovernmentRetirementIncome re-export", () => {
    it("type is re-exported from government-retirement (compile-time check)", () => {
      const gri: GovernmentRetirementIncome = {
        cppMonthly: 500,
        oasMonthly: 300,
        ssMonthly: 1500,
        agePensionFortnightly: 900,
      };
      expect(typeof gri).toBe("object");
    });
  });
});
