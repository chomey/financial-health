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

import InsightsPanel, { MOCK_FINANCIAL_DATA } from "@/components/InsightsPanel";
import { DataFlowProvider, DataFlowSourceItem } from "@/components/DataFlowArrows";
import type { DataFlowConnectionDef } from "@/components/SnapshotDashboard";

const INSIGHT_CONNECTIONS: Record<string, DataFlowConnectionDef[]> = {
  "runway": [
    { sourceId: "section-assets", label: "+$65k", value: 65000, sign: "positive" },
    { sourceId: "section-expenses", label: "-$3k", value: 3000, sign: "negative" },
  ],
  "surplus": [
    { sourceId: "section-income", label: "+$6k", value: 6000, sign: "positive" },
    { sourceId: "section-expenses", label: "-$3k", value: 3000, sign: "negative" },
  ],
  "net-worth": [
    { sourceId: "section-assets", label: "+$65k", value: 65000, sign: "positive" },
    { sourceId: "section-debts", label: "-$295k", value: 295000, sign: "negative" },
  ],
  "savings-rate": [
    { sourceId: "section-income", label: "+$6k", value: 6000, sign: "positive" },
    { sourceId: "section-expenses", label: "-$3k", value: 3000, sign: "negative" },
  ],
  "debt-interest": [
    { sourceId: "section-debts", label: "-$295k", value: 295000, sign: "negative" },
  ],
  "tax": [
    { sourceId: "section-income", label: "+$76k", value: 6300, sign: "positive" },
  ],
  "withdrawal-tax": [
    { sourceId: "section-assets", label: "+$65k", value: 65000, sign: "positive" },
  ],
};

function renderWithProvider(connections?: Record<string, DataFlowConnectionDef[]>) {
  return render(
    <DataFlowProvider>
      {/* Register source elements so highlight attributes can be set */}
      <DataFlowSourceItem id="section-assets" label="Assets" value={65000}>
        <div>Assets Section</div>
      </DataFlowSourceItem>
      <DataFlowSourceItem id="section-debts" label="Debts" value={295000}>
        <div>Debts Section</div>
      </DataFlowSourceItem>
      <DataFlowSourceItem id="section-income" label="Income" value={6000}>
        <div>Income Section</div>
      </DataFlowSourceItem>
      <DataFlowSourceItem id="section-expenses" label="Expenses" value={3000}>
        <div>Expenses Section</div>
      </DataFlowSourceItem>
      <InsightsPanel data={MOCK_FINANCIAL_DATA} insightConnections={connections} />
    </DataFlowProvider>
  );
}

describe("Insight card data-flow arrows", () => {
  it("renders insight cards with data-testid attributes", () => {
    renderWithProvider(INSIGHT_CONNECTIONS);
    // Should have insight cards with specific test ids
    const cards = screen.getAllByRole("article");
    expect(cards.length).toBeGreaterThanOrEqual(3);
    // Each card should have a data-testid
    for (const card of cards) {
      expect(card.getAttribute("data-testid")).toMatch(/^insight-card-/);
    }
  });

  it("renders insight cards with data-insight-type attribute", () => {
    renderWithProvider(INSIGHT_CONNECTIONS);
    const cards = screen.getAllByRole("article");
    for (const card of cards) {
      expect(card.getAttribute("data-insight-type")).toBeTruthy();
    }
  });

  it("insight cards are focusable (tabIndex=0)", () => {
    renderWithProvider(INSIGHT_CONNECTIONS);
    const cards = screen.getAllByRole("article");
    for (const card of cards) {
      expect(card.getAttribute("tabindex")).toBe("0");
    }
  });

  it("highlights source sections on hover of runway insight", () => {
    renderWithProvider(INSIGHT_CONNECTIONS);
    // Find the runway insight card
    const runwayCard = screen.getByTestId("insight-card-runway-strong") ??
      screen.getByTestId("insight-card-runway-solid") ??
      screen.getByTestId("insight-card-runway-building");

    fireEvent.mouseEnter(runwayCard);

    // Check that assets source element got highlighted
    const assetsSource = document.querySelector('[data-dataflow-source="section-assets"]');
    expect(assetsSource?.getAttribute("data-dataflow-highlighted")).toBe("positive");

    // Check that expenses source element got highlighted
    const expensesSource = document.querySelector('[data-dataflow-source="section-expenses"]');
    expect(expensesSource?.getAttribute("data-dataflow-highlighted")).toBe("negative");
  });

  it("clears highlights on mouse leave", () => {
    renderWithProvider(INSIGHT_CONNECTIONS);
    const runwayCard = screen.getByTestId("insight-card-runway-strong") ??
      screen.getByTestId("insight-card-runway-solid");

    fireEvent.mouseEnter(runwayCard);
    fireEvent.mouseLeave(runwayCard);

    const assetsSource = document.querySelector('[data-dataflow-source="section-assets"]');
    expect(assetsSource?.getAttribute("data-dataflow-highlighted")).toBeNull();
  });

  it("highlights debts on hover of net-worth insight", () => {
    renderWithProvider(INSIGHT_CONNECTIONS);
    // Net worth insight should exist (since net worth is negative: -229500)
    const netWorthCard = screen.getByTestId("insight-card-networth-growing");

    fireEvent.mouseEnter(netWorthCard);

    const debtsSource = document.querySelector('[data-dataflow-source="section-debts"]');
    expect(debtsSource?.getAttribute("data-dataflow-highlighted")).toBe("negative");
  });

  it("renders without connections (no errors on hover)", () => {
    renderWithProvider();
    const cards = screen.getAllByRole("article");
    // Hovering should not throw
    fireEvent.mouseEnter(cards[0]);
    fireEvent.mouseLeave(cards[0]);
  });

  it("highlights income on hover of surplus insight", () => {
    renderWithProvider(INSIGHT_CONNECTIONS);
    const surplusCard = screen.getByTestId("insight-card-surplus-positive");

    fireEvent.mouseEnter(surplusCard);

    const incomeSource = document.querySelector('[data-dataflow-source="section-income"]');
    expect(incomeSource?.getAttribute("data-dataflow-highlighted")).toBe("positive");
  });

  it("activates arrows on focus (keyboard navigation)", () => {
    renderWithProvider(INSIGHT_CONNECTIONS);
    const surplusCard = screen.getByTestId("insight-card-surplus-positive");

    fireEvent.focus(surplusCard);

    const incomeSource = document.querySelector('[data-dataflow-source="section-income"]');
    expect(incomeSource?.getAttribute("data-dataflow-highlighted")).toBe("positive");
  });

  it("clears arrows on blur", () => {
    renderWithProvider(INSIGHT_CONNECTIONS);
    const surplusCard = screen.getByTestId("insight-card-surplus-positive");

    fireEvent.focus(surplusCard);
    fireEvent.blur(surplusCard);

    const incomeSource = document.querySelector('[data-dataflow-source="section-income"]');
    expect(incomeSource?.getAttribute("data-dataflow-highlighted")).toBeNull();
  });
});
