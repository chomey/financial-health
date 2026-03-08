import { describe, it, expect } from "vitest";
import {
  checkIncomeEligibility,
  getIncomeLimitDescription,
  getCreditCategories,
  getCreditCategoriesForFilingStatus,
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
      expect(desc).toContain("24,975");
      expect(desc).toContain("35,862");
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

describe("Tax Credits — Canadian categories (Task 141)", () => {
  describe("getCreditCategoriesForFilingStatus", () => {
    it("returns all CA categories for single filers", () => {
      const cats = getCreditCategoriesForFilingStatus("CA", "single");
      expect(cats.every((c) => c.jurisdiction === "CA")).toBe(true);
      expect(cats.every((c) => !c.infoOnly)).toBe(true);
    });

    it("excludes RRSP Deduction (info-only) for single filers", () => {
      const cats = getCreditCategoriesForFilingStatus("CA", "single");
      expect(cats.find((c) => c.name === "RRSP Deduction")).toBeUndefined();
    });

    it("excludes Spousal Amount Credit for single filers", () => {
      const cats = getCreditCategoriesForFilingStatus("CA", "single");
      expect(cats.find((c) => c.name === "Spousal Amount Credit")).toBeUndefined();
    });

    it("includes Spousal Amount Credit for married-common-law filers", () => {
      const cats = getCreditCategoriesForFilingStatus("CA", "married-common-law");
      expect(cats.find((c) => c.name === "Spousal Amount Credit")).toBeDefined();
    });

    it("includes all non-spouse-only CA credits for married-common-law filers", () => {
      const cats = getCreditCategoriesForFilingStatus("CA", "married-common-law");
      const names = cats.map((c) => c.name);
      expect(names).toContain("Disability Tax Credit (DTC)");
      expect(names).toContain("Canada Caregiver Credit");
      expect(names).toContain("Medical Expense Tax Credit");
      expect(names).toContain("Home Accessibility Tax Credit");
      expect(names).toContain("Canada Workers Benefit (CWB)");
      expect(names).toContain("GST/HST Credit");
      expect(names).toContain("Canada Child Benefit (CCB)");
      expect(names).toContain("Climate Action Incentive");
      expect(names).toContain("Canada Training Credit");
      expect(names).toContain("Moving Expenses Deduction");
      expect(names).toContain("Child Care Expenses Deduction");
      expect(names).toContain("Union & Professional Dues");
      expect(names).toContain("Northern Residents Deduction");
    });

    it("returns no US categories for CA", () => {
      const cats = getCreditCategoriesForFilingStatus("CA", "single");
      expect(cats.every((c) => c.jurisdiction === "CA")).toBe(true);
    });

    it("works for US filing statuses too", () => {
      const cats = getCreditCategoriesForFilingStatus("US", "married-jointly");
      expect(cats.every((c) => c.jurisdiction === "US")).toBe(true);
      expect(cats.length).toBeGreaterThan(0);
    });
  });

  describe("CA category income limits", () => {
    it("DTC has no income limits — always eligible", () => {
      const dtc = findCreditCategory("Disability Tax Credit (DTC)", "CA")!;
      expect(checkIncomeEligibility(dtc, 500000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(dtc, 500000, "married-common-law")).toBe("eligible");
    });

    it("Spousal Amount Credit has no income limits on user's income", () => {
      const spousal = findCreditCategory("Spousal Amount Credit", "CA")!;
      expect(spousal).toBeDefined();
      expect(spousal.requiresSpouse).toBe(true);
      expect(checkIncomeEligibility(spousal, 200000, "married-common-law")).toBe("eligible");
    });

    it("Home Accessibility Tax Credit has no income limits", () => {
      const hac = findCreditCategory("Home Accessibility Tax Credit", "CA")!;
      expect(hac).toBeDefined();
      expect(checkIncomeEligibility(hac, 999999, "single")).toBe("eligible");
    });

    it("CWB uses different thresholds for single vs married", () => {
      const cwb = findCreditCategory("Canada Workers Benefit (CWB)", "CA")!;
      // single: phaseOutStart 24975, phaseOutEnd 35862
      expect(checkIncomeEligibility(cwb, 20000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(cwb, 28000, "single")).toBe("reduced");
      expect(checkIncomeEligibility(cwb, 40000, "single")).toBe("ineligible");
      // married-common-law: phaseOutStart 28494, phaseOutEnd 47247
      expect(checkIncomeEligibility(cwb, 25000, "married-common-law")).toBe("eligible");
      expect(checkIncomeEligibility(cwb, 30000, "married-common-law")).toBe("reduced");
      expect(checkIncomeEligibility(cwb, 50000, "married-common-law")).toBe("ineligible");
    });

    it("GST/HST Credit has phase-out thresholds for single and married", () => {
      const gst = findCreditCategory("GST/HST Credit", "CA")!;
      expect(checkIncomeEligibility(gst, 40000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(gst, 50000, "single")).toBe("reduced");
      expect(checkIncomeEligibility(gst, 57000, "single")).toBe("ineligible");
      expect(checkIncomeEligibility(gst, 40000, "married-common-law")).toBe("eligible");
      expect(checkIncomeEligibility(gst, 50000, "married-common-law")).toBe("reduced");
    });

    it("Canada Training Credit has a hard cap at $154,534", () => {
      const ctc = findCreditCategory("Canada Training Credit", "CA")!;
      expect(checkIncomeEligibility(ctc, 100000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(ctc, 160000, "single")).toBe("ineligible");
      expect(checkIncomeEligibility(ctc, 160000, "married-common-law")).toBe("ineligible");
    });

    it("Climate Action Incentive is not income-tested", () => {
      const cai = findCreditCategory("Climate Action Incentive", "CA")!;
      expect(cai).toBeDefined();
      expect(checkIncomeEligibility(cai, 60000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(cai, 200000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(cai, 200000, "married-common-law")).toBe("eligible");
    });

    it("Moving Expenses Deduction has no income limits", () => {
      const mov = findCreditCategory("Moving Expenses Deduction", "CA")!;
      expect(mov).toBeDefined();
      expect(checkIncomeEligibility(mov, 999999, "single")).toBe("eligible");
    });

    it("Union & Professional Dues have no income limits", () => {
      const dues = findCreditCategory("Union & Professional Dues", "CA")!;
      expect(dues).toBeDefined();
      expect(dues.type).toBe("deduction");
      expect(checkIncomeEligibility(dues, 999999, "single")).toBe("eligible");
    });

    it("Northern Residents Deduction has no income limits", () => {
      const nrd = findCreditCategory("Northern Residents Deduction", "CA")!;
      expect(nrd).toBeDefined();
      expect(nrd.type).toBe("deduction");
      expect(checkIncomeEligibility(nrd, 999999, "single")).toBe("eligible");
    });

    it("Canada Caregiver Credit has no user income limits", () => {
      const ccc = findCreditCategory("Canada Caregiver Credit", "CA")!;
      expect(ccc).toBeDefined();
      expect(ccc.type).toBe("non-refundable");
      expect(checkIncomeEligibility(ccc, 999999, "single")).toBe("eligible");
    });

    it("CCB phases out at $36,502 for both filing statuses", () => {
      const ccb = findCreditCategory("Canada Child Benefit (CCB)", "CA")!;
      expect(checkIncomeEligibility(ccb, 30000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(ccb, 40000, "single")).toBe("reduced");
      expect(checkIncomeEligibility(ccb, 30000, "married-common-law")).toBe("eligible");
      expect(checkIncomeEligibility(ccb, 40000, "married-common-law")).toBe("reduced");
    });
  });
});

describe("Tax Credits — US categories (Task 142)", () => {
  describe("getCreditCategoriesForFilingStatus — US", () => {
    it("returns only US categories for US jurisdiction", () => {
      const cats = getCreditCategoriesForFilingStatus("US", "single");
      expect(cats.every((c) => c.jurisdiction === "US")).toBe(true);
    });

    it("excludes info-only entries (Standard Deduction, HSA, Mortgage, SSDI)", () => {
      const cats = getCreditCategoriesForFilingStatus("US", "single");
      const names = cats.map((c) => c.name);
      expect(names).not.toContain("Standard Deduction");
      expect(names).not.toContain("HSA Deduction");
      expect(names).not.toContain("Mortgage Interest Deduction");
      expect(names).not.toContain("SSDI/SSI Benefits");
    });

    it("includes all new US credits for single filers", () => {
      const cats = getCreditCategoriesForFilingStatus("US", "single");
      const names = cats.map((c) => c.name);
      expect(names).toContain("Earned Income Tax Credit (EITC)");
      expect(names).toContain("Child Tax Credit");
      expect(names).toContain("Child and Dependent Care Credit");
      expect(names).toContain("American Opportunity Tax Credit (AOTC)");
      expect(names).toContain("Lifetime Learning Credit");
      expect(names).toContain("Saver's Credit");
      expect(names).toContain("Premium Tax Credit");
      expect(names).toContain("Adoption Credit");
      expect(names).toContain("Residential Clean Energy Credit");
      expect(names).toContain("Electric Vehicle Credit");
      expect(names).toContain("State and Local Tax (SALT) Deduction");
      expect(names).toContain("Student Loan Interest Deduction");
      expect(names).toContain("Charitable Contributions Deduction");
    });

    it("includes all US credits for married-jointly filers", () => {
      const cats = getCreditCategoriesForFilingStatus("US", "married-jointly");
      const names = cats.map((c) => c.name);
      expect(names).toContain("Child Tax Credit");
      expect(names).toContain("Earned Income Tax Credit (EITC)");
      expect(names).toContain("Child and Dependent Care Credit");
    });

    it("includes all US credits for married-separately filers (MFS still has categories, just ineligible for some)", () => {
      const cats = getCreditCategoriesForFilingStatus("US", "married-separately");
      expect(cats.length).toBeGreaterThan(0);
      // These are present but marked ineligible via incomeLimits
      const names = cats.map((c) => c.name);
      expect(names).toContain("Child Tax Credit");
      expect(names).toContain("Electric Vehicle Credit");
    });

    it("includes all US credits for head-of-household filers", () => {
      const cats = getCreditCategoriesForFilingStatus("US", "head-of-household");
      const names = cats.map((c) => c.name);
      expect(names).toContain("Earned Income Tax Credit (EITC)");
      expect(names).toContain("Saver's Credit");
    });
  });

  describe("US income eligibility — per filing status", () => {
    it("EITC: eligible for single below $21,370", () => {
      const eitc = findCreditCategory("Earned Income Tax Credit (EITC)", "US")!;
      expect(checkIncomeEligibility(eitc, 15000, "single")).toBe("eligible");
    });

    it("EITC: reduced for single between $21,370 and $59,899", () => {
      const eitc = findCreditCategory("Earned Income Tax Credit (EITC)", "US")!;
      expect(checkIncomeEligibility(eitc, 30000, "single")).toBe("reduced");
    });

    it("EITC: ineligible for single above $59,899", () => {
      const eitc = findCreditCategory("Earned Income Tax Credit (EITC)", "US")!;
      expect(checkIncomeEligibility(eitc, 65000, "single")).toBe("ineligible");
    });

    it("EITC: ineligible for married-separately regardless of income", () => {
      const eitc = findCreditCategory("Earned Income Tax Credit (EITC)", "US")!;
      expect(checkIncomeEligibility(eitc, 10000, "married-separately")).toBe("ineligible");
    });

    it("EITC: MFJ has higher thresholds than single", () => {
      const eitc = findCreditCategory("Earned Income Tax Credit (EITC)", "US")!;
      expect(checkIncomeEligibility(eitc, 20000, "married-jointly")).toBe("eligible");
      expect(checkIncomeEligibility(eitc, 50000, "married-jointly")).toBe("reduced");
      expect(checkIncomeEligibility(eitc, 70000, "married-jointly")).toBe("ineligible");
    });

    it("Child Tax Credit: phases out at $200k single, $400k MFJ", () => {
      const ctc = findCreditCategory("Child Tax Credit", "US")!;
      expect(checkIncomeEligibility(ctc, 150000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(ctc, 250000, "single")).toBe("reduced");
      expect(checkIncomeEligibility(ctc, 350000, "married-jointly")).toBe("eligible");
      expect(checkIncomeEligibility(ctc, 450000, "married-jointly")).toBe("reduced");
    });

    it("Child and Dependent Care Credit: ineligible for MFS", () => {
      const cdcc = findCreditCategory("Child and Dependent Care Credit", "US")!;
      expect(cdcc).toBeDefined();
      expect(cdcc.type).toBe("non-refundable");
      expect(checkIncomeEligibility(cdcc, 5000, "married-separately")).toBe("ineligible");
    });

    it("Child and Dependent Care Credit: phases out above $15,000 for single/MFJ", () => {
      const cdcc = findCreditCategory("Child and Dependent Care Credit", "US")!;
      expect(checkIncomeEligibility(cdcc, 10000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(cdcc, 20000, "single")).toBe("reduced");
    });

    it("AOTC: phases out $80k–$90k single, $160k–$180k MFJ", () => {
      const aotc = findCreditCategory("American Opportunity Tax Credit (AOTC)", "US")!;
      expect(checkIncomeEligibility(aotc, 70000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(aotc, 85000, "single")).toBe("reduced");
      expect(checkIncomeEligibility(aotc, 95000, "single")).toBe("ineligible");
      expect(checkIncomeEligibility(aotc, 85000, "married-jointly")).toBe("eligible");
      expect(checkIncomeEligibility(aotc, 170000, "married-jointly")).toBe("reduced");
      expect(checkIncomeEligibility(aotc, 190000, "married-jointly")).toBe("ineligible");
    });

    it("AOTC: ineligible for MFS", () => {
      const aotc = findCreditCategory("American Opportunity Tax Credit (AOTC)", "US")!;
      expect(checkIncomeEligibility(aotc, 10000, "married-separately")).toBe("ineligible");
    });

    it("Lifetime Learning Credit: same thresholds as AOTC, ineligible for MFS", () => {
      const llc = findCreditCategory("Lifetime Learning Credit", "US")!;
      expect(checkIncomeEligibility(llc, 70000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(llc, 85000, "single")).toBe("reduced");
      expect(checkIncomeEligibility(llc, 95000, "single")).toBe("ineligible");
      expect(checkIncomeEligibility(llc, 10000, "married-separately")).toBe("ineligible");
    });

    it("Saver's Credit: hard caps per filing status", () => {
      const sc = findCreditCategory("Saver's Credit", "US")!;
      expect(checkIncomeEligibility(sc, 35000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(sc, 40000, "single")).toBe("ineligible");
      expect(checkIncomeEligibility(sc, 50000, "head-of-household")).toBe("eligible");
      expect(checkIncomeEligibility(sc, 60000, "head-of-household")).toBe("ineligible");
      expect(checkIncomeEligibility(sc, 70000, "married-jointly")).toBe("eligible");
      expect(checkIncomeEligibility(sc, 80000, "married-jointly")).toBe("ineligible");
    });

    it("Premium Tax Credit: no hard income cap", () => {
      const ptc = findCreditCategory("Premium Tax Credit", "US")!;
      expect(ptc).toBeDefined();
      expect(ptc.type).toBe("refundable");
      // No income limits defined — always returns eligible
      expect(checkIncomeEligibility(ptc, 500000, "single")).toBe("eligible");
    });

    it("Adoption Credit: phases out $259k–$299k, ineligible for MFS", () => {
      const ac = findCreditCategory("Adoption Credit", "US")!;
      expect(ac).toBeDefined();
      expect(ac.type).toBe("non-refundable");
      expect(checkIncomeEligibility(ac, 200000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(ac, 260000, "single")).toBe("reduced");
      expect(checkIncomeEligibility(ac, 300000, "single")).toBe("ineligible");
      expect(checkIncomeEligibility(ac, 10000, "married-separately")).toBe("ineligible");
    });

    it("Residential Clean Energy Credit: no income limit", () => {
      const rec = findCreditCategory("Residential Clean Energy Credit", "US")!;
      expect(checkIncomeEligibility(rec, 1000000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(rec, 1000000, "married-jointly")).toBe("eligible");
    });

    it("Electric Vehicle Credit: hard caps by filing status", () => {
      const ev = findCreditCategory("Electric Vehicle Credit", "US")!;
      expect(checkIncomeEligibility(ev, 100000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(ev, 160000, "single")).toBe("ineligible");
      expect(checkIncomeEligibility(ev, 200000, "head-of-household")).toBe("eligible");
      expect(checkIncomeEligibility(ev, 230000, "head-of-household")).toBe("ineligible");
      expect(checkIncomeEligibility(ev, 280000, "married-jointly")).toBe("eligible");
      expect(checkIncomeEligibility(ev, 310000, "married-jointly")).toBe("ineligible");
    });

    it("SALT Deduction: MFS has hardCap of $5,000", () => {
      const salt = findCreditCategory("State and Local Tax (SALT) Deduction", "US")!;
      expect(salt).toBeDefined();
      expect(salt.type).toBe("deduction");
      // MFS: hardCap 5000
      expect(checkIncomeEligibility(salt, 5001, "married-separately")).toBe("ineligible");
      // Single: no income limits defined
      expect(checkIncomeEligibility(salt, 999999, "single")).toBe("eligible");
    });

    it("Student Loan Interest Deduction: phases out $85k–$100k and ineligible for MFS", () => {
      const slid = findCreditCategory("Student Loan Interest Deduction", "US")!;
      expect(checkIncomeEligibility(slid, 80000, "single")).toBe("eligible");
      expect(checkIncomeEligibility(slid, 90000, "single")).toBe("reduced");
      expect(checkIncomeEligibility(slid, 105000, "single")).toBe("ineligible");
      expect(checkIncomeEligibility(slid, 10000, "married-separately")).toBe("ineligible");
    });

    it("Charitable Contributions Deduction: no income cap", () => {
      const ccd = findCreditCategory("Charitable Contributions Deduction", "US")!;
      expect(ccd).toBeDefined();
      expect(ccd.type).toBe("deduction");
      expect(checkIncomeEligibility(ccd, 1000000, "single")).toBe("eligible");
    });
  });

  describe("US income limit descriptions", () => {
    it("EITC: describes ineligibility for MFS", () => {
      const eitc = findCreditCategory("Earned Income Tax Credit (EITC)", "US")!;
      const desc = getIncomeLimitDescription(eitc, "married-separately");
      expect(desc).toContain("Not available");
    });

    it("AOTC: describes phase-out range for single", () => {
      const aotc = findCreditCategory("American Opportunity Tax Credit (AOTC)", "US")!;
      const desc = getIncomeLimitDescription(aotc, "single");
      expect(desc).toContain("80,000");
      expect(desc).toContain("90,000");
    });

    it("Saver's Credit: describes hard cap for single", () => {
      const sc = findCreditCategory("Saver's Credit", "US")!;
      const desc = getIncomeLimitDescription(sc, "single");
      expect(desc).toContain("39,500");
    });

    it("Adoption Credit: describes phase-out for single", () => {
      const ac = findCreditCategory("Adoption Credit", "US")!;
      const desc = getIncomeLimitDescription(ac, "single");
      expect(desc).toContain("259,190");
      expect(desc).toContain("299,190");
    });

    it("Residential Clean Energy Credit: no income limit description", () => {
      const rec = findCreditCategory("Residential Clean Energy Credit", "US")!;
      expect(getIncomeLimitDescription(rec, "single")).toBeNull();
    });
  });

  describe("getAllCreditCategories — US info-only entries", () => {
    it("includes Standard Deduction as info-only", () => {
      const cats = getAllCreditCategories("US");
      const sd = cats.find((c) => c.name === "Standard Deduction");
      expect(sd).toBeDefined();
      expect(sd!.infoOnly).toBe(true);
      expect(sd!.type).toBe("deduction");
    });

    it("includes SSDI/SSI Benefits as info-only", () => {
      const cats = getAllCreditCategories("US");
      const ssdi = cats.find((c) => c.name === "SSDI/SSI Benefits");
      expect(ssdi).toBeDefined();
      expect(ssdi!.infoOnly).toBe(true);
    });

    it("includes Mortgage Interest Deduction as info-only", () => {
      const cats = getAllCreditCategories("US");
      const mid = cats.find((c) => c.name === "Mortgage Interest Deduction");
      expect(mid).toBeDefined();
      expect(mid!.infoOnly).toBe(true);
    });

    it("includes HSA Deduction as info-only", () => {
      const cats = getAllCreditCategories("US");
      const hsa = cats.find((c) => c.name === "HSA Deduction");
      expect(hsa).toBeDefined();
      expect(hsa!.infoOnly).toBe(true);
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
