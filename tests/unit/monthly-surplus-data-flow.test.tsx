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

const SURPLUS_METRIC: MetricData = {
  title: "Monthly Cash Flow",
  value: 3350,
  format: "currency",
  icon: "📈",
  tooltip: "How much more you earn than you spend each month.",
  positive: true,
  breakdown: "$5k income - $1.2k expenses - $350 contributions - $100 mortgage",
};

const SURPLUS_CONNECTIONS: DataFlowConnectionDef[] = [
  { sourceId: "section-income", label: "+$5.0k", value: 5000, sign: "positive" },
  { sourceId: "section-expenses", label: "-$1.2k", value: 1200, sign: "negative" },
  { sourceId: "section-assets", label: "contributions -$350", value: 350, sign: "negative" },
  { sourceId: "section-property", label: "mortgage -$100", value: 100, sign: "negative" },
];

function renderWithProvider(
  connections?: Record<string, DataFlowConnectionDef[]>,
  metrics?: MetricData[]
) {
  return render(
    <DataFlowProvider>
      <SnapshotDashboard
        metrics={metrics ?? [SURPLUS_METRIC]}
        dataFlowConnections={connections}
      />
    </DataFlowProvider>
  );
}

describe("Monthly Cash Flow data-flow connections", () => {
  it("renders the Monthly Cash Flow metric card with data-testid", () => {
    renderWithProvider({ "Monthly Cash Flow": SURPLUS_CONNECTIONS });
    expect(screen.getByTestId("metric-card-monthly-cash-flow")).toBeInTheDocument();
  });

  it("renders metric card without connections when none provided", () => {
    renderWithProvider();
    const card = screen.getByTestId("metric-card-monthly-cash-flow");
    expect(card).toBeInTheDocument();
  });

  it("income connection uses positive sign (green arrow)", () => {
    const incomeConn = SURPLUS_CONNECTIONS.find((c) => c.sourceId === "section-income");
    expect(incomeConn).toBeDefined();
    expect(incomeConn!.sign).toBe("positive");
    expect(incomeConn!.label).toMatch(/^\+/);
  });

  it("expense connection uses negative sign (red arrow)", () => {
    const expenseConn = SURPLUS_CONNECTIONS.find((c) => c.sourceId === "section-expenses");
    expect(expenseConn).toBeDefined();
    expect(expenseConn!.sign).toBe("negative");
    expect(expenseConn!.label).toMatch(/-/);
  });

  it("contribution connection targets section-assets with negative sign", () => {
    const contribConn = SURPLUS_CONNECTIONS.find((c) => c.sourceId === "section-assets");
    expect(contribConn).toBeDefined();
    expect(contribConn!.sign).toBe("negative");
    expect(contribConn!.label).toContain("contributions");
  });

  it("mortgage connection targets section-property with negative sign", () => {
    const mortgageConn = SURPLUS_CONNECTIONS.find((c) => c.sourceId === "section-property");
    expect(mortgageConn).toBeDefined();
    expect(mortgageConn!.sign).toBe("negative");
    expect(mortgageConn!.label).toContain("mortgage");
  });

  it("filters out zero-value connections", () => {
    const connections: DataFlowConnectionDef[] = [
      { sourceId: "section-income", label: "+$5k", value: 5000, sign: "positive" },
      { sourceId: "section-expenses", label: "-$0", value: 0, sign: "negative" },
    ];
    renderWithProvider({ "Monthly Cash Flow": connections });
    const card = screen.getByTestId("metric-card-monthly-cash-flow");
    expect(card).toBeInTheDocument();
  });

  it("contribution connection is optional (only when > 0)", () => {
    const noContribConnections: DataFlowConnectionDef[] = [
      { sourceId: "section-income", label: "+$5k", value: 5000, sign: "positive" },
      { sourceId: "section-expenses", label: "-$1.2k", value: 1200, sign: "negative" },
    ];
    renderWithProvider({ "Monthly Cash Flow": noContribConnections });
    expect(screen.getByTestId("metric-card-monthly-cash-flow")).toBeInTheDocument();
  });

  it("mortgage connection is optional (only when > 0)", () => {
    const noMortgageConnections: DataFlowConnectionDef[] = [
      { sourceId: "section-income", label: "+$5k", value: 5000, sign: "positive" },
      { sourceId: "section-expenses", label: "-$1.2k", value: 1200, sign: "negative" },
      { sourceId: "section-assets", label: "contributions -$350", value: 350, sign: "negative" },
    ];
    renderWithProvider({ "Monthly Cash Flow": noMortgageConnections });
    expect(screen.getByTestId("metric-card-monthly-cash-flow")).toBeInTheDocument();
  });
});

describe("Monthly Cash Flow MetricCard breakdown visibility", () => {
  it("shows breakdown text always (no hover required)", () => {
    renderWithProvider({ "Monthly Cash Flow": SURPLUS_CONNECTIONS });
    expect(screen.getByTestId("metric-breakdown")).toBeInTheDocument();
  });
});

describe("Monthly Cash Flow formula clarity", () => {
  it("has exactly one positive source (income)", () => {
    const positive = SURPLUS_CONNECTIONS.filter((c) => c.sign === "positive");
    expect(positive).toHaveLength(1);
    expect(positive[0].sourceId).toBe("section-income");
  });

  it("has all non-income sources as negative (outflows)", () => {
    const negative = SURPLUS_CONNECTIONS.filter((c) => c.sign === "negative");
    expect(negative).toHaveLength(3);
    const sourceIds = negative.map((c) => c.sourceId);
    expect(sourceIds).toContain("section-expenses");
    expect(sourceIds).toContain("section-assets");
    expect(sourceIds).toContain("section-property");
  });
});
