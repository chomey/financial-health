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

describe("Insight card data-flow (click-to-explain)", () => {
  it("renders insight cards with data-testid attributes", () => {
    renderWithProvider(INSIGHT_CONNECTIONS);
    const cards = screen.getAllByRole("article");
    expect(cards.length).toBeGreaterThanOrEqual(3);
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

  it("opens explainer modal on click of insight card with connections", () => {
    renderWithProvider(INSIGHT_CONNECTIONS);
    const surplusCard = screen.getByTestId("insight-card-surplus-positive");
    fireEvent.click(surplusCard);
    expect(screen.getByTestId("explainer-modal")).toBeInTheDocument();
  });

  it("renders without connections (no errors on click)", () => {
    renderWithProvider();
    const cards = screen.getAllByRole("article");
    fireEvent.click(cards[0]);
    // Should not throw and should not show modal (no connections)
    expect(screen.queryByTestId("explainer-modal")).toBeNull();
  });

  it("opens explainer modal on keyboard Enter", () => {
    renderWithProvider(INSIGHT_CONNECTIONS);
    const surplusCard = screen.getByTestId("insight-card-surplus-positive");
    fireEvent.keyDown(surplusCard, { key: "Enter" });
    expect(screen.getByTestId("explainer-modal")).toBeInTheDocument();
  });

  it("insight cards with connections have pointer cursor", () => {
    renderWithProvider(INSIGHT_CONNECTIONS);
    const surplusCard = screen.getByTestId("insight-card-surplus-positive");
    expect(surplusCard.className).toContain("cursor-pointer");
  });
});
