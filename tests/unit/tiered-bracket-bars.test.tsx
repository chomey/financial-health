import { describe, it, expect, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

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
} from "@/components/DataFlowArrows";

const baseBrackets = [
  { min: 0, max: 57375, rate: 0.15, amountInBracket: 50000, taxInBracket: 7500 },
  { min: 57375, max: 114750, rate: 0.205, amountInBracket: 0, taxInBracket: 0 },
  { min: 114750, max: 158468, rate: 0.26, amountInBracket: 0, taxInBracket: 0 },
];

const sampleDetails: TaxExplainerDetails = {
  federalTax: 7500,
  provincialStateTax: 2500,
  jurisdictionLabel: "Ontario",
  jurisdictionType: "Provincial",
  effectiveRate: 0.2,
  marginalRate: 0.295,
  grossIncome: 50000,
  totalTax: 10000,
  afterTaxIncome: 40000,
  brackets: baseBrackets,
  provincialBrackets: [
    { min: 0, max: 51446, rate: 0.0505, amountInBracket: 50000, taxInBracket: 2525 },
    { min: 51446, max: 102894, rate: 0.0915, amountInBracket: 0, taxInBracket: 0 },
  ],
  hasCapitalGains: false,
};

describe("TieredBracketBars", () => {
  it("renders federal tiered bracket rows for all brackets (filled and unfilled)", () => {
    render(<TaxExplainerContent details={sampleDetails} />);
    // All 3 federal brackets should be rendered as rows
    expect(screen.getByTestId("tax-federal-brackets-row-0")).toBeInTheDocument();
    expect(screen.getByTestId("tax-federal-brackets-row-1")).toBeInTheDocument();
    expect(screen.getByTestId("tax-federal-brackets-row-2")).toBeInTheDocument();
  });

  it("renders fill bar only for brackets with income", () => {
    render(<TaxExplainerContent details={sampleDetails} />);
    // Only first bracket has income
    expect(screen.getByTestId("tax-federal-brackets-fill-0")).toBeInTheDocument();
    // Unfilled brackets should not have fill bars
    expect(screen.queryByTestId("tax-federal-brackets-fill-1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tax-federal-brackets-fill-2")).not.toBeInTheDocument();
  });

  it("renders provincial tiered bracket rows", () => {
    render(<TaxExplainerContent details={sampleDetails} />);
    expect(screen.getByTestId("tax-provincial-brackets-row-0")).toBeInTheDocument();
    expect(screen.getByTestId("tax-provincial-brackets-row-1")).toBeInTheDocument();
  });

  it("shows bracket range labels on each row", () => {
    render(<TaxExplainerContent details={sampleDetails} />);
    const row0 = screen.getByTestId("tax-federal-brackets-row-0");
    expect(row0).toHaveTextContent("$0");
    expect(row0).toHaveTextContent("$57,375");
  });

  it("shows rate labels on each row", () => {
    render(<TaxExplainerContent details={sampleDetails} />);
    const row0 = screen.getByTestId("tax-federal-brackets-row-0");
    expect(row0).toHaveTextContent("15.0%");
    const row1 = screen.getByTestId("tax-federal-brackets-row-1");
    expect(row1).toHaveTextContent("20.5%");
  });

  it("shows tax amount on filled rows and dash on unfilled rows", () => {
    render(<TaxExplainerContent details={sampleDetails} />);
    const row0 = screen.getByTestId("tax-federal-brackets-row-0");
    expect(row0).toHaveTextContent("$7,500");
    const row1 = screen.getByTestId("tax-federal-brackets-row-1");
    expect(row1).toHaveTextContent("—");
  });

  it("renders brackets in reverse order (lowest at bottom, highest at top)", () => {
    render(<TaxExplainerContent details={sampleDetails} />);
    const table = screen.getByTestId("tax-federal-brackets-table");
    // flex-col-reverse means DOM order is preserved but visual order is reversed
    expect(table.querySelector("[class*='flex-col-reverse']")).toBeTruthy();
  });

  it("shows subtotals below bracket sections", () => {
    render(<TaxExplainerContent details={sampleDetails} />);
    expect(screen.getByTestId("tax-federal-brackets-subtotal")).toHaveTextContent("$7,500");
    expect(screen.getByTestId("tax-provincial-brackets-subtotal")).toHaveTextContent("$2,525");
  });

  it("unfilled brackets have dashed borders", () => {
    render(<TaxExplainerContent details={sampleDetails} />);
    const row1 = screen.getByTestId("tax-federal-brackets-row-1");
    const barContainer = row1.querySelector("[class*='border-dashed']");
    expect(barContainer).toBeTruthy();
  });

  it("renders zero-income brackets as all unfilled (no fill bars)", () => {
    const zeroDetails: TaxExplainerDetails = {
      ...sampleDetails,
      grossIncome: 0,
      totalTax: 0,
      afterTaxIncome: 0,
      federalTax: 0,
      provincialStateTax: 0,
      effectiveRate: 0,
      marginalRate: 0,
      brackets: baseBrackets.map(b => ({ ...b, amountInBracket: 0, taxInBracket: 0 })),
    };
    render(<TaxExplainerContent details={zeroDetails} />);
    expect(screen.queryByTestId("tax-federal-brackets-fill-0")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tax-federal-brackets-fill-1")).not.toBeInTheDocument();
  });

  it("handles multi-bracket income with partial fill on highest bracket", () => {
    const multiDetails: TaxExplainerDetails = {
      ...sampleDetails,
      grossIncome: 80000,
      brackets: [
        { min: 0, max: 57375, rate: 0.15, amountInBracket: 57375, taxInBracket: 8606 },
        { min: 57375, max: 114750, rate: 0.205, amountInBracket: 22625, taxInBracket: 4638 },
        { min: 114750, max: 158468, rate: 0.26, amountInBracket: 0, taxInBracket: 0 },
      ],
    };
    render(<TaxExplainerContent details={multiDetails} />);
    // First two brackets should be filled
    expect(screen.getByTestId("tax-federal-brackets-fill-0")).toBeInTheDocument();
    expect(screen.getByTestId("tax-federal-brackets-fill-1")).toBeInTheDocument();
    // Third bracket unfilled
    expect(screen.queryByTestId("tax-federal-brackets-fill-2")).not.toBeInTheDocument();
  });
});
