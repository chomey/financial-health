import { describe, it, expect } from "vitest";
import {
  canadianGovernmentRetirement,
  CPP_MAX_MONTHLY,
  CPP_AVERAGE_MONTHLY,
  OAS_MAX_MONTHLY_65_74,
  OAS_MAX_MONTHLY_75_PLUS,
  OAS_CLAWBACK_THRESHOLD,
} from "@/lib/countries/canada/government-retirement";

describe("canadianGovernmentRetirement", () => {
  describe("computeMonthly", () => {
    it("sums CPP + OAS", () => {
      expect(
        canadianGovernmentRetirement.computeMonthly({
          cppMonthly: 1000,
          oasMonthly: 700,
        }),
      ).toBe(1700);
    });

    it("returns 0 when income is undefined", () => {
      expect(canadianGovernmentRetirement.computeMonthly(undefined)).toBe(0);
    });

    it("returns 0 when both fields are missing", () => {
      expect(canadianGovernmentRetirement.computeMonthly({})).toBe(0);
    });

    it("treats missing fields as 0", () => {
      expect(canadianGovernmentRetirement.computeMonthly({ cppMonthly: 500 })).toBe(500);
      expect(canadianGovernmentRetirement.computeMonthly({ oasMonthly: 600 })).toBe(600);
    });

    it("ignores other-country fields (ssMonthly, agePensionFortnightly)", () => {
      expect(
        canadianGovernmentRetirement.computeMonthly({
          cppMonthly: 800,
          oasMonthly: 700,
          ssMonthly: 2000,
          agePensionFortnightly: 1000,
        }),
      ).toBe(1500);
    });
  });

  describe("presetsFor('cpp')", () => {
    const presets = canadianGovernmentRetirement.presetsFor("cpp");

    it("includes none/average/max/custom values", () => {
      const values = presets.map((p) => p.value);
      expect(values).toEqual(["none", "average", "max", "custom"]);
    });

    it("none preset has amount 0", () => {
      expect(presets.find((p) => p.value === "none")?.amount).toBe(0);
    });

    it("average preset matches CPP_AVERAGE_MONTHLY", () => {
      expect(presets.find((p) => p.value === "average")?.amount).toBeCloseTo(
        CPP_AVERAGE_MONTHLY,
      );
    });

    it("max preset matches CPP_MAX_MONTHLY", () => {
      expect(presets.find((p) => p.value === "max")?.amount).toBeCloseTo(CPP_MAX_MONTHLY);
    });

    it("custom preset has amount 0", () => {
      expect(presets.find((p) => p.value === "custom")?.amount).toBe(0);
    });

    it("each preset has a non-empty label", () => {
      for (const preset of presets) {
        expect(preset.label.length).toBeGreaterThan(0);
      }
    });

    it("derives benefit amounts in labels from the constants", () => {
      expect(presets.find((p) => p.value === "average")?.label).toBe("Average ($925/mo)");
      expect(presets.find((p) => p.value === "max")?.label).toBe("Max ($1,508/mo)");
    });
  });

  describe("presetsFor('oas')", () => {
    const presets = canadianGovernmentRetirement.presetsFor("oas");

    it("includes none/full/custom values", () => {
      const values = presets.map((p) => p.value);
      expect(values).toEqual(["none", "full", "custom"]);
    });

    it("none preset has amount 0", () => {
      expect(presets.find((p) => p.value === "none")?.amount).toBe(0);
    });

    it("full preset matches OAS_MAX_MONTHLY_65_74", () => {
      expect(presets.find((p) => p.value === "full")?.amount).toBeCloseTo(
        OAS_MAX_MONTHLY_65_74,
      );
    });

    it("custom preset has amount 0", () => {
      expect(presets.find((p) => p.value === "custom")?.amount).toBe(0);
    });

    it("each preset has a non-empty label", () => {
      for (const preset of presets) {
        expect(preset.label.length).toBeGreaterThan(0);
      }
    });

    it("derives benefit amounts in labels from the constants", () => {
      expect(presets.find((p) => p.value === "full")?.label).toBe("Full ($742/mo)");
    });
  });

  describe("presetsFor(unknown field)", () => {
    it("returns empty array for unknown field", () => {
      expect(canadianGovernmentRetirement.presetsFor("ss")).toEqual([]);
      expect(canadianGovernmentRetirement.presetsFor("agePension")).toEqual([]);
      expect(canadianGovernmentRetirement.presetsFor("")).toEqual([]);
    });
  });

  describe("constants", () => {
    it("CPP_MAX_MONTHLY is the 2026 published max", () => {
      expect(CPP_MAX_MONTHLY).toBeCloseTo(1507.65);
    });

    it("CPP_AVERAGE_MONTHLY is the 2026 published average", () => {
      expect(CPP_AVERAGE_MONTHLY).toBeCloseTo(925.35);
    });

    it("OAS_MAX_MONTHLY_65_74 is the Q1 2026 published max", () => {
      expect(OAS_MAX_MONTHLY_65_74).toBeCloseTo(742.31);
    });

    it("OAS_MAX_MONTHLY_75_PLUS is higher than 65-74 rate", () => {
      expect(OAS_MAX_MONTHLY_75_PLUS).toBeGreaterThan(OAS_MAX_MONTHLY_65_74);
    });

    it("OAS_CLAWBACK_THRESHOLD is the 2025 tax year threshold", () => {
      expect(OAS_CLAWBACK_THRESHOLD).toBeCloseTo(93454);
    });
  });
});
