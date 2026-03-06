import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  SourceSummaryCard,
  ExplainerModal,
  type SourceMetadata,
  type ActiveConnection,
  type ActiveTargetMeta,
} from "@/components/DataFlowArrows";

describe("SourceSummaryCard", () => {
  it("renders section name with icon", () => {
    render(
      <SourceSummaryCard
        sourceId="section-assets"
        sectionName="Assets"
        items={[{ label: "Savings", value: 5000 }]}
        total="$5,000"
        isPositive={true}
        ovalSeed={1}
      />
    );
    expect(screen.getByTestId("source-summary-title-section-assets")).toHaveTextContent("Assets");
    // Icon should be present (💰 for assets)
    expect(screen.getByText("💰")).toBeInTheDocument();
  });

  it("renders individual items with values", () => {
    render(
      <SourceSummaryCard
        sourceId="section-assets"
        sectionName="Assets"
        items={[
          { label: "Savings Account", value: 5000 },
          { label: "TFSA", value: 22000 },
          { label: "RRSP", value: 28000 },
        ]}
        total="$55,000"
        isPositive={true}
        ovalSeed={1}
      />
    );
    const itemsList = screen.getByTestId("source-summary-items-section-assets");
    expect(itemsList).toBeInTheDocument();
    expect(screen.getByText("Savings Account")).toBeInTheDocument();
    expect(screen.getByText("$5,000")).toBeInTheDocument();
    expect(screen.getByText("TFSA")).toBeInTheDocument();
    expect(screen.getByText("$22,000")).toBeInTheDocument();
    expect(screen.getByText("RRSP")).toBeInTheDocument();
    expect(screen.getByText("$28,000")).toBeInTheDocument();
  });

  it("renders bold total with hand-drawn oval", () => {
    render(
      <SourceSummaryCard
        sourceId="section-assets"
        sectionName="Assets"
        items={[{ label: "Savings", value: 5000 }]}
        total="$5,000"
        isPositive={true}
        ovalSeed={1}
      />
    );
    expect(screen.getByTestId("source-summary-total-section-assets")).toHaveTextContent("$5,000");
    expect(screen.getByTestId("source-summary-oval-section-assets")).toBeInTheDocument();
  });

  it("uses green border for positive sources", () => {
    render(
      <SourceSummaryCard
        sourceId="section-assets"
        sectionName="Assets"
        items={[]}
        total="$5,000"
        isPositive={true}
        ovalSeed={1}
      />
    );
    const card = screen.getByTestId("source-summary-section-assets");
    expect(card.className).toContain("border-l-green-500");
  });

  it("uses red border for negative sources", () => {
    render(
      <SourceSummaryCard
        sourceId="section-debts"
        sectionName="Debts"
        items={[]}
        total="$10,000"
        isPositive={false}
        ovalSeed={2}
      />
    );
    const card = screen.getByTestId("source-summary-section-debts");
    expect(card.className).toContain("border-l-rose-500");
  });

  it("shows top 5 items and +N more when >6 items", () => {
    const items = [
      { label: "Item 1", value: 10000 },
      { label: "Item 2", value: 9000 },
      { label: "Item 3", value: 8000 },
      { label: "Item 4", value: 7000 },
      { label: "Item 5", value: 6000 },
      { label: "Item 6", value: 5000 },
      { label: "Item 7", value: 4000 },
    ];
    render(
      <SourceSummaryCard
        sourceId="section-assets"
        sectionName="Assets"
        items={items}
        total="$49,000"
        isPositive={true}
        ovalSeed={1}
      />
    );
    // Should show first 5 items
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 5")).toBeInTheDocument();
    // Items 6 and 7 should be hidden
    expect(screen.queryByText("Item 6")).not.toBeInTheDocument();
    expect(screen.queryByText("Item 7")).not.toBeInTheDocument();
    // Should show "+2 more"
    expect(screen.getByTestId("source-summary-more-section-assets")).toHaveTextContent("+2 more");
  });

  it("shows exactly 5 items without +N more", () => {
    const items = [
      { label: "A", value: 100 },
      { label: "B", value: 200 },
      { label: "C", value: 300 },
      { label: "D", value: 400 },
      { label: "E", value: 500 },
    ];
    render(
      <SourceSummaryCard
        sourceId="section-income"
        sectionName="Income"
        items={items}
        total="$1,500"
        isPositive={true}
        ovalSeed={3}
      />
    );
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("E")).toBeInTheDocument();
    expect(screen.queryByTestId("source-summary-more-section-income")).not.toBeInTheDocument();
  });

  it("renders without items when items is undefined", () => {
    render(
      <SourceSummaryCard
        sourceId="section-assets"
        sectionName="Assets"
        items={undefined}
        total="$5,000"
        isPositive={true}
        ovalSeed={1}
      />
    );
    expect(screen.queryByTestId("source-summary-items-section-assets")).not.toBeInTheDocument();
    expect(screen.getByTestId("source-summary-total-section-assets")).toHaveTextContent("$5,000");
  });

  it("renders without items when items is empty", () => {
    render(
      <SourceSummaryCard
        sourceId="section-assets"
        sectionName="Assets"
        items={[]}
        total="$0"
        isPositive={true}
        ovalSeed={1}
      />
    );
    expect(screen.queryByTestId("source-summary-items-section-assets")).not.toBeInTheDocument();
  });

  it("shows correct icon for each section type", () => {
    const sections = [
      { id: "section-debts", icon: "💳" },
      { id: "section-income", icon: "💵" },
      { id: "section-expenses", icon: "🧾" },
      { id: "section-property", icon: "🏠" },
      { id: "section-stocks", icon: "📊" },
    ];
    for (const { id, icon } of sections) {
      const { unmount } = render(
        <SourceSummaryCard
          sourceId={id}
          sectionName="Test"
          items={[]}
          total="$0"
          isPositive={true}
          ovalSeed={1}
        />
      );
      expect(screen.getByText(icon)).toBeInTheDocument();
      unmount();
    }
  });

  it("uses absolute values for item display", () => {
    render(
      <SourceSummaryCard
        sourceId="section-debts"
        sectionName="Debts"
        items={[{ label: "Credit Card", value: -3500 }]}
        total="$3,500"
        isPositive={false}
        ovalSeed={1}
      />
    );
    // Should display $3,500 not -$3,500 in the items list
    const itemsList = screen.getByTestId("source-summary-items-section-debts");
    expect(itemsList).toHaveTextContent("$3,500");
  });
});

