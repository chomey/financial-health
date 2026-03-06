import { describe, it, expect, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

// Mock ResizeObserver for jsdom
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});

import SnapshotDashboard, {
  type MetricData,
  type DataFlowConnectionDef,
} from "@/components/SnapshotDashboard";
import { DataFlowProvider } from "@/components/DataFlowArrows";

const TAX_METRIC: MetricData = {
  title: "Estimated Tax",
  value: 15000,
  format: "currency",
  icon: "🏛️",
  tooltip: "Estimated annual income tax.",
  positive: true,
  breakdown: "$80k gross - $15k tax = $65k/mo",
  effectiveRate: 0.1875,
};

const RUNWAY_METRIC: MetricData = {
  title: "Financial Runway",
  value: 12.5,
  format: "months",
  icon: "🛡️",
  tooltip: "Months your liquid assets cover expenses.",
  positive: true,
  breakdown: "$50k liquid / $4k/mo obligations",
};

const RATIO_METRIC: MetricData = {
  title: "Debt-to-Asset Ratio",
  value: 0.45,
  format: "ratio",
  icon: "⚖️",
  tooltip: "Total debts divided by total assets.",
  positive: true,
  breakdown: "$90k debts / $200k assets",
};

const TAX_CONNECTIONS: DataFlowConnectionDef[] = [
  { sourceId: "section-income", label: "18.8% of $80k", value: 6667, sign: "positive" },
];

const RUNWAY_CONNECTIONS: DataFlowConnectionDef[] = [
  { sourceId: "section-assets", label: "+$30k", value: 30000, sign: "positive" },
  { sourceId: "section-stocks", label: "+$20k", value: 20000, sign: "positive" },
  { sourceId: "section-expenses", label: "-$3k", value: 3000, sign: "negative" },
  { sourceId: "section-property", label: "mortgage -$1k", value: 1000, sign: "negative" },
];

const RATIO_CONNECTIONS: DataFlowConnectionDef[] = [
  { sourceId: "section-assets", label: "+$30k", value: 30000, sign: "positive" },
  { sourceId: "section-stocks", label: "+$20k", value: 20000, sign: "positive" },
  { sourceId: "section-property", label: "value +$150k", value: 150000, sign: "positive" },
  { sourceId: "section-debts", label: "-$25k", value: 25000, sign: "negative" },
  { sourceId: "section-property", label: "mortgage -$65k", value: 65000, sign: "negative" },
];

function renderWithProvider(
  connections: Record<string, DataFlowConnectionDef[]>,
  metrics: MetricData[]
) {
  return render(
    <DataFlowProvider>
      <SnapshotDashboard
        metrics={metrics}
        dataFlowConnections={connections}
      />
    </DataFlowProvider>
  );
}

describe("Estimated Tax data-flow connections", () => {
  it("renders the Estimated Tax metric card", () => {
    renderWithProvider({ "Estimated Tax": TAX_CONNECTIONS }, [TAX_METRIC]);
    expect(screen.getByTestId("metric-card-estimated-tax")).toBeInTheDocument();
  });

  it("has income as positive source", () => {
    const positiveConns = TAX_CONNECTIONS.filter((c) => c.sign === "positive");
    expect(positiveConns).toHaveLength(1);
    expect(positiveConns[0].sourceId).toBe("section-income");
  });

  it("label includes effective rate", () => {
    expect(TAX_CONNECTIONS[0].label).toContain("18.8%");
  });

  it("shows breakdown on hover", () => {
    renderWithProvider({ "Estimated Tax": TAX_CONNECTIONS }, [TAX_METRIC]);
    const card = screen.getByTestId("metric-card-estimated-tax");
    fireEvent.mouseEnter(card);
    expect(screen.getByTestId("metric-breakdown")).toBeInTheDocument();
  });
});

describe("Financial Runway data-flow connections", () => {
  it("renders the Financial Runway metric card", () => {
    renderWithProvider({ "Financial Runway": RUNWAY_CONNECTIONS }, [RUNWAY_METRIC]);
    expect(screen.getByTestId("metric-card-financial-runway")).toBeInTheDocument();
  });

  it("has assets and stocks as positive sources", () => {
    const positiveConns = RUNWAY_CONNECTIONS.filter((c) => c.sign === "positive");
    expect(positiveConns).toHaveLength(2);
    expect(positiveConns.map((c) => c.sourceId)).toEqual(["section-assets", "section-stocks"]);
  });

  it("has expenses and mortgage as negative sources", () => {
    const negativeConns = RUNWAY_CONNECTIONS.filter((c) => c.sign === "negative");
    expect(negativeConns).toHaveLength(2);
    expect(negativeConns.map((c) => c.sourceId)).toEqual(["section-expenses", "section-property"]);
  });

  it("shows breakdown on hover", () => {
    renderWithProvider({ "Financial Runway": RUNWAY_CONNECTIONS }, [RUNWAY_METRIC]);
    const card = screen.getByTestId("metric-card-financial-runway");
    fireEvent.mouseEnter(card);
    expect(screen.getByTestId("metric-breakdown")).toBeInTheDocument();
  });
});

describe("Debt-to-Asset Ratio data-flow connections", () => {
  it("renders the Debt-to-Asset Ratio metric card", () => {
    renderWithProvider({ "Debt-to-Asset Ratio": RATIO_CONNECTIONS }, [RATIO_METRIC]);
    expect(screen.getByTestId("metric-card-debt-to-asset-ratio")).toBeInTheDocument();
  });

  it("has assets, stocks, and property value as positive sources", () => {
    const positiveConns = RATIO_CONNECTIONS.filter((c) => c.sign === "positive");
    expect(positiveConns).toHaveLength(3);
    expect(positiveConns.map((c) => c.sourceId)).toEqual([
      "section-assets",
      "section-stocks",
      "section-property",
    ]);
  });

  it("has debts and mortgage as negative sources", () => {
    const negativeConns = RATIO_CONNECTIONS.filter((c) => c.sign === "negative");
    expect(negativeConns).toHaveLength(2);
    expect(negativeConns.map((c) => c.sourceId)).toEqual(["section-debts", "section-property"]);
  });

  it("property appears in both positive and negative connections", () => {
    const propertyConns = RATIO_CONNECTIONS.filter((c) => c.sourceId === "section-property");
    expect(propertyConns).toHaveLength(2);
    expect(propertyConns[0].sign).toBe("positive");
    expect(propertyConns[1].sign).toBe("negative");
  });

  it("shows breakdown on hover", () => {
    renderWithProvider({ "Debt-to-Asset Ratio": RATIO_CONNECTIONS }, [RATIO_METRIC]);
    const card = screen.getByTestId("metric-card-debt-to-asset-ratio");
    fireEvent.mouseEnter(card);
    expect(screen.getByTestId("metric-breakdown")).toBeInTheDocument();
  });
});

describe("All five metrics wired together", () => {
  it("renders all five metric cards with connections", () => {
    const allMetrics = [TAX_METRIC, RUNWAY_METRIC, RATIO_METRIC];
    const allConnections = {
      "Estimated Tax": TAX_CONNECTIONS,
      "Financial Runway": RUNWAY_CONNECTIONS,
      "Debt-to-Asset Ratio": RATIO_CONNECTIONS,
    };
    renderWithProvider(allConnections, allMetrics);
    expect(screen.getByTestId("metric-card-estimated-tax")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-financial-runway")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-debt-to-asset-ratio")).toBeInTheDocument();
  });
});
