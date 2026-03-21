import { describe, it, expect } from "vitest";
import {
  AU_PENSION_SINGLE_FORTNIGHTLY,
  AU_PENSION_COUPLE_EACH_FORTNIGHTLY,
  AU_PENSION_AGE,
  AU_SUPER_PRESERVATION_AGE,
  getAuPensionPresetAmount,
  fortnightlyToMonthly,
  computeMonthlyGovernmentIncome,
} from "@/lib/government-retirement";
import { computeFireNumber } from "@/lib/compute-totals";
import { toFinancialData } from "@/lib/financial-state";
import { INITIAL_STATE } from "@/lib/financial-types";
import { encodeState, decodeState } from "@/lib/url-state";

describe("Government retirement income (AU)", () => {
  describe("Age Pension constants", () => {
    it("single rate is ~$1,116/fortnight", () => {
      expect(AU_PENSION_SINGLE_FORTNIGHTLY).toBeGreaterThan(1000);
      expect(AU_PENSION_SINGLE_FORTNIGHTLY).toBeLessThan(1300);
    });
    it("couple rate is ~$841/fortnight each", () => {
      expect(AU_PENSION_COUPLE_EACH_FORTNIGHTLY).toBeGreaterThan(700);
      expect(AU_PENSION_COUPLE_EACH_FORTNIGHTLY).toBeLessThan(1000);
    });
    it("single rate > couple per-person rate", () => {
      expect(AU_PENSION_SINGLE_FORTNIGHTLY).toBeGreaterThan(AU_PENSION_COUPLE_EACH_FORTNIGHTLY);
    });
    it("eligibility age is 67", () => {
      expect(AU_PENSION_AGE).toBe(67);
    });
    it("super preservation age is 60", () => {
      expect(AU_SUPER_PRESERVATION_AGE).toBe(60);
    });
  });

  describe("Age Pension presets", () => {
    it("none returns 0", () => {
      expect(getAuPensionPresetAmount("none")).toBe(0);
    });
    it("full-single returns single rate", () => {
      expect(getAuPensionPresetAmount("full-single")).toBe(AU_PENSION_SINGLE_FORTNIGHTLY);
    });
    it("full-couple returns couple rate", () => {
      expect(getAuPensionPresetAmount("full-couple")).toBe(AU_PENSION_COUPLE_EACH_FORTNIGHTLY);
    });
    it("custom returns provided amount", () => {
      expect(getAuPensionPresetAmount("custom", 500)).toBe(500);
    });
  });

  describe("fortnightlyToMonthly", () => {
    it("converts correctly: fortnightly × 26 / 12", () => {
      expect(fortnightlyToMonthly(1000)).toBeCloseTo(1000 * 26 / 12, 2);
      expect(fortnightlyToMonthly(AU_PENSION_SINGLE_FORTNIGHTLY)).toBeCloseTo(AU_PENSION_SINGLE_FORTNIGHTLY * 26 / 12, 2);
    });
    it("0 returns 0", () => {
      expect(fortnightlyToMonthly(0)).toBe(0);
    });
  });

  describe("computeMonthlyGovernmentIncome for AU", () => {
    it("converts fortnightly to monthly for AU", () => {
      const income = computeMonthlyGovernmentIncome("AU", { agePensionFortnightly: AU_PENSION_SINGLE_FORTNIGHTLY });
      expect(income).toBeCloseTo(fortnightlyToMonthly(AU_PENSION_SINGLE_FORTNIGHTLY), 2);
    });
    it("returns 0 when no pension configured", () => {
      expect(computeMonthlyGovernmentIncome("AU", {})).toBe(0);
      expect(computeMonthlyGovernmentIncome("AU", undefined)).toBe(0);
    });
    it("ignores CPP/SS fields for AU", () => {
      expect(computeMonthlyGovernmentIncome("AU", { cppMonthly: 800, ssMonthly: 2000 })).toBe(0);
    });
  });

  describe("FIRE number with Age Pension", () => {
    it("Age Pension reduces FIRE number", () => {
      const monthlyPension = fortnightlyToMonthly(AU_PENSION_SINGLE_FORTNIGHTLY);
      const fireNoPension = computeFireNumber(4000);
      const fireWithPension = computeFireNumber(4000, monthlyPension);
      expect(fireWithPension!).toBeLessThan(fireNoPension!);
    });
  });

  describe("toFinancialData with AU Age Pension", () => {
    it("includes Age Pension in monthlyGovernmentRetirementIncome", () => {
      const state = { ...INITIAL_STATE, country: "AU" as const, jurisdiction: "NSW", governmentRetirementIncome: { agePensionFortnightly: AU_PENSION_SINGLE_FORTNIGHTLY } };
      const data = toFinancialData(state);
      expect(data.monthlyGovernmentRetirementIncome).toBeCloseTo(fortnightlyToMonthly(AU_PENSION_SINGLE_FORTNIGHTLY), 1);
    });
  });

  describe("URL state round-trip for AU pension", () => {
    it("preserves Age Pension through encode/decode", () => {
      const state = { ...INITIAL_STATE, country: "AU" as const, governmentRetirementIncome: { agePensionFortnightly: 1000 } };
      const encoded = encodeState(state);
      const decoded = decodeState(encoded);
      expect(decoded!.governmentRetirementIncome?.agePensionFortnightly).toBe(1000);
    });

    it("does not include CA/US fields when only AU pension is set", () => {
      const state = { ...INITIAL_STATE, country: "AU" as const, governmentRetirementIncome: { agePensionFortnightly: 800 } };
      const encoded = encodeState(state);
      const decoded = decodeState(encoded);
      expect(decoded!.governmentRetirementIncome?.cppMonthly).toBeUndefined();
      expect(decoded!.governmentRetirementIncome?.ssMonthly).toBeUndefined();
    });
  });
});
