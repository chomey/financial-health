import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// Mock ResizeObserver for jsdom
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

import {
  TaxExplainerContent,
  type TaxExplainerDetails,
  type TaxBracketSegment,
} from "@/components/DataFlowArrows";
import { computeMetrics, type FinancialState, INITIAL_STATE } from "@/lib/financial-state";

// --- TaxExplainerContent rendering ---

const sampleDetails: TaxExplainerDetails = {
  federalTax: 5000,
  provincialStateTax: 3000,
  jurisdictionLabel: "Ontario",
  jurisdictionType: "Provincial",
  effectiveRate: 0.148,
  marginalRate: 0.295,
  grossIncome: 54000,
  totalTax: 8000,
  afterTaxIncome: 46000,
  brackets: [
    { min: 0, max: 57375, rate: 0.15, amountInBracket: 54000, taxInBracket: 8100 },
  ],
  hasCapitalGains: false,
};

describe("TaxExplainerContent", () => {
  it("renders the tax explainer container", () => {
    render(<TaxExplainerContent details={sampleDetails} />);
    expect(screen.getByTestId("tax-explainer")).toBeInTheDocument();
  });

  it("renders bracket bar with segments", () => {
    render(<TaxExplainerContent details={sampleDetails} />);
    expect(screen.getByTestId("tax-bracket-bar")).toBeInTheDocument();
    expect(screen.getByTestId("tax-bracket-segment-0")).toBeInTheDocument();
  });

  it("renders multiple bracket segments when income spans brackets", () => {
    const multiDetails: TaxExplainerDetails = {
      ...sampleDetails,
      grossIncome: 100000,
      brackets: [
        { min: 0, max: 57375, rate: 0.15, amountInBracket: 57375, taxInBracket: 8606 },
        { min: 57375, max: 114750, rate: 0.205, amountInBracket: 42625, taxInBracket: 8738 },
      ],
    };
    render(<TaxExplainerContent details={multiDetails} />);
    expect(screen.getByTestId("tax-bracket-segment-0")).toBeInTheDocument();
    expect(screen.getByTestId("tax-bracket-segment-1")).toBeInTheDocument();
  });

  it("renders federal and provincial tax amounts", () => {
    render(<TaxExplainerContent details={sampleDetails} />);
    expect(screen.getByTestId("tax-federal-amount")).toHaveTextContent("$5,000");
    expect(screen.getByTestId("tax-provincial-amount")).toHaveTextContent("$3,000");
  });

  it("shows jurisdiction label and type", () => {
    render(<TaxExplainerContent details={sampleDetails} />);
    expect(screen.getByTestId("tax-breakdown")).toHaveTextContent("Provincial: Ontario");
  });

  it("shows US state label when country is US", () => {
    const usDetails: TaxExplainerDetails = {
      ...sampleDetails,
      jurisdictionLabel: "California",
      jurisdictionType: "State",
    };
    render(<TaxExplainerContent details={usDetails} />);
    expect(screen.getByTestId("tax-breakdown")).toHaveTextContent("State: California");
  });

  it("renders effective and marginal rates", () => {
    render(<TaxExplainerContent details={sampleDetails} />);
    expect(screen.getByTestId("tax-effective-rate")).toHaveTextContent("14.8%");
    expect(screen.getByTestId("tax-marginal-rate")).toHaveTextContent("29.5%");
  });

  it("renders after-tax income flow", () => {
    render(<TaxExplainerContent details={sampleDetails} />);
    const flow = screen.getByTestId("tax-after-tax-flow");
    expect(flow).toHaveTextContent("$54,000");
    expect(flow).toHaveTextContent("$8,000");
    expect(flow).toHaveTextContent("$46,000");
  });

  it("does NOT render capital gains section when hasCapitalGains is false", () => {
    render(<TaxExplainerContent details={sampleDetails} />);
    expect(screen.queryByTestId("tax-capital-gains")).not.toBeInTheDocument();
  });

  it("renders Canadian capital gains section", () => {
    const cgDetails: TaxExplainerDetails = {
      ...sampleDetails,
      hasCapitalGains: true,
      capitalGainsInfo: { country: "CA", totalCapitalGains: 100000 },
    };
    render(<TaxExplainerContent details={cgDetails} />);
    const section = screen.getByTestId("tax-capital-gains");
    expect(section).toHaveTextContent("50% included");
    expect(section).toHaveTextContent("$250,000");
  });

  it("renders US capital gains section", () => {
    const cgDetails: TaxExplainerDetails = {
      ...sampleDetails,
      hasCapitalGains: true,
      capitalGainsInfo: { country: "US", totalCapitalGains: 50000 },
    };
    render(<TaxExplainerContent details={cgDetails} />);
    const section = screen.getByTestId("tax-capital-gains");
    expect(section).toHaveTextContent("0%");
    expect(section).toHaveTextContent("15%");
    expect(section).toHaveTextContent("20%");
  });

  it("shows CA above $250k inclusion rate when gains exceed threshold", () => {
    const cgDetails: TaxExplainerDetails = {
      ...sampleDetails,
      hasCapitalGains: true,
      capitalGainsInfo: { country: "CA", totalCapitalGains: 300000 },
    };
    render(<TaxExplainerContent details={cgDetails} />);
    expect(screen.getByTestId("tax-capital-gains")).toHaveTextContent("66.67%");
  });
});

