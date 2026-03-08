import { describe, it, expect } from "vitest";
import {
  findCreditCategory,
  getCreditCategories,
  getAllCreditCategories,
} from "@/lib/tax-credits";
import {
  CA_FEDERAL_2025,
  CA_FEDERAL_2026,
  getCanadianBrackets,
} from "@/lib/tax-tables";

describe("Task 154 — Canadian tax credit/bracket validation (2025/2026)", () => {
  describe("CA federal brackets 2025", () => {
    it("has correct 2025 bracket thresholds", () => {
      const b = CA_FEDERAL_2025.brackets;
      expect(b[0]).toEqual({ min: 0, max: 57_375, rate: 0.15 });
      expect(b[1]).toEqual({ min: 57_375, max: 114_750, rate: 0.205 });
      expect(b[2]).toEqual({ min: 114_750, max: 158_468, rate: 0.26 });
      expect(b[3]).toEqual({ min: 158_468, max: 220_000, rate: 0.29 });
      expect(b[4]).toEqual({ min: 220_000, max: Infinity, rate: 0.33 });
    });

    it("has correct 2025 BPA ($16,129)", () => {
      expect(CA_FEDERAL_2025.basicPersonalAmount).toBe(16_129);
    });
  });

  describe("CA federal brackets 2026", () => {
    it("2026 brackets are inflation-indexed from 2025 (~2.7%)", () => {
      expect(CA_FEDERAL_2026.brackets[0].max).toBe(58_924);
      expect(CA_FEDERAL_2026.basicPersonalAmount).toBe(16_564);
    });
  });

  describe("getCanadianBrackets returns year-appropriate tables", () => {
    it("returns 2025 tables by default", () => {
      const { federal } = getCanadianBrackets("ON");
      expect(federal.basicPersonalAmount).toBe(16_129);
    });

    it("returns 2026 tables when requested", () => {
      const { federal } = getCanadianBrackets("ON", 2026);
      expect(federal.basicPersonalAmount).toBe(16_564);
    });
  });

  describe("Disability Tax Credit (DTC)", () => {
    it("2025: maxAmount is $10,138", () => {
      const dtc = findCreditCategory("Disability Tax Credit (DTC)", "CA", 2025);
      expect(dtc).toBeDefined();
      expect(dtc!.maxAmount).toBe(10_138);
    });

    it("2025: description mentions $10,138 and $5,914 supplement", () => {
      const dtc = findCreditCategory("Disability Tax Credit (DTC)", "CA", 2025);
      expect(dtc!.description).toContain("$10,138");
      expect(dtc!.description).toContain("$5,914");
    });

    it("2026: maxAmount is $10,412 (indexed)", () => {
      const dtc = findCreditCategory("Disability Tax Credit (DTC)", "CA", 2026);
      expect(dtc!.maxAmount).toBe(10_412);
    });

    it("2026: description mentions $10,412 and $6,074 supplement", () => {
      const dtc = findCreditCategory("Disability Tax Credit (DTC)", "CA", 2026);
      expect(dtc!.description).toContain("$10,412");
      expect(dtc!.description).toContain("$6,074");
    });
  });

  describe("Spousal Amount Credit", () => {
    it("2025: maxAmount is $2,419 (15% of BPA $16,129)", () => {
      const credit = findCreditCategory("Spousal Amount Credit", "CA", 2025);
      expect(credit).toBeDefined();
      expect(credit!.maxAmount).toBe(2_419);
    });

    it("2025: description mentions $16,129 threshold", () => {
      const credit = findCreditCategory("Spousal Amount Credit", "CA", 2025);
      expect(credit!.description).toContain("$16,129");
    });

    it("2026: maxAmount is $2,485 (indexed)", () => {
      const credit = findCreditCategory("Spousal Amount Credit", "CA", 2026);
      expect(credit!.maxAmount).toBe(2_485);
    });
  });

  describe("Canada Caregiver Credit", () => {
    it("2025: maxAmount is $8,601", () => {
      const credit = findCreditCategory("Canada Caregiver Credit", "CA", 2025);
      expect(credit).toBeDefined();
      expect(credit!.maxAmount).toBe(8_601);
    });

    it("2025: description mentions $20,197 dependant threshold", () => {
      const credit = findCreditCategory("Canada Caregiver Credit", "CA", 2025);
      expect(credit!.description).toContain("$20,197");
    });

    it("2026: maxAmount is $8,833 (indexed)", () => {
      const credit = findCreditCategory("Canada Caregiver Credit", "CA", 2026);
      expect(credit!.maxAmount).toBe(8_833);
    });
  });

  describe("Canada Workers Benefit (CWB)", () => {
    it("2025: maxAmount is $1,633 (single)", () => {
      const cwb = findCreditCategory("Canada Workers Benefit (CWB)", "CA", 2025);
      expect(cwb).toBeDefined();
      expect(cwb!.maxAmount).toBe(1_633);
    });

    it("2025: description mentions $2,813 family amount", () => {
      const cwb = findCreditCategory("Canada Workers Benefit (CWB)", "CA", 2025);
      expect(cwb!.description).toContain("$2,813");
    });

    it("2025: single phase-out $24,975–$35,862", () => {
      const cwb = findCreditCategory("Canada Workers Benefit (CWB)", "CA", 2025);
      expect(cwb!.incomeLimits.single).toEqual({
        phaseOutStart: 24_975,
        phaseOutEnd: 35_862,
      });
    });

    it("2025: married phase-out $28,494–$47,247", () => {
      const cwb = findCreditCategory("Canada Workers Benefit (CWB)", "CA", 2025);
      expect(cwb!.incomeLimits["married-common-law"]).toEqual({
        phaseOutStart: 28_494,
        phaseOutEnd: 47_247,
      });
    });

    it("2026: maxAmount is $1,677 (indexed)", () => {
      const cwb = findCreditCategory("Canada Workers Benefit (CWB)", "CA", 2026);
      expect(cwb!.maxAmount).toBe(1_677);
    });

    it("2026: phase-out thresholds are indexed", () => {
      const cwb = findCreditCategory("Canada Workers Benefit (CWB)", "CA", 2026);
      expect(cwb!.incomeLimits.single!.phaseOutStart).toBe(25_649);
      expect(cwb!.incomeLimits["married-common-law"]!.phaseOutStart).toBe(29_263);
    });
  });

  describe("GST/HST Credit", () => {
    it("2025: maxAmount is $533", () => {
      const gst = findCreditCategory("GST/HST Credit", "CA", 2025);
      expect(gst).toBeDefined();
      expect(gst!.maxAmount).toBe(533);
    });

    it("2025: single phase-out ends at $56,181", () => {
      const gst = findCreditCategory("GST/HST Credit", "CA", 2025);
      expect(gst!.incomeLimits.single!.phaseOutEnd).toBe(56_181);
    });

    it("2026: maxAmount is $547 (indexed)", () => {
      const gst = findCreditCategory("GST/HST Credit", "CA", 2026);
      expect(gst!.maxAmount).toBe(547);
    });
  });

  describe("Canada Child Benefit (CCB)", () => {
    it("2025: maxAmount is $7,997 (per child under 6)", () => {
      const ccb = findCreditCategory("Canada Child Benefit (CCB)", "CA", 2025);
      expect(ccb).toBeDefined();
      expect(ccb!.maxAmount).toBe(7_997);
    });

    it("2025: description mentions $6,748 for ages 6–17", () => {
      const ccb = findCreditCategory("Canada Child Benefit (CCB)", "CA", 2025);
      expect(ccb!.description).toContain("$6,748");
    });

    it("2025: phase-out starts at $37,487", () => {
      const ccb = findCreditCategory("Canada Child Benefit (CCB)", "CA", 2025);
      expect(ccb!.incomeLimits.single!.phaseOutStart).toBe(37_487);
      expect(ccb!.incomeLimits["married-common-law"]!.phaseOutStart).toBe(37_487);
    });

    it("2026: maxAmount is $8,213 (indexed)", () => {
      const ccb = findCreditCategory("Canada Child Benefit (CCB)", "CA", 2026);
      expect(ccb!.maxAmount).toBe(8_213);
    });

    it("2026: phase-out starts at $38,499", () => {
      const ccb = findCreditCategory("Canada Child Benefit (CCB)", "CA", 2026);
      expect(ccb!.incomeLimits.single!.phaseOutStart).toBe(38_499);
    });
  });

  describe("Medical Expense Tax Credit", () => {
    it("2025: description mentions $2,833 threshold", () => {
      const med = findCreditCategory("Medical Expense Tax Credit", "CA", 2025);
      expect(med).toBeDefined();
      expect(med!.description).toContain("$2,833");
    });

    it("2026: description mentions $2,910 threshold", () => {
      const med = findCreditCategory("Medical Expense Tax Credit", "CA", 2026);
      expect(med!.description).toContain("$2,910");
    });
  });

  describe("Canada Training Credit", () => {
    it("2025: hardCap is $154,534", () => {
      const ctc = findCreditCategory("Canada Training Credit", "CA", 2025);
      expect(ctc).toBeDefined();
      expect(ctc!.incomeLimits.single!.hardCap).toBe(154_534);
    });

    it("2026: hardCap is indexed to $158,706", () => {
      const ctc = findCreditCategory("Canada Training Credit", "CA", 2026);
      expect(ctc!.incomeLimits.single!.hardCap).toBe(158_706);
    });
  });

  describe("Climate Action Incentive", () => {
    it("is not income-tested (no income limits)", () => {
      const cai = findCreditCategory("Climate Action Incentive", "CA", 2025);
      expect(cai).toBeDefined();
      expect(Object.keys(cai!.incomeLimits)).toHaveLength(0);
    });
  });

  describe("All CA credits resolve for both years", () => {
    it("all 2025 CA credits have valid data", () => {
      const cats = getCreditCategories("CA", 2025);
      expect(cats.length).toBeGreaterThan(0);
      for (const c of cats) {
        expect(c.jurisdiction).toBe("CA");
        expect(c.name).toBeTruthy();
        expect(["refundable", "non-refundable", "deduction"]).toContain(c.type);
      }
    });

    it("all 2026 CA credits have valid data", () => {
      const cats = getCreditCategories("CA", 2026);
      expect(cats.length).toBeGreaterThan(0);
      for (const c of cats) {
        expect(c.jurisdiction).toBe("CA");
        expect(c.name).toBeTruthy();
      }
    });

    it("2026 maxAmounts are >= 2025 maxAmounts (inflation indexed)", () => {
      const cats2025 = getAllCreditCategories("CA", 2025);
      const cats2026 = getAllCreditCategories("CA", 2026);
      for (const c25 of cats2025) {
        if (c25.maxAmount && c25.maxAmount > 0) {
          const c26 = cats2026.find((c) => c.name === c25.name);
          expect(c26).toBeDefined();
          // 2026 should be >= 2025 (inflation indexing)
          expect(c26!.maxAmount).toBeGreaterThanOrEqual(c25.maxAmount);
        }
      }
    });
  });
});
