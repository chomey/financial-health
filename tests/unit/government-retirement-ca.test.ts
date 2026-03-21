import { describe, it, expect } from "vitest";
import {
  CPP_MAX_MONTHLY,
  CPP_AVERAGE_MONTHLY,
  OAS_MAX_MONTHLY_65_74,
  getCppPresetAmount,
  getOasPresetAmount,
  computeMonthlyGovernmentIncome,
} from "@/lib/government-retirement";
import { computeFireNumber } from "@/lib/compute-totals";
import { computeCoastFireAge, toFinancialData } from "@/lib/financial-state";
import { INITIAL_STATE } from "@/lib/financial-types";
import { encodeState, decodeState } from "@/lib/url-state";

describe("Government retirement income (CA)", () => {
  describe("CPP presets", () => {
    it("none returns 0", () => {
      expect(getCppPresetAmount("none")).toBe(0);
    });
    it("average returns ~$817/mo", () => {
      expect(getCppPresetAmount("average")).toBe(CPP_AVERAGE_MONTHLY);
      expect(CPP_AVERAGE_MONTHLY).toBeGreaterThan(700);
      expect(CPP_AVERAGE_MONTHLY).toBeLessThan(1000);
    });
    it("max returns ~$1,365/mo", () => {
      expect(getCppPresetAmount("max")).toBe(CPP_MAX_MONTHLY);
      expect(CPP_MAX_MONTHLY).toBeGreaterThan(1200);
      expect(CPP_MAX_MONTHLY).toBeLessThan(1600);
    });
    it("custom returns provided amount", () => {
      expect(getCppPresetAmount("custom", 900)).toBe(900);
    });
    it("custom with no amount returns 0", () => {
      expect(getCppPresetAmount("custom")).toBe(0);
    });
  });

  describe("OAS presets", () => {
    it("none returns 0", () => {
      expect(getOasPresetAmount("none")).toBe(0);
    });
    it("full returns ~$728/mo", () => {
      expect(getOasPresetAmount("full")).toBe(OAS_MAX_MONTHLY_65_74);
      expect(OAS_MAX_MONTHLY_65_74).toBeGreaterThan(600);
      expect(OAS_MAX_MONTHLY_65_74).toBeLessThan(900);
    });
    it("custom returns provided amount", () => {
      expect(getOasPresetAmount("custom", 500)).toBe(500);
    });
  });

  describe("computeMonthlyGovernmentIncome", () => {
    it("returns CPP + OAS for CA", () => {
      const income = computeMonthlyGovernmentIncome("CA", { cppMonthly: 800, oasMonthly: 700 });
      expect(income).toBe(1500);
    });

    it("returns 0 when no government income configured", () => {
      expect(computeMonthlyGovernmentIncome("CA", undefined)).toBe(0);
      expect(computeMonthlyGovernmentIncome("CA", {})).toBe(0);
    });

    it("returns SS for US", () => {
      expect(computeMonthlyGovernmentIncome("US", { ssMonthly: 2000 })).toBe(2000);
    });

    it("converts AU fortnightly to monthly", () => {
      // fortnightly × 26 / 12
      const income = computeMonthlyGovernmentIncome("AU", { agePensionFortnightly: 1000 });
      expect(income).toBeCloseTo(1000 * 26 / 12, 1);
    });
  });

  describe("FIRE number with government income", () => {
    it("government income reduces FIRE number", () => {
      const fireNoGov = computeFireNumber(4000); // $4000/mo expenses
      const fireWithGov = computeFireNumber(4000, 1500); // $1500/mo government income
      expect(fireNoGov).toBeDefined();
      expect(fireWithGov).toBeDefined();
      // FIRE with gov income should be lower (need less from portfolio)
      expect(fireWithGov!).toBeLessThan(fireNoGov!);
      // Specifically: (4000-1500)*12/0.04 = 750,000 vs 4000*12/0.04 = 1,200,000
      expect(fireWithGov!).toBeCloseTo(750_000, -2);
      expect(fireNoGov!).toBeCloseTo(1_200_000, -2);
    });

    it("government income covering all expenses results in undefined (no portfolio needed)", () => {
      const fire = computeFireNumber(2000, 2500); // gov income exceeds expenses
      expect(fire).toBeUndefined();
    });

    it("zero government income = original behavior", () => {
      const fireDefault = computeFireNumber(3000);
      const fireZeroGov = computeFireNumber(3000, 0);
      expect(fireDefault).toEqual(fireZeroGov);
    });
  });

  describe("Coast FIRE with government income", () => {
    it("government income makes coast FIRE easier (earlier coast age)", () => {
      const coastNoGov = computeCoastFireAge(35, 200_000, 48_000, 65, 0.05, 500, 0);
      const coastWithGov = computeCoastFireAge(35, 200_000, 48_000, 65, 0.05, 500, 1500);
      // With government income, should coast earlier or already coasting
      if (coastNoGov !== null && coastWithGov !== null) {
        expect(coastWithGov).toBeLessThanOrEqual(coastNoGov);
      }
    });
  });

  describe("toFinancialData passes government income", () => {
    it("includes monthlyGovernmentRetirementIncome when set", () => {
      const state = { ...INITIAL_STATE, governmentRetirementIncome: { cppMonthly: 800, oasMonthly: 700 } };
      const data = toFinancialData(state);
      expect(data.monthlyGovernmentRetirementIncome).toBe(1500);
    });

    it("omits monthlyGovernmentRetirementIncome when not set", () => {
      const data = toFinancialData(INITIAL_STATE);
      expect(data.monthlyGovernmentRetirementIncome).toBeUndefined();
    });

    it("FIRE number is reduced by government income", () => {
      const stateNoGov = { ...INITIAL_STATE };
      const stateWithGov = { ...INITIAL_STATE, governmentRetirementIncome: { cppMonthly: CPP_AVERAGE_MONTHLY, oasMonthly: OAS_MAX_MONTHLY_65_74 } };
      const dataNoGov = toFinancialData(stateNoGov);
      const dataWithGov = toFinancialData(stateWithGov);
      if (dataNoGov.fireNumber && dataWithGov.fireNumber) {
        expect(dataWithGov.fireNumber).toBeLessThan(dataNoGov.fireNumber);
      }
    });
  });

  describe("URL state round-trip", () => {
    it("preserves government retirement income through encode/decode", () => {
      const state = { ...INITIAL_STATE, governmentRetirementIncome: { cppMonthly: 800, oasMonthly: 700 } };
      const encoded = encodeState(state);
      const decoded = decodeState(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.governmentRetirementIncome?.cppMonthly).toBe(800);
      expect(decoded!.governmentRetirementIncome?.oasMonthly).toBe(700);
    });

    it("omits government retirement income when empty", () => {
      const state = { ...INITIAL_STATE };
      const encoded = encodeState(state);
      const decoded = decodeState(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.governmentRetirementIncome).toBeUndefined();
    });

    it("preserves US Social Security", () => {
      const state = { ...INITIAL_STATE, country: "US" as const, governmentRetirementIncome: { ssMonthly: 2000 } };
      const encoded = encodeState(state);
      const decoded = decodeState(encoded);
      expect(decoded!.governmentRetirementIncome?.ssMonthly).toBe(2000);
    });
  });
});
