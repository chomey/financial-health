import { describe, it, expect } from "vitest";
import {
  australianGovernmentRetirement,
  AU_PENSION_SINGLE_FORTNIGHTLY,
  AU_PENSION_COUPLE_EACH_FORTNIGHTLY,
  AU_PENSION_AGE,
  AU_SUPER_PRESERVATION_AGE,
  getAuPensionPresetAmount,
  fortnightlyToMonthly,
} from "@/lib/countries/australia/government-retirement";

describe("australianGovernmentRetirement", () => {
  describe("computeMonthly", () => {
    it("converts fortnightly Age Pension to monthly (× 26 / 12)", () => {
      expect(
        australianGovernmentRetirement.computeMonthly({
          agePensionFortnightly: AU_PENSION_SINGLE_FORTNIGHTLY,
        }),
      ).toBeCloseTo((AU_PENSION_SINGLE_FORTNIGHTLY * 26) / 12, 6);
    });

    it("matches the documented formula exactly", () => {
      expect(
        australianGovernmentRetirement.computeMonthly({
          agePensionFortnightly: AU_PENSION_SINGLE_FORTNIGHTLY,
        }),
      ).toBe((AU_PENSION_SINGLE_FORTNIGHTLY * 26) / 12);
    });

    it("returns 0 when income is undefined", () => {
      expect(australianGovernmentRetirement.computeMonthly(undefined)).toBe(0);
    });

    it("returns 0 when agePensionFortnightly is missing", () => {
      expect(australianGovernmentRetirement.computeMonthly({})).toBe(0);
    });

    it("returns 0 when agePensionFortnightly is 0", () => {
      expect(australianGovernmentRetirement.computeMonthly({ agePensionFortnightly: 0 })).toBe(0);
    });

    it("ignores other-country fields (cppMonthly, oasMonthly, ssMonthly)", () => {
      expect(
        australianGovernmentRetirement.computeMonthly({
          agePensionFortnightly: 1000,
          cppMonthly: 800,
          oasMonthly: 700,
          ssMonthly: 2000,
        }),
      ).toBeCloseTo((1000 * 26) / 12, 6);
    });
  });

  describe("presetsFor('agePension')", () => {
    const presets = australianGovernmentRetirement.presetsFor("agePension");

    it("includes none/full-single/full-couple/custom values", () => {
      const values = presets.map((p) => p.value);
      expect(values).toEqual(["none", "full-single", "full-couple", "custom"]);
    });

    it("none preset has amount 0", () => {
      expect(presets.find((p) => p.value === "none")?.amount).toBe(0);
    });

    it("full-single preset matches AU_PENSION_SINGLE_FORTNIGHTLY", () => {
      expect(presets.find((p) => p.value === "full-single")?.amount).toBeCloseTo(
        AU_PENSION_SINGLE_FORTNIGHTLY,
      );
    });

    it("full-couple preset matches AU_PENSION_COUPLE_EACH_FORTNIGHTLY", () => {
      expect(presets.find((p) => p.value === "full-couple")?.amount).toBeCloseTo(
        AU_PENSION_COUPLE_EACH_FORTNIGHTLY,
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
      expect(presets.find((p) => p.value === "full-single")?.label).toBe("Full single ($1,201/fn)");
      expect(presets.find((p) => p.value === "full-couple")?.label).toBe("Full couple ($905/fn ea)");
    });
  });

  describe("presetsFor(unknown field)", () => {
    it("returns empty array for unknown field", () => {
      expect(australianGovernmentRetirement.presetsFor("cpp")).toEqual([]);
      expect(australianGovernmentRetirement.presetsFor("ss")).toEqual([]);
      expect(australianGovernmentRetirement.presetsFor("oas")).toEqual([]);
      expect(australianGovernmentRetirement.presetsFor("")).toEqual([]);
    });
  });

  describe("constants", () => {
    it("AU_PENSION_SINGLE_FORTNIGHTLY is the 20 March 2026 published max", () => {
      expect(AU_PENSION_SINGLE_FORTNIGHTLY).toBeCloseTo(1200.90);
    });

    it("AU_PENSION_COUPLE_EACH_FORTNIGHTLY is the 20 March 2026 published max", () => {
      expect(AU_PENSION_COUPLE_EACH_FORTNIGHTLY).toBeCloseTo(905.20);
    });

    it("single rate is higher than couple-each rate", () => {
      expect(AU_PENSION_SINGLE_FORTNIGHTLY).toBeGreaterThan(AU_PENSION_COUPLE_EACH_FORTNIGHTLY);
    });

    it("AU_PENSION_AGE is 67", () => {
      expect(AU_PENSION_AGE).toBe(67);
    });

    it("AU_SUPER_PRESERVATION_AGE is 60 (born after 1 July 1964)", () => {
      expect(AU_SUPER_PRESERVATION_AGE).toBe(60);
    });
  });
});

describe("getAuPensionPresetAmount", () => {
  it("none returns 0", () => {
    expect(getAuPensionPresetAmount("none")).toBe(0);
  });

  it("full-single returns AU_PENSION_SINGLE_FORTNIGHTLY", () => {
    expect(getAuPensionPresetAmount("full-single")).toBe(AU_PENSION_SINGLE_FORTNIGHTLY);
  });

  it("full-couple returns AU_PENSION_COUPLE_EACH_FORTNIGHTLY", () => {
    expect(getAuPensionPresetAmount("full-couple")).toBe(AU_PENSION_COUPLE_EACH_FORTNIGHTLY);
  });

  it("custom returns the provided custom amount", () => {
    expect(getAuPensionPresetAmount("custom", 500)).toBe(500);
  });

  it("custom with no amount returns 0", () => {
    expect(getAuPensionPresetAmount("custom")).toBe(0);
  });
});

describe("fortnightlyToMonthly", () => {
  it("converts fortnightly to monthly using × 26 / 12", () => {
    expect(fortnightlyToMonthly(1000)).toBeCloseTo((1000 * 26) / 12, 6);
  });

  it("converts AU_PENSION_SINGLE_FORTNIGHTLY correctly", () => {
    expect(fortnightlyToMonthly(AU_PENSION_SINGLE_FORTNIGHTLY)).toBeCloseTo(
      (AU_PENSION_SINGLE_FORTNIGHTLY * 26) / 12,
      6,
    );
  });

  it("returns 0 for 0", () => {
    expect(fortnightlyToMonthly(0)).toBe(0);
  });
});
