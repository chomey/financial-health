import { describe, it, expect, vi } from "vitest";
import * as withdrawalTax from "@/lib/withdrawal-tax";
import * as countries from "@/lib/countries";

describe("withdrawal-tax shim delegation", () => {
  it("getWithdrawalTaxRate delegates to country taxEngine", () => {
    const spy = vi.spyOn(countries, "getCountry");
    const mockEngine = {
      computeTax: vi.fn(),
      getMarginalRate: vi.fn(),
      classifyTaxTreatment: vi.fn(),
      getEarlyWithdrawalPenalties: vi.fn(),
      getWithdrawalTaxRate: vi.fn().mockReturnValue({
        effectiveRate: 0.2,
        taxFreeAmount: 0,
        taxableAmount: 50000,
      }),
    };
    spy.mockReturnValue({ taxEngine: mockEngine } as unknown as ReturnType<typeof countries.getCountry>);

    const result = withdrawalTax.getWithdrawalTaxRate("RRSP", "CA", "ON", 50000, 100, undefined, 2025);

    expect(spy).toHaveBeenCalledWith("CA");
    expect(mockEngine.getWithdrawalTaxRate).toHaveBeenCalledWith({
      category: "RRSP",
      jurisdiction: "ON",
      annualWithdrawal: 50000,
      costBasisPercent: 100,
      roiTaxTreatment: undefined,
      year: 2025,
    });
    expect(result.effectiveRate).toBe(0.2);

    spy.mockRestore();
  });

  it("getWithdrawalTaxRate short-circuits at zero withdrawal without calling country", () => {
    const spy = vi.spyOn(countries, "getCountry");
    const result = withdrawalTax.getWithdrawalTaxRate("RRSP", "CA", "ON", 0);
    expect(spy).not.toHaveBeenCalled();
    expect(result).toEqual({ effectiveRate: 0, taxFreeAmount: 0, taxableAmount: 0 });
    spy.mockRestore();
  });

  it("getEarlyWithdrawalPenalties delegates to country taxEngine", () => {
    const spy = vi.spyOn(countries, "getCountry");
    const mockPenalties = [{ category: "401k", penaltyPercent: 10, penaltyFreeAge: 59.5, rule: "test" }];
    const mockEngine = {
      computeTax: vi.fn(),
      getMarginalRate: vi.fn(),
      classifyTaxTreatment: vi.fn(),
      getWithdrawalTaxRate: vi.fn(),
      getEarlyWithdrawalPenalties: vi.fn().mockReturnValue(mockPenalties),
    };
    spy.mockReturnValue({ taxEngine: mockEngine } as unknown as ReturnType<typeof countries.getCountry>);

    const result = withdrawalTax.getEarlyWithdrawalPenalties(["401k"], 45, "US");

    expect(spy).toHaveBeenCalledWith("US");
    expect(mockEngine.getEarlyWithdrawalPenalties).toHaveBeenCalledWith(["401k"], 45);
    expect(result).toBe(mockPenalties);

    spy.mockRestore();
  });

  it("getEarlyWithdrawalPenalties returns empty for undefined age", () => {
    const spy = vi.spyOn(countries, "getCountry");
    const result = withdrawalTax.getEarlyWithdrawalPenalties(["401k"], undefined, "US");
    expect(spy).not.toHaveBeenCalled();
    expect(result).toEqual([]);
    spy.mockRestore();
  });

  describe("classifyTaxTreatment (country-agnostic)", () => {
    it.each(["TFSA", "Roth IRA", "HSA", "FHSA"])("classifies %s as tax-free", (cat) => {
      expect(withdrawalTax.classifyTaxTreatment(cat)).toBe("tax-free");
    });

    it.each(["RRSP", "401k", "IRA", "LIRA", "RESP", "529"])("classifies %s as tax-deferred", (cat) => {
      expect(withdrawalTax.classifyTaxTreatment(cat)).toBe("tax-deferred");
    });

    it("classifies Super (Accumulation) as super-accumulation", () => {
      expect(withdrawalTax.classifyTaxTreatment("Super (Accumulation)")).toBe("super-accumulation");
    });

    it("classifies Super (Pension Phase) as tax-free", () => {
      expect(withdrawalTax.classifyTaxTreatment("Super (Pension Phase)")).toBe("tax-free");
    });

    it("classifies First Home Super Saver as super-fhss", () => {
      expect(withdrawalTax.classifyTaxTreatment("First Home Super Saver")).toBe("super-fhss");
    });

    it("defaults unknown to taxable", () => {
      expect(withdrawalTax.classifyTaxTreatment("Unknown Account")).toBe("taxable");
    });
  });
});