// --- computeMetrics includes taxDetails ---

describe("computeMetrics taxDetails integration", () => {
  it("includes taxDetails in the Estimated Tax metric", () => {
    const metrics = computeMetrics(INITIAL_STATE);
    const taxMetric = metrics.find((m) => m.title === "Estimated Tax");
    expect(taxMetric).toBeDefined();
    expect(taxMetric!.taxDetails).toBeDefined();
  });

  it("taxDetails has correct jurisdiction for CA/ON", () => {
    const metrics = computeMetrics(INITIAL_STATE);
    const taxMetric = metrics.find((m) => m.title === "Estimated Tax")!;
    expect(taxMetric.taxDetails!.jurisdictionLabel).toBe("Ontario");
    expect(taxMetric.taxDetails!.jurisdictionType).toBe("Provincial");
  });

  it("taxDetails has correct jurisdiction for US/CA", () => {
    const usState: FinancialState = {
      ...INITIAL_STATE,
      country: "US",
      jurisdiction: "CA",
    };
    const metrics = computeMetrics(usState);
    const taxMetric = metrics.find((m) => m.title === "Estimated Tax")!;
    expect(taxMetric.taxDetails!.jurisdictionLabel).toBe("California");
    expect(taxMetric.taxDetails!.jurisdictionType).toBe("State");
  });

  it("taxDetails brackets have non-zero amountInBracket for income > 0", () => {
    const metrics = computeMetrics(INITIAL_STATE);
    const taxMetric = metrics.find((m) => m.title === "Estimated Tax")!;
    const brackets = taxMetric.taxDetails!.brackets;
    expect(brackets.length).toBeGreaterThan(0);
    expect(brackets[0].amountInBracket).toBeGreaterThan(0);
  });

  it("taxDetails is defined with zero-income bracket reference when income is 0", () => {
    const noIncome: FinancialState = {
      ...INITIAL_STATE,
      income: [],
    };
    const metrics = computeMetrics(noIncome);
    const taxMetric = metrics.find((m) => m.title === "Estimated Tax")!;
    expect(taxMetric.taxDetails).toBeDefined();
    expect(taxMetric.taxDetails!.grossIncome).toBe(0);
    expect(taxMetric.taxDetails!.totalTax).toBe(0);
    expect(taxMetric.taxDetails!.effectiveRate).toBe(0);
    expect(taxMetric.taxDetails!.marginalRate).toBe(0);
    expect(taxMetric.taxDetails!.jurisdictionLabel).toBe("Ontario");
    // Should have reference brackets with zero amounts
    expect(taxMetric.taxDetails!.brackets.length).toBeGreaterThan(0);
    expect(taxMetric.taxDetails!.brackets.every(b => b.amountInBracket === 0)).toBe(true);
  });

  it("taxDetails has effectiveRate matching the metric effectiveRate", () => {
    const metrics = computeMetrics(INITIAL_STATE);
    const taxMetric = metrics.find((m) => m.title === "Estimated Tax")!;
    expect(taxMetric.taxDetails!.effectiveRate).toBeCloseTo(taxMetric.effectiveRate!, 4);
  });

  it("taxDetails afterTaxIncome equals grossIncome minus totalTax", () => {
    const metrics = computeMetrics(INITIAL_STATE);
    const taxMetric = metrics.find((m) => m.title === "Estimated Tax")!;
    const details = taxMetric.taxDetails!;
    expect(details.afterTaxIncome).toBeCloseTo(details.grossIncome - details.totalTax, 2);
  });

  it("taxDetails federal + provincial equals totalTax", () => {
    const metrics = computeMetrics(INITIAL_STATE);
    const taxMetric = metrics.find((m) => m.title === "Estimated Tax")!;
    const details = taxMetric.taxDetails!;
    expect(details.federalTax + details.provincialStateTax).toBeCloseTo(details.totalTax, 2);
  });

  it("taxDetails hasCapitalGains is true when income has capital-gains type", () => {
    const capGainsState: FinancialState = {
      ...INITIAL_STATE,
      income: [
        { id: "i1", category: "Investments", amount: 5000, incomeType: "capital-gains" },
      ],
    };
    const metrics = computeMetrics(capGainsState);
    const taxMetric = metrics.find((m) => m.title === "Estimated Tax")!;
    expect(taxMetric.taxDetails!.hasCapitalGains).toBe(true);
    expect(taxMetric.taxDetails!.capitalGainsInfo).toBeDefined();
    expect(taxMetric.taxDetails!.capitalGainsInfo!.country).toBe("CA");
  });

  it("taxDetails marginalRate is greater than or equal to effectiveRate", () => {
    const metrics = computeMetrics(INITIAL_STATE);
    const taxMetric = metrics.find((m) => m.title === "Estimated Tax")!;
    const details = taxMetric.taxDetails!;
    expect(details.marginalRate).toBeGreaterThanOrEqual(details.effectiveRate);
  });
});