describe("ExplainerModal with SourceSummaryCards", () => {
  const mockGetSourceMetadata = (id: string): SourceMetadata | undefined => {
    const map: Record<string, SourceMetadata> = {
      "section-assets": {
        label: "Assets",
        value: 55000,
        items: [
          { label: "Savings Account", value: 5000 },
          { label: "TFSA", value: 22000 },
          { label: "RRSP", value: 28000 },
        ],
      },
      "section-debts": {
        label: "Debts",
        value: 25000,
        items: [
          { label: "Credit Card", value: 5000 },
          { label: "Car Loan", value: 20000 },
        ],
      },
    };
    return map[id];
  };

  const mockConnections: ActiveConnection[] = [
    { sourceId: "section-assets", targetId: "metric-net-worth", label: "+$55k", value: 55000, sign: "positive" },
    { sourceId: "section-debts", targetId: "metric-net-worth", label: "-$25k", value: 25000, sign: "negative" },
  ];

  const mockTargetMeta: ActiveTargetMeta = { label: "Net Worth", formattedValue: "$30,000" };

  it("renders SourceSummaryCards with item details", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    // Assets card shows items
    expect(screen.getByText("Savings Account")).toBeInTheDocument();
    expect(screen.getByText("TFSA")).toBeInTheDocument();
    expect(screen.getByText("RRSP")).toBeInTheDocument();
    // Debts card shows items
    expect(screen.getByText("Credit Card")).toBeInTheDocument();
    expect(screen.getByText("Car Loan")).toBeInTheDocument();
  });

  it("renders SourceSummaryCard totals with oval annotations", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    expect(screen.getByTestId("source-summary-oval-section-assets")).toBeInTheDocument();
    expect(screen.getByTestId("source-summary-oval-section-debts")).toBeInTheDocument();
  });

  it("shows operators between source cards", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    expect(screen.getByTestId("explainer-operator-1")).toBeInTheDocument();
  });
});
