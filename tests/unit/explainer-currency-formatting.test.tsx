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
  SourceSummaryCard,
  ExplainerModal,
  type SourceMetadataItem,
  type ActiveTargetMeta,
  type ActiveConnection,
} from "@/components/DataFlowArrows";

describe("SourceSummaryCard currency formatting", () => {
  it("formats item amounts with USD symbol when homeCurrency is USD", () => {
    render(
      <SourceSummaryCard
        sourceId="section-assets"
        sectionName="Assets"
        items={[{ label: "Savings", value: 50000 }]}
        total="$50,000"
        isPositive={true}
        ovalSeed={1}
        homeCurrency="USD"
      />
    );
    const items = screen.getByTestId("source-summary-items-section-assets");
    expect(items).toHaveTextContent("$50,000");
  });

  it("formats item amounts with plain $ when homeCurrency is CAD", () => {
    render(
      <SourceSummaryCard
        sourceId="section-assets"
        sectionName="Assets"
        items={[{ label: "TFSA", value: 50000 }]}
        total="$50,000"
        isPositive={true}
        ovalSeed={1}
        homeCurrency="CAD"
      />
    );
    const items = screen.getByTestId("source-summary-items-section-assets");
    expect(items).toHaveTextContent("$50,000");
  });

  it("shows currency code when item currency differs from homeCurrency", () => {
    render(
      <SourceSummaryCard
        sourceId="section-assets"
        sectionName="Assets"
        items={[{ label: "Fidelity Brokerage", value: 100000, currency: "USD" }]}
        total="$137,000"
        isPositive={true}
        ovalSeed={1}
        homeCurrency="CAD"
      />
    );
    // Item should show $100,000 (USD format) with a "USD" code
    expect(screen.getByText("$100,000")).toBeInTheDocument();
    expect(screen.getByText("USD")).toBeInTheDocument();
  });

  it("does not show currency code when item currency matches homeCurrency", () => {
    render(
      <SourceSummaryCard
        sourceId="section-assets"
        sectionName="Assets"
        items={[{ label: "TD GIC", value: 50000, currency: "CAD" }]}
        total="$50,000"
        isPositive={true}
        ovalSeed={1}
        homeCurrency="CAD"
      />
    );
    const items = screen.getByTestId("source-summary-items-section-assets");
    expect(items).toHaveTextContent("$50,000");
    // No currency code badge should appear
    expect(screen.queryByText("CAD")).not.toBeInTheDocument();
  });

  it("does not show currency code when item has no currency specified", () => {
    render(
      <SourceSummaryCard
        sourceId="section-assets"
        sectionName="Assets"
        items={[{ label: "Savings", value: 5000 }]}
        total="$5,000"
        isPositive={true}
        ovalSeed={1}
        homeCurrency="USD"
      />
    );
    // No currency code badge
    expect(screen.queryByText("USD")).not.toBeInTheDocument();
    expect(screen.queryByText("CAD")).not.toBeInTheDocument();
  });

  it("formats large amounts with full numbers, not abbreviated", () => {
    render(
      <SourceSummaryCard
        sourceId="section-assets"
        sectionName="Assets"
        items={[{ label: "RRSP", value: 12476711 }]}
        total="$12,476,711"
        isPositive={true}
        ovalSeed={1}
        homeCurrency="CAD"
      />
    );
    // Item list should have the full number
    const items = screen.getByTestId("source-summary-items-section-assets");
    expect(items).toHaveTextContent("$12,476,711");
  });
});

describe("ExplainerModal full currency totals", () => {
  const mockConnections: ActiveConnection[] = [
    { sourceId: "section-assets", targetId: "metric-net-worth", label: "+$55k", value: 55000, sign: "positive" },
    { sourceId: "section-debts", targetId: "metric-net-worth", label: "-$12k", value: 12000, sign: "negative" },
  ];

  const mockTargetMeta: ActiveTargetMeta = {
    label: "Net Worth",
    formattedValue: "$43,000",
  };

  const mockGetSourceMetadata = (id: string) => {
    const map: Record<string, { label: string; value: number; items?: SourceMetadataItem[] }> = {
      "section-assets": {
        label: "Assets",
        value: 55000,
        items: [{ label: "TFSA", value: 33000 }, { label: "RRSP", value: 22000 }],
      },
      "section-debts": {
        label: "Debts",
        value: 12000,
        items: [{ label: "Student Loan", value: 12000 }],
      },
    };
    return map[id];
  };

  it("renders source card totals with full currency format instead of compact", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
        homeCurrency="CAD"
      />
    );
    // Should show full format "$55,000" not compact "+$55k"
    expect(screen.getByTestId("source-summary-total-section-assets")).toHaveTextContent("$55,000");
    expect(screen.getByTestId("source-summary-total-section-debts")).toHaveTextContent("$12,000");
  });

  it("renders item amounts with plain $ for home currency", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
        homeCurrency="CAD"
      />
    );
    // Items within the assets section should show $ formatted values (home currency)
    const assetsItems = screen.getByTestId("source-summary-items-section-assets");
    expect(assetsItems).toHaveTextContent("$33,000");
    expect(assetsItems).toHaveTextContent("$22,000");
  });

  it("defaults to USD when homeCurrency is not provided", () => {
    render(
      <ExplainerModal
        connections={[
          { sourceId: "section-assets", targetId: "metric-net-worth", label: "+$10k", value: 10000, sign: "positive" },
        ]}
        targetMeta={{ label: "Test", formattedValue: "$10,000" }}
        onClose={() => {}}
        getSourceMetadata={(id) => id === "section-assets" ? { label: "Assets", value: 10000, items: [{ label: "Savings", value: 10000 }] } : undefined}
      />
    );
    expect(screen.getByTestId("source-summary-total-section-assets")).toHaveTextContent("$10,000");
  });
});

describe("SourceMetadataItem currency field", () => {
  it("supports optional currency property", () => {
    const item: SourceMetadataItem = { label: "Test", value: 1000, currency: "USD" };
    expect(item.currency).toBe("USD");
  });

  it("works without currency property", () => {
    const item: SourceMetadataItem = { label: "Test", value: 1000 };
    expect(item.currency).toBeUndefined();
  });
});
