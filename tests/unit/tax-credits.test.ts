import { describe, it, expect } from "vitest";
import {
  checkIncomeEligibility,
  getIncomeLimitDescription,
  getCreditCategories,
  getAllCreditCategories,
  findCreditCategory,
  getFilingStatuses,
  getDefaultFilingStatus,
  type FilingStatus,
} from "@/lib/tax-credits";
import { encodeState, decodeState } from "@/lib/url-state";
import type { FinancialState } from "@/lib/financial-state";

describe("Tax Credits — data model", () => {
  describe("getFilingStatuses", () => {
    it("returns US filing statuses", () => {
      const statuses = getFilingStatuses("US");
      expect(statuses).toHaveLength(4);
      expect(statuses.map((s) => s.value)).toEqual([
        "single",
        "married-jointly",
        "married-separately",
        "head-of-household",
      ]);
    });

    it("returns Canadian filing statuses", () => {
      const statuses = getFilingStatuses("CA");
      expect(statuses).toHaveLength(2);
      expect(statuses.map((s) => s.value)).toEqual([
        "single",
        "married-common-law",
      ]);
    });
  });

  describe("getDefaultFilingStatus", () => {
    it("returns single for both countries", () => {
      expect(getDefaultFilingStatus("CA")).toBe("single");
      expect(getDefaultFilingStatus("US")).toBe("single");
    });
  });

  describe("getCreditCategories", () => {
    it("returns only CA categories for CA", () => {
      const cats = getCreditCategories("CA");
      expect(cats.length).toBeGreaterThan(0);
      expect(cats.every((c) => c.jurisdiction === "CA")).toBe(true);
    });

    it("returns only US categories for US", () => {
      const cats = getCreditCategories("US");
      expect(cats.length).toBeGreaterThan(0);
      expect(cats.every((c) => c.jurisdiction === "US")).toBe(true);
    });

    it("excludes info-only categories", () => {
      const caCats = getCreditCategories("CA");
      expect(caCats.find((c) => c.name === "RRSP Deduction")).toBeUndefined();

      const usCats = getCreditCategories("US");
      expect(usCats.find((c) => c.name === "HSA Deduction")).toBeUndefined();
    });
  });

  describe("getAllCreditCategories", () => {
    it("includes info-only categories", () => {
      const caCats = getAllCreditCategories("CA");
      expect(caCats.find((c) => c.name === "RRSP Deduction")).toBeDefined();
    });
  });

  describe("findCreditCategory", () => {
    it("finds a known CA category", () => {
      const cat = findCreditCategory("Disability Tax Credit (DTC)", "CA");
      expect(cat).toBeDefined();
      expect(cat!.type).toBe("non-refundable");
      expect(cat!.jurisdiction).toBe("CA");
    });

    it("finds a known US category", () => {
      const cat = findCreditCategory("Electric Vehicle Credit", "US");
      expect(cat).toBeDefined();
      expect(cat!.type).toBe("non-refundable");
    });

    it("returns undefined for wrong jurisdiction", () => {
      expect(findCreditCategory("Electric Vehicle Credit", "CA")).toBeUndefined();
    });
  });
});

describe("Tax Credits — income eligibility", () => {
  describe("checkIncomeEligibility", () => {
    it("returns eligible when no income limits defined", () => {
      const dtc = findCreditCategory("Disability Tax Credit (DTC)", "CA")!;
      expect(checkIncomeEligibility(dtc, 500000, "single")).toBe("eligible");
    });

    it("returns eligible when income is below phase-out start", () => {
      const cwb = findCreditCategory("Canada Workers Benefit (CWB)", "CA")!;
      expect(checkIncomeEligibility(cwb, 20000, "single")).toBe("eligible");
    });

    it("returns reduced when income is between phase-out start and end", () => {
      const cwb = findCreditCategory("Canada Workers Benefit (CWB)", "CA")!;
      expect(checkIncomeEligibility(cwb, 28000, "single")).toBe("reduced");
    });

    it("returns ineligible when income exceeds phase-out end", () => {
      const cwb = findCreditCategory("Canada Workers Benefit (CWB)", "CA")!;
      expect(checkIncomeEligibility(cwb, 40000, "single")).toBe("ineligible");
    });

    it("returns ineligible when income exceeds hard cap", () => {
      const ev = findCreditCategory("Electric Vehicle Credit", "US")!;
      expect(checkIncomeEligibility(ev, 200000, "single")).toBe("ineligible");
    });

    it("returns eligible when income is below hard cap", () => {
      const ev = findCreditCategory("Electric Vehicle Credit", "US")!;
      expect(checkIncomeEligibility(ev, 100000, "single")).toBe("eligible");
    });

    it("uses filing-status-specific thresholds", () => {
      const ev = findCreditCategory("Electric Vehicle Credit", "US")!;
      // Single: hardCap 150000
      expect(checkIncomeEligibility(ev, 160000, "single")).toBe("ineligible");
      // MFJ: hardCap 300000
      expect(checkIncomeEligibility(ev, 160000, "married-jointly")).toBe("eligible");
      expect(checkIncomeEligibility(ev, 310000, "married-jointly")).toBe("ineligible");
    });

    it("returns ineligible for filing statuses marked ineligible", () => {
      const eitc = findCreditCategory("Earned Income Tax Credit (EITC)", "US")!;
      expect(checkIncomeEligibility(eitc, 10000, "married-separately")).toBe("ineligible");
    });

    it("returns eligible for filing statuses not marked ineligible", () => {
      const eitc = findCreditCategory("Earned Income Tax Credit (EITC)", "US")!;
      expect(checkIncomeEligibility(eitc, 10000, "single")).toBe("eligible");
    });

    it("handles married-common-law thresholds for CA credits", () => {
      const cwb = findCreditCategory("Canada Workers Benefit (CWB)", "CA")!;
      // married-common-law: phaseOutStart 26805, phaseOutEnd 43212
      expect(checkIncomeEligibility(cwb, 25000, "married-common-law")).toBe("eligible");
      expect(checkIncomeEligibility(cwb, 30000, "married-common-law")).toBe("reduced");
      expect(checkIncomeEligibility(cwb, 50000, "married-common-law")).toBe("ineligible");
    });
  });

  describe("getIncomeLimitDescription", () => {
    it("returns null when no income limits", () => {
      const dtc = findCreditCategory("Disability Tax Credit (DTC)", "CA")!;
      expect(getIncomeLimitDescription(dtc, "single")).toBeNull();
    });

    it("describes phase-out range", () => {
      const cwb = findCreditCategory("Canada Workers Benefit (CWB)", "CA")!;
      const desc = getIncomeLimitDescription(cwb, "single");
      expect(desc).toContain("23,495");
      expect(desc).toContain("33,015");
    });

    it("describes hard cap", () => {
      const ev = findCreditCategory("Electric Vehicle Credit", "US")!;
      const desc = getIncomeLimitDescription(ev, "single");
      expect(desc).toContain("150,000");
    });

    it("describes ineligible filing status", () => {
      const eitc = findCreditCategory("Earned Income Tax Credit (EITC)", "US")!;
      const desc = getIncomeLimitDescription(eitc, "married-separately");
      expect(desc).toContain("Not available");
      expect(desc).toContain("Married Filing Separately");
    });
  });
});

