import { describe, it, expect } from "vitest";
import {
  findCreditCategory,
  getCreditCategories,
  getAllCreditCategories,
} from "@/lib/tax-credits";
import {
  US_FEDERAL_2025,
  US_FEDERAL_2026,
  US_CAPITAL_GAINS_2025,
  US_CAPITAL_GAINS_2026,
  getUSBrackets,
} from "@/lib/tax-tables";

describe("Task 155 — US tax credit/bracket validation (2025/2026)", () => {
  describe("US federal brackets 2025", () => {
    it("has correct 2025 bracket thresholds (Single)", () => {
      const b = US_FEDERAL_2025.brackets;
      expect(b[0]).toEqual({ min: 0, max: 11_925, rate: 0.10 });
      expect(b[1]).toEqual({ min: 11_925, max: 48_475, rate: 0.12 });
      expect(b[2]).toEqual({ min: 48_475, max: 103_350, rate: 0.22 });
      expect(b[3]).toEqual({ min: 103_350, max: 197_300, rate: 0.24 });
      expect(b[4]).toEqual({ min: 197_300, max: 250_525, rate: 0.32 });
      expect(b[5]).toEqual({ min: 250_525, max: 626_350, rate: 0.35 });
      expect(b[6]).toEqual({ min: 626_350, max: Infinity, rate: 0.37 });
    });

    it("has correct 2025 standard deduction ($15,000 single)", () => {
      expect(US_FEDERAL_2025.basicPersonalAmount).toBe(15_000);
    });
  });

  describe("US federal brackets 2026", () => {
    it("2026 brackets are inflation-indexed from 2025 (~2.8%)", () => {
      expect(US_FEDERAL_2026.brackets[0].max).toBe(12_259);
      expect(US_FEDERAL_2026.basicPersonalAmount).toBe(15_420);
    });
  });

  describe("US capital gains brackets", () => {
    it("2025: correct thresholds", () => {
      const b = US_CAPITAL_GAINS_2025.brackets;
      expect(b[0]).toEqual({ min: 0, max: 48_350, rate: 0.00 });
      expect(b[1]).toEqual({ min: 48_350, max: 533_400, rate: 0.15 });
      expect(b[2]).toEqual({ min: 533_400, max: Infinity, rate: 0.20 });
    });

    it("2026: inflation-indexed thresholds", () => {
      const b = US_CAPITAL_GAINS_2026.brackets;
      expect(b[0]).toEqual({ min: 0, max: 49_703, rate: 0.00 });
      expect(b[1]).toEqual({ min: 49_703, max: 548_334, rate: 0.15 });
      expect(b[2]).toEqual({ min: 548_334, max: Infinity, rate: 0.20 });
    });
  });

  describe("getUSBrackets returns year-appropriate tables", () => {
    it("returns 2025 tables by default", () => {
      const { federal } = getUSBrackets("CA");
      expect(federal.basicPersonalAmount).toBe(15_000);
    });

    it("returns 2026 tables when requested", () => {
      const { federal } = getUSBrackets("CA", 2026);
      expect(federal.basicPersonalAmount).toBe(15_420);
    });
  });

  describe("Earned Income Tax Credit (EITC)", () => {
    it("2025: maxAmount is $8,046 (3+ children)", () => {
      const eitc = findCreditCategory("Earned Income Tax Credit (EITC)", "US", 2025);
      expect(eitc).toBeDefined();
      expect(eitc!.maxAmount).toBe(8_046);
    });

    it("2025: description mentions $8,046 and correct phase-outs", () => {
      const eitc = findCreditCategory("Earned Income Tax Credit (EITC)", "US", 2025);
      expect(eitc!.description).toContain("$8,046");
      expect(eitc!.description).toContain("$21,370");
      expect(eitc!.description).toContain("$59,899");
      expect(eitc!.description).toContain("$28,120");
      expect(eitc!.description).toContain("$66,819");
    });

    it("2025: phase-out thresholds for single", () => {
      const eitc = findCreditCategory("Earned Income Tax Credit (EITC)", "US", 2025);
      expect(eitc!.incomeLimits.single?.phaseOutStart).toBe(21_370);
      expect(eitc!.incomeLimits.single?.phaseOutEnd).toBe(59_899);
    });

    it("2025: phase-out thresholds for MFJ", () => {
      const eitc = findCreditCategory("Earned Income Tax Credit (EITC)", "US", 2025);
      expect(eitc!.incomeLimits["married-jointly"]?.phaseOutStart).toBe(28_120);
      expect(eitc!.incomeLimits["married-jointly"]?.phaseOutEnd).toBe(66_819);
    });

    it("2025: ineligible for MFS", () => {
      const eitc = findCreditCategory("Earned Income Tax Credit (EITC)", "US", 2025);
      expect(eitc!.incomeLimits["married-separately"]?.ineligible).toBe(true);
    });

    it("2026: maxAmount is $8,271 (inflation-indexed)", () => {
      const eitc = findCreditCategory("Earned Income Tax Credit (EITC)", "US", 2026);
      expect(eitc!.maxAmount).toBe(8_271);
    });

    it("2026: phase-outs are inflation-indexed", () => {
      const eitc = findCreditCategory("Earned Income Tax Credit (EITC)", "US", 2026);
      expect(eitc!.incomeLimits.single?.phaseOutStart).toBe(21_968);
      expect(eitc!.incomeLimits.single?.phaseOutEnd).toBe(61_577);
    });
  });

  describe("Child Tax Credit", () => {
    it("2025: maxAmount is $2,000", () => {
      const ctc = findCreditCategory("Child Tax Credit", "US", 2025);
      expect(ctc!.maxAmount).toBe(2_000);
    });

    it("2025: description mentions $1,700 refundable (ACTC)", () => {
      const ctc = findCreditCategory("Child Tax Credit", "US", 2025);
      expect(ctc!.description).toContain("$1,700");
      expect(ctc!.description).toContain("refundable");
    });

    it("2025: phase-out at $200k single, $400k MFJ", () => {
      const ctc = findCreditCategory("Child Tax Credit", "US", 2025);
      expect(ctc!.incomeLimits.single?.phaseOutStart).toBe(200_000);
      expect(ctc!.incomeLimits["married-jointly"]?.phaseOutStart).toBe(400_000);
    });

    it("2026: maxAmount remains $2,000 (statutory, not indexed)", () => {
      const ctc = findCreditCategory("Child Tax Credit", "US", 2026);
      expect(ctc!.maxAmount).toBe(2_000);
    });

    it("2026: description mentions $1,748 refundable (indexed ACTC)", () => {
      const ctc = findCreditCategory("Child Tax Credit", "US", 2026);
      expect(ctc!.description).toContain("$1,748");
    });
  });

  describe("Adoption Credit", () => {
    it("2025: maxAmount is $17,280", () => {
      const ac = findCreditCategory("Adoption Credit", "US", 2025);
      expect(ac!.maxAmount).toBe(17_280);
    });

    it("2025: description mentions $17,280", () => {
      const ac = findCreditCategory("Adoption Credit", "US", 2025);
      expect(ac!.description).toContain("$17,280");
    });

    it("2025: phase-out $259,190–$299,190", () => {
      const ac = findCreditCategory("Adoption Credit", "US", 2025);
      expect(ac!.incomeLimits.single?.phaseOutStart).toBe(259_190);
      expect(ac!.incomeLimits.single?.phaseOutEnd).toBe(299_190);
    });

    it("2025: ineligible for MFS", () => {
      const ac = findCreditCategory("Adoption Credit", "US", 2025);
      expect(ac!.incomeLimits["married-separately"]?.ineligible).toBe(true);
    });

    it("2026: maxAmount is $17,764 (inflation-indexed)", () => {
      const ac = findCreditCategory("Adoption Credit", "US", 2026);
      expect(ac!.maxAmount).toBe(17_764);
    });

    it("2026: phase-out is inflation-indexed", () => {
      const ac = findCreditCategory("Adoption Credit", "US", 2026);
      expect(ac!.incomeLimits.single?.phaseOutStart).toBe(266_447);
      expect(ac!.incomeLimits.single?.phaseOutEnd).toBe(307_447);
    });
  });

  describe("Saver's Credit", () => {
    it("2025: hard caps $39,500 single, $59,250 HoH, $79,000 MFJ", () => {
      const sc = findCreditCategory("Saver's Credit", "US", 2025);
      expect(sc!.incomeLimits.single?.hardCap).toBe(39_500);
      expect(sc!.incomeLimits["head-of-household"]?.hardCap).toBe(59_250);
      expect(sc!.incomeLimits["married-jointly"]?.hardCap).toBe(79_000);
      expect(sc!.incomeLimits["married-separately"]?.hardCap).toBe(39_500);
    });

    it("2025: description mentions correct thresholds", () => {
      const sc = findCreditCategory("Saver's Credit", "US", 2025);
      expect(sc!.description).toContain("$39,500");
      expect(sc!.description).toContain("$59,250");
      expect(sc!.description).toContain("$79,000");
    });

    it("2026: hard caps inflation-indexed", () => {
      const sc = findCreditCategory("Saver's Credit", "US", 2026);
      expect(sc!.incomeLimits.single?.hardCap).toBe(40_600);
      expect(sc!.incomeLimits["head-of-household"]?.hardCap).toBe(60_900);
      expect(sc!.incomeLimits["married-jointly"]?.hardCap).toBe(81_200);
    });
  });

  describe("Student Loan Interest Deduction", () => {
    it("2025: phase-out $85,000–$100,000 single, $175,000–$205,000 MFJ", () => {
      const slid = findCreditCategory("Student Loan Interest Deduction", "US", 2025);
      expect(slid!.incomeLimits.single?.phaseOutStart).toBe(85_000);
      expect(slid!.incomeLimits.single?.phaseOutEnd).toBe(100_000);
      expect(slid!.incomeLimits["married-jointly"]?.phaseOutStart).toBe(175_000);
      expect(slid!.incomeLimits["married-jointly"]?.phaseOutEnd).toBe(205_000);
    });

    it("2025: ineligible for MFS", () => {
      const slid = findCreditCategory("Student Loan Interest Deduction", "US", 2025);
      expect(slid!.incomeLimits["married-separately"]?.ineligible).toBe(true);
    });

    it("2026: phase-outs inflation-indexed", () => {
      const slid = findCreditCategory("Student Loan Interest Deduction", "US", 2026);
      expect(slid!.incomeLimits.single?.phaseOutStart).toBe(87_380);
      expect(slid!.incomeLimits.single?.phaseOutEnd).toBe(102_800);
      expect(slid!.incomeLimits["married-jointly"]?.phaseOutStart).toBe(179_900);
      expect(slid!.incomeLimits["married-jointly"]?.phaseOutEnd).toBe(210_740);
    });
  });

  describe("Standard Deduction (info-only)", () => {
    it("2025: description mentions $15,000/$22,500/$30,000", () => {
      const sd = findCreditCategory("Standard Deduction", "US", 2025);
      expect(sd!.description).toContain("$15,000");
      expect(sd!.description).toContain("$22,500");
      expect(sd!.description).toContain("$30,000");
      expect(sd!.infoOnly).toBe(true);
    });

    it("2026: description mentions $15,420/$23,130/$30,840", () => {
      const sd = findCreditCategory("Standard Deduction", "US", 2026);
      expect(sd!.description).toContain("$15,420");
      expect(sd!.description).toContain("$23,130");
      expect(sd!.description).toContain("$30,840");
    });
  });

  describe("Electric Vehicle Credit", () => {
    it("2025: maxAmount is $7,500", () => {
      const ev = findCreditCategory("Electric Vehicle Credit", "US", 2025);
      expect(ev!.maxAmount).toBe(7_500);
    });

    it("2025: hard caps $150k single, $225k HoH, $300k MFJ", () => {
      const ev = findCreditCategory("Electric Vehicle Credit", "US", 2025);
      expect(ev!.incomeLimits.single?.hardCap).toBe(150_000);
      expect(ev!.incomeLimits["head-of-household"]?.hardCap).toBe(225_000);
      expect(ev!.incomeLimits["married-jointly"]?.hardCap).toBe(300_000);
    });
  });

  describe("AOTC", () => {
    it("2025: maxAmount is $2,500", () => {
      const aotc = findCreditCategory("American Opportunity Tax Credit (AOTC)", "US", 2025);
      expect(aotc!.maxAmount).toBe(2_500);
    });

    it("2025: phase-out $80k–$90k single, $160k–$180k MFJ", () => {
      const aotc = findCreditCategory("American Opportunity Tax Credit (AOTC)", "US", 2025);
      expect(aotc!.incomeLimits.single?.phaseOutStart).toBe(80_000);
      expect(aotc!.incomeLimits.single?.phaseOutEnd).toBe(90_000);
      expect(aotc!.incomeLimits["married-jointly"]?.phaseOutStart).toBe(160_000);
      expect(aotc!.incomeLimits["married-jointly"]?.phaseOutEnd).toBe(180_000);
    });
  });

  describe("Lifetime Learning Credit", () => {
    it("2025: maxAmount is $2,000", () => {
      const llc = findCreditCategory("Lifetime Learning Credit", "US", 2025);
      expect(llc!.maxAmount).toBe(2_000);
    });
  });

  describe("SALT Deduction", () => {
    it("2025: maxAmount is $10,000, MFS hardCap $5,000", () => {
      const salt = findCreditCategory("State and Local Tax (SALT) Deduction", "US", 2025);
      expect(salt!.maxAmount).toBe(10_000);
      expect(salt!.incomeLimits["married-separately"]?.hardCap).toBe(5_000);
    });
  });

  describe("US category counts", () => {
    it("getCreditCategories returns correct number of US credits (excluding info-only)", () => {
      const cats = getCreditCategories("US", 2025);
      // Excludes: Standard Deduction, Mortgage Interest, HSA, SSDI/SSI (all info-only)
      expect(cats.length).toBeGreaterThanOrEqual(13);
    });

    it("getAllCreditCategories includes info-only US entries", () => {
      const all = getAllCreditCategories("US", 2025);
      const infoOnly = all.filter((c) => c.infoOnly);
      expect(infoOnly.length).toBeGreaterThanOrEqual(4);
    });
  });
});
