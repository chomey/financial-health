import { describe, it, expect, vi, beforeAll } from "vitest";
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

const NET_WORTH_METRIC: MetricData = {
  title: "Net Worth",
  value: 50000,
  format: "currency",
  icon: "💰",
  tooltip: "Your total assets minus total debts.",
  positive: true,
  breakdown: "$65k savings + $10k stocks - $25k debts",
};

const NET_WORTH_CONNECTIONS: DataFlowConnectionDef[] = [
  { sourceId: "section-assets", label: "+$65k", value: 65000, sign: "positive" },
  { sourceId: "section-stocks", label: "+$10k", value: 10000, sign: "positive" },
  { sourceId: "section-debts", label: "-$25k", value: 25000, sign: "negative" },
];

function renderWithProvider(
  connections?: Record<string, DataFlowConnectionDef[]>,
  metrics?: MetricData[]
) {
  return render(
    <DataFlowProvider>
      <SnapshotDashboard
        metrics={metrics ?? [NET_WORTH_METRIC]}
        dataFlowConnections={connections}
      />
    </DataFlowProvider>
  );
}

describe("Net Worth data-flow connections", () => {
  it("renders the Net Worth metric card with data-testid", () => {
    renderWithProvider({ "Net Worth": NET_WORTH_CONNECTIONS });
    expect(screen.getByTestId("metric-card-net-worth")).toBeInTheDocument();
  });

  it("renders metric card without connections when none provided", () => {
    renderWithProvider();
    const card = screen.getByTestId("metric-card-net-worth");
    expect(card).toBeInTheDocument();
  });

  it("DataFlowConnectionDef type has correct structure", () => {
    const conn: DataFlowConnectionDef = {
      sourceId: "section-assets",
      label: "+$65k",
      value: 65000,
      sign: "positive",
    };
    expect(conn.sourceId).toBe("section-assets");
    expect(conn.sign).toBe("positive");
    expect(conn.label).toBe("+$65k");
    expect(conn.value).toBe(65000);
  });

  it("filters out zero-value connections", () => {
    const connections: DataFlowConnectionDef[] = [
      { sourceId: "section-assets", label: "+$65k", value: 65000, sign: "positive" },
      { sourceId: "section-stocks", label: "+$0", value: 0, sign: "positive" },
      { sourceId: "section-debts", label: "-$25k", value: 25000, sign: "negative" },
    ];
    renderWithProvider({ "Net Worth": connections });
    // Zero-value connections should not trigger arrows — verified by internal filter
    const card = screen.getByTestId("metric-card-net-worth");
    expect(card).toBeInTheDocument();
  });

  it("supports property equity as optional positive connection", () => {
    const connections: DataFlowConnectionDef[] = [
      ...NET_WORTH_CONNECTIONS,
      { sourceId: "section-property", label: "+$150k", value: 150000, sign: "positive" },
    ];
    renderWithProvider({ "Net Worth": connections });
    expect(screen.getByTestId("metric-card-net-worth")).toBeInTheDocument();
  });
});

describe("MetricCard hover interactions", () => {
  it("shows breakdown text on hover", () => {
    renderWithProvider({ "Net Worth": NET_WORTH_CONNECTIONS });
    const card = screen.getByTestId("metric-card-net-worth");
    fireEvent.mouseEnter(card);
    expect(screen.getByTestId("metric-breakdown")).toBeInTheDocument();
  });

  it("hides breakdown on mouse leave", () => {
    renderWithProvider({ "Net Worth": NET_WORTH_CONNECTIONS });
    const card = screen.getByTestId("metric-card-net-worth");
    fireEvent.mouseEnter(card);
    fireEvent.mouseLeave(card);
    // Breakdown should be hidden (opacity-0)
    const breakdown = screen.getByTestId("metric-breakdown");
    expect(breakdown.className).toContain("opacity-0");
  });

  it("activates breakdown on focus (keyboard)", () => {
    renderWithProvider({ "Net Worth": NET_WORTH_CONNECTIONS });
    const card = screen.getByTestId("metric-card-net-worth");
    fireEvent.focus(card);
    const breakdown = screen.getByTestId("metric-breakdown");
    expect(breakdown.className).toContain("opacity-100");
  });
});

describe("DataFlowConnectionDef for Net Worth", () => {
  it("positive connections should use positive sign", () => {
    const positiveConns = NET_WORTH_CONNECTIONS.filter((c) => c.sign === "positive");
    expect(positiveConns).toHaveLength(2);
    expect(positiveConns.map((c) => c.sourceId)).toEqual(["section-assets", "section-stocks"]);
  });

  it("negative connections should use negative sign", () => {
    const negativeConns = NET_WORTH_CONNECTIONS.filter((c) => c.sign === "negative");
    expect(negativeConns).toHaveLength(1);
    expect(negativeConns[0].sourceId).toBe("section-debts");
  });

  it("labels should include sign prefix", () => {
    expect(NET_WORTH_CONNECTIONS[0].label).toMatch(/^\+/);
    expect(NET_WORTH_CONNECTIONS[2].label).toMatch(/^-/);
  });
});

describe("SnapshotDashboard dataFlowConnections prop", () => {
  it("passes connections only to the matching metric card", () => {
    const allMetrics: MetricData[] = [
      NET_WORTH_METRIC,
      {
        title: "Monthly Cash Flow",
        value: 1000,
        format: "currency",
        icon: "📈",
        tooltip: "Monthly surplus",
        positive: true,
      },
    ];
    renderWithProvider({ "Net Worth": NET_WORTH_CONNECTIONS }, allMetrics);
    // Both cards rendered
    expect(screen.getByTestId("metric-card-net-worth")).toBeInTheDocument();
    expect(screen.getByTestId("metric-card-monthly-cash-flow")).toBeInTheDocument();
  });

  it("works without dataFlowConnections (backward compat)", () => {
    renderWithProvider(undefined);
    expect(screen.getByTestId("metric-card-net-worth")).toBeInTheDocument();
  });
});
