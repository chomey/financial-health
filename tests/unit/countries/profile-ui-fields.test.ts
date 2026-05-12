import { describe, it, expect } from "vitest";
import { getCountry, getRegisteredCountries } from "@/lib/countries";

describe("CountryProfile UI surface fields", () => {
  describe("wizardRegisteredCategories", () => {
    it("CA returns TFSA/RRSP", () => {
      expect(getCountry("CA").wizardRegisteredCategories).toEqual(["TFSA", "RRSP"]);
    });

    it("US returns Roth IRA/401k", () => {
      expect(getCountry("US").wizardRegisteredCategories).toEqual(["Roth IRA", "401k"]);
    });

    it("AU returns Roth IRA/401k (preserves pre-refactor behavior)", () => {
      expect(getCountry("AU").wizardRegisteredCategories).toEqual(["Roth IRA", "401k"]);
    });

    it("every registered country exposes a [primary, secondary] tuple", () => {
      for (const profile of getRegisteredCountries()) {
        expect(profile.wizardRegisteredCategories).toHaveLength(2);
        expect(typeof profile.wizardRegisteredCategories[0]).toBe("string");
        expect(typeof profile.wizardRegisteredCategories[1]).toBe("string");
      }
    });
  });

  describe("flowchartWiki", () => {
    it("CA maps to r/PersonalFinanceCanada with money-steps wiki url", () => {
      const wiki = getCountry("CA").flowchartWiki;
      expect(wiki.tipName).toBe("r/PersonalFinanceCanada");
      expect(wiki.linkText).toBe("r/PersonalFinanceCanada");
      expect(wiki.linkUrl).toContain("PersonalFinanceCanada");
    });

    it("US maps to r/personalfinance commontopics wiki", () => {
      const wiki = getCountry("US").flowchartWiki;
      expect(wiki.tipName).toBe("r/personalfinance");
      expect(wiki.linkText).toBe("r/personalfinance");
      expect(wiki.linkUrl).toContain("personalfinance");
    });

    it("AU help tip references r/AusFinance (pre-refactor visible text)", () => {
      const wiki = getCountry("AU").flowchartWiki;
      expect(wiki.tipName).toBe("r/AusFinance");
      // AU link still points at r/personalfinance to preserve current UI behavior.
      expect(wiki.linkText).toBe("r/personalfinance");
    });

    it("every registered country has a parseable link URL", () => {
      for (const profile of getRegisteredCountries()) {
        expect(() => new URL(profile.flowchartWiki.linkUrl)).not.toThrow();
      }
    });
  });

  describe("regionTaxLabel", () => {
    it("CA is Provincial", () => {
      expect(getCountry("CA").regionTaxLabel).toBe("Provincial");
    });

    it("US and AU are State", () => {
      expect(getCountry("US").regionTaxLabel).toBe("State");
      expect(getCountry("AU").regionTaxLabel).toBe("State");
    });
  });

  describe("governmentRetirement.programLabel", () => {
    it("CA reports CPP + OAS", () => {
      expect(getCountry("CA").governmentRetirement.programLabel).toBe("CPP + OAS");
    });

    it("US reports Social Security", () => {
      expect(getCountry("US").governmentRetirement.programLabel).toBe("Social Security");
    });

    it("AU reports Age Pension", () => {
      expect(getCountry("AU").governmentRetirement.programLabel).toBe("Age Pension");
    });
  });
});