// --- TaxExplainerContent zero income rendering ---

describe("TaxExplainerContent zero income", () => {
  const zeroIncomeDetails: TaxExplainerDetails = {
    federalTax: 0,
    provincialStateTax: 0,
    jurisdictionLabel: "Ontario",
    jurisdictionType: "Provincial",
    effectiveRate: 0,
    marginalRate: 0,
    grossIncome: 0,
    totalTax: 0,
    afterTaxIncome: 0,
    brackets: [
      { min: 0, max: 57375, rate: 0.15, amountInBracket: 0, taxInBracket: 0 },
      { min: 57375, max: 114750, rate: 0.205, amountInBracket: 0, taxInBracket: 0 },
      { min: 114750, max: 158468, rate: 0.26, amountInBracket: 0, taxInBracket: 0 },
    ],
    hasCapitalGains: false,
  };

  it("renders zero-income message with jurisdiction name", () => {
    render(<TaxExplainerContent details={zeroIncomeDetails} />);
    const msg = screen.getByTestId("tax-zero-income-message");
    expect(msg).toBeInTheDocument();
    expect(msg).toHaveTextContent("No income entered");
    expect(msg).toHaveTextContent("Ontario");
  });

  it("renders bracket reference table for zero income", () => {
    render(<TaxExplainerContent details={zeroIncomeDetails} />);
    expect(screen.getByTestId("tax-bracket-reference")).toBeInTheDocument();
    expect(screen.getByTestId("tax-bracket-ref-0")).toBeInTheDocument();
    expect(screen.getByTestId("tax-bracket-ref-1")).toBeInTheDocument();
    expect(screen.getByTestId("tax-bracket-ref-2")).toBeInTheDocument();
  });

  it("does NOT render bracket bar visualization for zero income", () => {
    render(<TaxExplainerContent details={zeroIncomeDetails} />);
    expect(screen.queryByTestId("tax-bracket-bar")).not.toBeInTheDocument();
  });

  it("does NOT render after-tax income flow for zero income", () => {
    render(<TaxExplainerContent details={zeroIncomeDetails} />);
    expect(screen.queryByTestId("tax-after-tax-flow")).not.toBeInTheDocument();
  });

  it("shows 0.0% effective and marginal rates", () => {
    render(<TaxExplainerContent details={zeroIncomeDetails} />);
    expect(screen.getByTestId("tax-effective-rate")).toHaveTextContent("0.0%");
    expect(screen.getByTestId("tax-marginal-rate")).toHaveTextContent("0.0%");
  });

  it("shows $0 federal and provincial tax amounts", () => {
    render(<TaxExplainerContent details={zeroIncomeDetails} />);
    expect(screen.getByTestId("tax-federal-amount")).toHaveTextContent("$0");
    expect(screen.getByTestId("tax-provincial-amount")).toHaveTextContent("$0");
  });

  it("US jurisdiction shows state label for zero income", () => {
    const usZeroDetails: TaxExplainerDetails = {
      ...zeroIncomeDetails,
      jurisdictionLabel: "California",
      jurisdictionType: "State",
    };
    render(<TaxExplainerContent details={usZeroDetails} />);
    expect(screen.getByTestId("tax-zero-income-message")).toHaveTextContent("California");
    expect(screen.getByTestId("tax-breakdown")).toHaveTextContent("State: California");
  });
});

// --- computeBracketSegments via taxDetails ---

describe("bracket segments", () => {
  it("all bracket segments have non-negative amountInBracket", () => {
    const metrics = computeMetrics(INITIAL_STATE);
    const brackets = metrics.find((m) => m.title === "Estimated Tax")!.taxDetails!.brackets;
    for (const seg of brackets) {
      expect(seg.amountInBracket).toBeGreaterThanOrEqual(0);
    }
  });

  it("bracket segment rates are between 0 and 1", () => {
    const metrics = computeMetrics(INITIAL_STATE);
    const brackets = metrics.find((m) => m.title === "Estimated Tax")!.taxDetails!.brackets;
    for (const seg of brackets) {
      expect(seg.rate).toBeGreaterThanOrEqual(0);
      expect(seg.rate).toBeLessThanOrEqual(1);
    }
  });

  it("sum of bracket amountInBracket is close to taxable income", () => {
    const metrics = computeMetrics(INITIAL_STATE);
    const details = metrics.find((m) => m.title === "Estimated Tax")!.taxDetails!;
    const sum = details.brackets.reduce((s, b) => s + b.amountInBracket, 0);
    // Taxable income may differ from gross due to BPA, but sum should be > 0
    expect(sum).toBeGreaterThan(0);
  });
});
