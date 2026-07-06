import { describe, it, expect } from "vitest";
import {
  americanGovernmentRetirement,
  SS_AVERAGE_MONTHLY,
  SS_MAX_AT_62,
  SS_MAX_AT_67,
  SS_MAX_AT_70,
} from "@/lib/countries/usa/government-retirement";

describe("americanGovernmentRetirement", () => {
  describe("computeMonthly", () => {
    it("returns ssMonthly", () => {
      expect(
        americanGovernmentRetirement.computeMonthly({ ssMonthly: 1500 }),
      ).toBe(1500);
    });

    it("returns 0 when income is undefined", () => {
      expect(americanGovernmentRetirement.computeMonthly(undefined)).toBe(0);
    });

    it("returns 0 when ssMonthly is missing", () => {
      expect(americanGovernmentRetirement.computeMonthly({})).toBe(0);
    });

    it("ignores other-country fields (cppMonthly, oasMonthly, agePensionFortnightly)", () => {
      expect(
        americanGovernmentRetirement.computeMonthly({
          ssMonthly: 2000,
          cppMonthly: 800,
          oasMonthly: 700,
          agePensionFortnightly: 1000,
        }),
      ).toBe(2000);
    });
  });

  describe("presetsFor('ss')", () => {
    const presets = americanGovernmentRetirement.presetsFor("ss");

    it("includes none/average/max-62/max-67/max-70/custom values", () => {
      const values = presets.map((p) => p.value);
      expect(values).toEqual([
        "none",
        "average",
        "max-62",
        "max-67",
        "max-70",
        "custom",
      ]);
    });

    it("none preset has amount 0", () => {
      expect(presets.find((p) => p.value === "none")?.amount).toBe(0);
    });

    it("average preset matches SS_AVERAGE_MONTHLY", () => {
      expect(presets.find((p) => p.value === "average")?.amount).toBeCloseTo(
        SS_AVERAGE_MONTHLY,
      );
    });

    it("max-62 preset matches SS_MAX_AT_62", () => {
      expect(presets.find((p) => p.value === "max-62")?.amount).toBeCloseTo(
        SS_MAX_AT_62,
      );
    });

    it("max-67 preset matches SS_MAX_AT_67", () => {
      expect(presets.find((p) => p.value === "max-67")?.amount).toBeCloseTo(
        SS_MAX_AT_67,
      );
    });

    it("max-70 preset matches SS_MAX_AT_70", () => {
      expect(presets.find((p) => p.value === "max-70")?.amount).toBeCloseTo(
        SS_MAX_AT_70,
      );
    });

    it("custom preset has amount 0", () => {
      expect(presets.find((p) => p.value === "custom")?.amount).toBe(0);
    });

    it("max amounts increase with claiming age (62 < 67 < 70)", () => {
      const max62 = presets.find((p) => p.value === "max-62")?.amount ?? 0;
      const max67 = presets.find((p) => p.value === "max-67")?.amount ?? 0;
      const max70 = presets.find((p) => p.value === "max-70")?.amount ?? 0;
      expect(max62).toBeLessThan(max67);
      expect(max67).toBeLessThan(max70);
    });

    it("each preset has a non-empty label", () => {
      for (const preset of presets) {
        expect(preset.label.length).toBeGreaterThan(0);
      }
    });

    it("derives benefit amounts in labels from the constants", () => {
      expect(presets.find((p) => p.value === "average")?.label).toBe("Average ($2,071/mo)");
      expect(presets.find((p) => p.value === "max-62")?.label).toBe("Max @ 62 ($2,969/mo)");
      expect(presets.find((p) => p.value === "max-67")?.label).toBe("Max @ 67 ($4,207/mo)");
      expect(presets.find((p) => p.value === "max-70")?.label).toBe("Max @ 70 ($5,181/mo)");
    });
  });

  describe("presetsFor(unknown field)", () => {
    it("returns empty array for unknown field", () => {
      expect(americanGovernmentRetirement.presetsFor("cpp")).toEqual([]);
      expect(americanGovernmentRetirement.presetsFor("oas")).toEqual([]);
      expect(americanGovernmentRetirement.presetsFor("agePension")).toEqual([]);
      expect(americanGovernmentRetirement.presetsFor("")).toEqual([]);
    });
  });

  describe("constants", () => {
    it("SS_AVERAGE_MONTHLY is the 2026 published average (~$2,071)", () => {
      expect(SS_AVERAGE_MONTHLY).toBe(2_071);
    });

    it("SS_MAX_AT_62 is the 2026 published max at 62 (~$2,969)", () => {
      expect(SS_MAX_AT_62).toBe(2_969);
    });

    it("SS_MAX_AT_67 is the 2026 published max at FRA 67 (~$4,207)", () => {
      expect(SS_MAX_AT_67).toBe(4_207);
    });

    it("SS_MAX_AT_70 is the 2026 published max at 70 (~$5,181)", () => {
      expect(SS_MAX_AT_70).toBe(5_181);
    });
  });
});
