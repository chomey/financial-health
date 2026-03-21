import { describe, it, expect } from "vitest";
import {
  SS_AVERAGE_MONTHLY,
  SS_MAX_AT_62,
  SS_MAX_AT_67,
  SS_MAX_AT_70,
  getSsPresetAmount,
  computeMonthlyGovernmentIncome,
} from "@/lib/government-retirement";
import { computeFireNumber } from "@/lib/compute-totals";
import { toFinancialData } from "@/lib/financial-state";
import { INITIAL_STATE } from "@/lib/financial-types";
import { encodeState, decodeState } from "@/lib/url-state";

describe("Government retirement income (US)", () => {
  describe("Social Security presets", () => {
    it("none returns 0", () => {
      expect(getSsPresetAmount("none")).toBe(0);
    });
    it("average returns ~$1,976/mo", () => {
      expect(getSsPresetAmount("average")).toBe(SS_AVERAGE_MONTHLY);
      expect(SS_AVERAGE_MONTHLY).toBeGreaterThan(1500);
      expect(SS_AVERAGE_MONTHLY).toBeLessThan(2500);
    });
    it("max-62 returns ~$2,710/mo", () => {
      expect(getSsPresetAmount("max-62")).toBe(SS_MAX_AT_62);
      expect(SS_MAX_AT_62).toBeGreaterThan(2000);
    });
    it("max-67 (full retirement age) returns ~$3,822/mo", () => {
      expect(getSsPresetAmount("max-67")).toBe(SS_MAX_AT_67);
      expect(SS_MAX_AT_67).toBeGreaterThan(3000);
    });
    it("max-70 returns ~$4,873/mo", () => {
      expect(getSsPresetAmount("max-70")).toBe(SS_MAX_AT_70);
      expect(SS_MAX_AT_70).toBeGreaterThan(4000);
    });
    it("max amounts increase with claiming age", () => {
      expect(SS_MAX_AT_62).toBeLessThan(SS_MAX_AT_67);
      expect(SS_MAX_AT_67).toBeLessThan(SS_MAX_AT_70);
    });
    it("custom returns provided amount", () => {
      expect(getSsPresetAmount("custom", 2500)).toBe(2500);
    });
    it("custom with no amount returns 0", () => {
      expect(getSsPresetAmount("custom")).toBe(0);
    });
  });

  describe("computeMonthlyGovernmentIncome for US", () => {
    it("returns SS monthly for US", () => {
      expect(computeMonthlyGovernmentIncome("US", { ssMonthly: 2000 })).toBe(2000);
    });
    it("returns 0 when no SS configured", () => {
      expect(computeMonthlyGovernmentIncome("US", {})).toBe(0);
      expect(computeMonthlyGovernmentIncome("US", undefined)).toBe(0);
    });
    it("ignores CPP/OAS fields for US country", () => {
      expect(computeMonthlyGovernmentIncome("US", { cppMonthly: 800, oasMonthly: 700 })).toBe(0);
    });
  });

  describe("FIRE number with Social Security", () => {
    it("SS reduces FIRE number", () => {
      const fireNoSS = computeFireNumber(5000);
      const fireWithSS = computeFireNumber(5000, SS_AVERAGE_MONTHLY);
      expect(fireWithSS!).toBeLessThan(fireNoSS!);
      // (5000-1976)*12/0.04 = $907,200 vs 5000*12/0.04 = $1,500,000
      expect(fireWithSS!).toBeCloseTo((5000 - SS_AVERAGE_MONTHLY) * 12 / 0.04, -2);
    });
  });

  describe("toFinancialData with US Social Security", () => {
    it("includes SS in monthlyGovernmentRetirementIncome", () => {
      const state = { ...INITIAL_STATE, country: "US" as const, jurisdiction: "CA", governmentRetirementIncome: { ssMonthly: 2500 } };
      const data = toFinancialData(state);
      expect(data.monthlyGovernmentRetirementIncome).toBe(2500);
    });

    it("FIRE number is reduced by SS income", () => {
      const stateNoSS = { ...INITIAL_STATE, country: "US" as const, jurisdiction: "CA" };
      const stateWithSS = { ...INITIAL_STATE, country: "US" as const, jurisdiction: "CA", governmentRetirementIncome: { ssMonthly: SS_AVERAGE_MONTHLY } };
      const dataNoSS = toFinancialData(stateNoSS);
      const dataWithSS = toFinancialData(stateWithSS);
      if (dataNoSS.fireNumber && dataWithSS.fireNumber) {
        expect(dataWithSS.fireNumber).toBeLessThan(dataNoSS.fireNumber);
      }
    });
  });

  describe("URL state round-trip for US SS", () => {
    it("preserves Social Security through encode/decode", () => {
      const state = { ...INITIAL_STATE, country: "US" as const, governmentRetirementIncome: { ssMonthly: 3000 } };
      const encoded = encodeState(state);
      const decoded = decodeState(encoded);
      expect(decoded!.governmentRetirementIncome?.ssMonthly).toBe(3000);
    });

    it("does not include CA fields when only SS is set", () => {
      const state = { ...INITIAL_STATE, country: "US" as const, governmentRetirementIncome: { ssMonthly: 2000 } };
      const encoded = encodeState(state);
      const decoded = decodeState(encoded);
      expect(decoded!.governmentRetirementIncome?.cppMonthly).toBeUndefined();
      expect(decoded!.governmentRetirementIncome?.oasMonthly).toBeUndefined();
    });
  });
});
