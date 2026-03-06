import { describe, it, expect } from "vitest";
import { classifyTaxTreatment, getTaxTreatment, type TaxTreatment } from "@/lib/withdrawal-tax";
import { encodeState, decodeState } from "@/lib/url-state";
import { INITIAL_STATE } from "@/lib/financial-state";

describe("classifyTaxTreatment — keyword matching", () => {
  describe("tax-free keywords", () => {
    it.each([
      "TFSA", "My TFSA", "tfsa savings",
      "Roth IRA", "Roth 401k", "Fidelity Roth",
      "HSA", "Company HSA",
      "FHSA", "My FHSA",
      "Tax-Free Account", "tax free savings",
    ])("classifies '%s' as tax-free", (category) => {
      expect(classifyTaxTreatment(category)).toBe("tax-free");
    });
  });

  describe("tax-deferred keywords", () => {
    it.each([
      "RRSP", "Company RRSP", "My RRSP Savings",
      "401k", "BP 401k", "Company 401k",
      "IRA", "Traditional IRA",
      "LIRA", "TD LIRA",
      "RESP", "Child RESP",
      "529", "NY 529 Plan",
      "Pension", "Company Pension",
      "Retirement", "Retirement Savings",
    ])("classifies '%s' as tax-deferred", (category) => {
      expect(classifyTaxTreatment(category)).toBe("tax-deferred");
    });
  });

  describe("roth keywords take priority over deferred keywords", () => {
    it("Roth 401k → tax-free (not tax-deferred)", () => {
      expect(classifyTaxTreatment("Roth 401k")).toBe("tax-free");
    });

    it("Roth IRA → tax-free (not tax-deferred)", () => {
      expect(classifyTaxTreatment("Roth IRA")).toBe("tax-free");
    });

    it("My Roth 401k at Fidelity → tax-free", () => {
      expect(classifyTaxTreatment("My Roth 401k at Fidelity")).toBe("tax-free");
    });
  });

  describe("taxable (default)", () => {
    it.each([
      "Savings", "Savings Account", "Checking",
      "Brokerage", "Fidelity Brokerage",
      "Vehicle", "Other",
      "TD GIC", "Money Market",
      "Unknown Account", "My Custom Fund", "",
    ])("classifies '%s' as taxable", (category) => {
      expect(classifyTaxTreatment(category)).toBe("taxable");
    });
  });

  describe("case insensitivity", () => {
    it("matches regardless of case", () => {
      expect(classifyTaxTreatment("rrsp")).toBe("tax-deferred");
      expect(classifyTaxTreatment("RRSP")).toBe("tax-deferred");
      expect(classifyTaxTreatment("Rrsp")).toBe("tax-deferred");
      expect(classifyTaxTreatment("roth ira")).toBe("tax-free");
      expect(classifyTaxTreatment("ROTH IRA")).toBe("tax-free");
    });
  });
});

describe("getTaxTreatment — override parameter", () => {
  it("returns auto-detected treatment when no override", () => {
    expect(getTaxTreatment("TFSA")).toBe("tax-free");
    expect(getTaxTreatment("401k")).toBe("tax-deferred");
    expect(getTaxTreatment("Brokerage")).toBe("taxable");
  });

  it("returns override when provided", () => {
    expect(getTaxTreatment("Brokerage", "tax-free")).toBe("tax-free");
    expect(getTaxTreatment("TFSA", "taxable")).toBe("taxable");
    expect(getTaxTreatment("401k", "tax-free")).toBe("tax-free");
  });

  it("returns auto-detected when override is undefined", () => {
    expect(getTaxTreatment("TFSA", undefined)).toBe("tax-free");
    expect(getTaxTreatment("401k", undefined)).toBe("tax-deferred");
  });
});

describe("URL state roundtrip — taxTreatment", () => {
  it("persists taxTreatment override in URL state", () => {
    const state = {
      ...INITIAL_STATE,
      assets: [
        { id: "a1", category: "Brokerage", amount: 10000, taxTreatment: "tax-free" as TaxTreatment },
      ],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded?.assets[0].taxTreatment).toBe("tax-free");
  });

  it("omits taxTreatment when not set (auto-detected)", () => {
    const state = {
      ...INITIAL_STATE,
      assets: [
        { id: "a1", category: "TFSA", amount: 10000 },
      ],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded?.assets[0].taxTreatment).toBeUndefined();
  });

  it("roundtrips all three override values", () => {
    const treatments: TaxTreatment[] = ["tax-free", "tax-deferred", "taxable"];
    for (const tt of treatments) {
      const state = {
        ...INITIAL_STATE,
        assets: [{ id: "a1", category: "Custom", amount: 5000, taxTreatment: tt }],
      };
      const decoded = decodeState(encodeState(state));
      expect(decoded?.assets[0].taxTreatment).toBe(tt);
    }
  });
});