describe("Tax Credits — URL state encoding", () => {
  const baseState: FinancialState = {
    assets: [{ id: "a1", category: "Savings", amount: 5000 }],
    debts: [],
    income: [{ id: "i1", category: "Salary", amount: 5000 }],
    expenses: [{ id: "e1", category: "Rent", amount: 1500 }],
    properties: [],
    stocks: [],
    country: "US",
    jurisdiction: "CA",
  };

  it("round-trips state without tax credits", () => {
    const encoded = encodeState(baseState);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.taxCredits).toEqual([]);
    expect(decoded!.filingStatus).toBeUndefined();
  });

  it("round-trips state with tax credits", () => {
    const state: FinancialState = {
      ...baseState,
      taxCredits: [
        { id: "tc1", category: "Child Tax Credit", annualAmount: 2000, type: "refundable" },
        { id: "tc2", category: "SALT Deduction", annualAmount: 10000, type: "deduction" },
      ],
      filingStatus: "married-jointly",
    };

    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.taxCredits).toHaveLength(2);
    expect(decoded!.taxCredits![0].category).toBe("Child Tax Credit");
    expect(decoded!.taxCredits![0].annualAmount).toBe(2000);
    expect(decoded!.taxCredits![0].type).toBe("refundable");
    expect(decoded!.taxCredits![1].category).toBe("SALT Deduction");
    expect(decoded!.taxCredits![1].annualAmount).toBe(10000);
    expect(decoded!.taxCredits![1].type).toBe("deduction");
    expect(decoded!.filingStatus).toBe("married-jointly");
  });

  it("round-trips empty tax credits array", () => {
    const state: FinancialState = {
      ...baseState,
      taxCredits: [],
      filingStatus: "single",
    };

    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded!.taxCredits).toEqual([]);
    expect(decoded!.filingStatus).toBe("single");
  });

  it("preserves credit IDs across round-trip (sequential)", () => {
    const state: FinancialState = {
      ...baseState,
      taxCredits: [
        { id: "tc-original", category: "EV Credit", annualAmount: 7500, type: "non-refundable" },
      ],
    };

    const decoded = decodeState(encodeState(state));
    // IDs are regenerated sequentially on decode
    expect(decoded!.taxCredits![0].id).toBe("tc1");
    expect(decoded!.taxCredits![0].category).toBe("EV Credit");
  });

  it("preserves all credit types", () => {
    const state: FinancialState = {
      ...baseState,
      taxCredits: [
        { id: "tc1", category: "A", annualAmount: 100, type: "refundable" },
        { id: "tc2", category: "B", annualAmount: 200, type: "non-refundable" },
        { id: "tc3", category: "C", annualAmount: 300, type: "deduction" },
      ],
    };

    const decoded = decodeState(encodeState(state));
    expect(decoded!.taxCredits!.map((tc) => tc.type)).toEqual([
      "refundable",
      "non-refundable",
      "deduction",
    ]);
  });

  it("backward compatible — decodes state without tc/fs fields", () => {
    // Encode a state without tax credits, then verify it decodes cleanly
    const encoded = encodeState(baseState);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    // taxCredits defaults to empty array
    expect(decoded!.taxCredits).toEqual([]);
  });
});
