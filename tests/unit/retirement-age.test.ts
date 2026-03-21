import { describe, it, expect } from "vitest";
import { computeCoastFireAge } from "@/lib/financial-state";
import { toFinancialData } from "@/lib/financial-state";
import { INITIAL_STATE } from "@/lib/financial-types";
import { encodeState, decodeState } from "@/lib/url-state";

describe("Retirement age", () => {
  describe("computeCoastFireAge with custom retirement age", () => {
    it("returns earlier coast age with later retirement target", () => {
      // Later retirement = more compounding time = coast earlier
      const coastAt65 = computeCoastFireAge(30, 100_000, 40_000, 65, 0.05, 500);
      const coastAt70 = computeCoastFireAge(30, 100_000, 40_000, 70, 0.05, 500);
      expect(coastAt70).not.toBeNull();
      expect(coastAt65).not.toBeNull();
      expect(coastAt70!).toBeLessThanOrEqual(coastAt65!);
    });

    it("returns later coast age with earlier retirement target", () => {
      const coastAt55 = computeCoastFireAge(30, 100_000, 40_000, 55, 0.05, 500);
      const coastAt65 = computeCoastFireAge(30, 100_000, 40_000, 65, 0.05, 500);
      if (coastAt55 !== null) {
        expect(coastAt55).toBeGreaterThanOrEqual(coastAt65!);
      }
    });

    it("returns null when current age >= retirement age", () => {
      expect(computeCoastFireAge(65, 100_000, 40_000, 65, 0.05, 500)).toBeNull();
      expect(computeCoastFireAge(70, 100_000, 40_000, 65, 0.05, 500)).toBeNull();
    });

    it("defaults to 65 when targetAge not provided", () => {
      const coastDefault = computeCoastFireAge(30, 100_000, 40_000);
      const coastExplicit65 = computeCoastFireAge(30, 100_000, 40_000, 65);
      expect(coastDefault).toEqual(coastExplicit65);
    });
  });

  describe("toFinancialData passes retirementAge", () => {
    it("passes retirementAge when set", () => {
      const state = { ...INITIAL_STATE, age: 35, retirementAge: 60 };
      const data = toFinancialData(state);
      expect(data.retirementAge).toBe(60);
    });

    it("defaults retirementAge to 65 when not set", () => {
      const state = { ...INITIAL_STATE, age: 35 };
      const data = toFinancialData(state);
      expect(data.retirementAge).toBe(65);
    });

    it("passes currentAge from state.age", () => {
      const state = { ...INITIAL_STATE, age: 42 };
      const data = toFinancialData(state);
      expect(data.currentAge).toBe(42);
    });
  });

  describe("FinancialState retirementAge field", () => {
    it("INITIAL_STATE does not have retirementAge (defaults to 65 in computation)", () => {
      expect(INITIAL_STATE.retirementAge).toBeUndefined();
    });

    it("can be set on FinancialState", () => {
      const state = { ...INITIAL_STATE, retirementAge: 55 };
      expect(state.retirementAge).toBe(55);
    });
  });

  describe("URL state round-trip", () => {
    it("preserves retirementAge through encode/decode", () => {
      const state = { ...INITIAL_STATE, retirementAge: 60 };
      const encoded = encodeState(state);
      const decoded = decodeState(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.retirementAge).toBe(60);
    });

    it("omits retirementAge from URL when it is the default (65)", () => {
      const state = { ...INITIAL_STATE, retirementAge: 65 };
      const encoded = encodeState(state);
      const decoded = decodeState(encoded);
      expect(decoded).not.toBeNull();
      // Default value is omitted from compact state, so it comes back as undefined
      expect(decoded!.retirementAge).toBeUndefined();
    });

    it("preserves non-default retirementAge alongside other fields", () => {
      const state = { ...INITIAL_STATE, age: 35, retirementAge: 55, country: "US" as const };
      const encoded = encodeState(state);
      const decoded = decodeState(encoded);
      expect(decoded).not.toBeNull();
      expect(decoded!.retirementAge).toBe(55);
      expect(decoded!.age).toBe(35);
      expect(decoded!.country).toBe("US");
    });
  });
});
