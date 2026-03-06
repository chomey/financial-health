import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
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
  handDrawnOval,
  handDrawnLine,
  ExplainerModal,
  DataFlowProvider,
  useDataFlow,
  prioritizeConnections,
  MAX_ARROWS,
  type ActiveConnection,
} from "@/components/DataFlowArrows";

// --- Hand-drawn SVG utility tests ---

describe("handDrawnOval", () => {
  it("returns a valid SVG path string starting with M and ending with Z", () => {
    const path = handDrawnOval(50, 50, 30, 20);
    expect(path).toMatch(/^M /);
    expect(path).toContain(" Z");
  });

  it("generates different paths for different seeds", () => {
    const path1 = handDrawnOval(50, 50, 30, 20, 1);
    const path2 = handDrawnOval(50, 50, 30, 20, 2);
    expect(path1).not.toBe(path2);
  });

  it("generates paths centered near the given cx/cy", () => {
    const path = handDrawnOval(100, 200, 30, 20, 0);
    // The first point should be near cx + rx, cy
    const firstCoords = path.match(/^M ([\d.-]+) ([\d.-]+)/);
    expect(firstCoords).not.toBeNull();
    const x = parseFloat(firstCoords![1]);
    const y = parseFloat(firstCoords![2]);
    // Should be near cx + rx for the first point (angle = 0)
    expect(Math.abs(x - 130)).toBeLessThan(10); // within jitter range
    expect(Math.abs(y - 200)).toBeLessThan(10);
  });

  it("contains Q (quadratic bezier) commands", () => {
    const path = handDrawnOval(50, 50, 30, 20);
    expect(path).toContain(" Q ");
  });
});

describe("handDrawnLine", () => {
  it("returns a valid SVG path string starting with M", () => {
    const path = handDrawnLine(0, 0, 100, 100);
    expect(path).toMatch(/^M /);
  });

  it("starts at the given start point", () => {
    const path = handDrawnLine(10, 20, 300, 400);
    expect(path).toMatch(/^M 10\.0 20\.0/);
  });

  it("ends at the given end point", () => {
    const path = handDrawnLine(10, 20, 300, 400);
    expect(path).toMatch(/300\.0 400\.0$/);
  });

  it("contains C (cubic bezier) command for smooth curve", () => {
    const path = handDrawnLine(0, 0, 100, 0);
    expect(path).toContain(" C ");
  });

  it("generates different paths for different seeds", () => {
    const path1 = handDrawnLine(0, 0, 100, 100, 1);
    const path2 = handDrawnLine(0, 0, 100, 100, 2);
    expect(path1).not.toBe(path2);
  });
});

// --- ExplainerModal rendering tests ---

describe("ExplainerModal", () => {
  const mockConnections: ActiveConnection[] = [
    { sourceId: "section-assets", targetId: "net-worth", label: "+$65k", value: 65000, sign: "positive" },
    { sourceId: "section-debts", targetId: "net-worth", label: "-$295k", value: 295000, sign: "negative" },
  ];
  const mockTargetMeta = { label: "Net Worth", formattedValue: "-$230,000" };
  const mockGetSourceMetadata = (id: string) => {
    const map: Record<string, { label: string; value: number }> = {
      "section-assets": { label: "Assets", value: 65000 },
      "section-debts": { label: "Debts", value: 295000 },
    };
    return map[id];
  };

  it("renders the modal with metric title and value", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    expect(screen.getByTestId("explainer-modal")).toBeInTheDocument();
    expect(screen.getByTestId("explainer-title")).toHaveTextContent("Net Worth");
    expect(screen.getByTestId("explainer-value")).toHaveTextContent("-$230,000");
  });

  it("renders source cards for each connection", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    expect(screen.getByTestId("explainer-source-section-assets")).toBeInTheDocument();
    expect(screen.getByTestId("explainer-source-section-debts")).toBeInTheDocument();
  });

  it("renders operator symbols between source cards", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    // Second connection has an operator (index > 0)
    expect(screen.getByTestId("explainer-operator-1")).toBeInTheDocument();
  });

  it("renders hand-drawn oval annotations around values", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    expect(screen.getByTestId("explainer-oval-section-assets")).toBeInTheDocument();
    expect(screen.getByTestId("explainer-oval-section-debts")).toBeInTheDocument();
  });

  it("renders the result section with sum bar", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    expect(screen.getByTestId("explainer-result-section")).toBeInTheDocument();
    expect(screen.getByTestId("explainer-result-value")).toHaveTextContent("-$230,000");
  });

  it("renders close button", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    expect(screen.getByTestId("explainer-close")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    vi.useFakeTimers();
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={onClose}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    fireEvent.click(screen.getByTestId("explainer-close"));
    vi.advanceTimersByTime(200);
    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    vi.useFakeTimers();
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={onClose}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    fireEvent.keyDown(window, { key: "Escape" });
    vi.advanceTimersByTime(200);
    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("calls onClose when clicking backdrop", () => {
    const onClose = vi.fn();
    vi.useFakeTimers();
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={onClose}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    fireEvent.click(screen.getByTestId("explainer-backdrop"));
    vi.advanceTimersByTime(200);
    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("has correct aria attributes", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    const backdrop = screen.getByTestId("explainer-backdrop");
    expect(backdrop).toHaveAttribute("aria-modal", "true");
    expect(backdrop).toHaveAttribute("role", "dialog");
    expect(backdrop).toHaveAttribute("aria-label", "How Net Worth is calculated");
  });

  it("uses green border for positive sources and red for negative", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    const assetsCard = screen.getByTestId("explainer-source-section-assets");
    const debtsCard = screen.getByTestId("explainer-source-section-debts");
    expect(assetsCard.className).toContain("border-l-green-500");
    expect(debtsCard.className).toContain("border-l-rose-500");
  });
});

// --- DataFlowProvider shows ExplainerModal when active ---

describe("DataFlowProvider with ExplainerModal", () => {
  it("does not render explainer modal when no active target", () => {
    render(
      <DataFlowProvider>
        <div>content</div>
      </DataFlowProvider>
    );
    expect(screen.queryByTestId("explainer-modal")).toBeNull();
  });

  it("renders explainer modal when activeTarget, connections, and meta are set", () => {
    let ctx: ReturnType<typeof useDataFlow> | null = null;

    function TestComponent() {
      ctx = useDataFlow();
      return <div>test</div>;
    }

    render(
      <DataFlowProvider>
        <TestComponent />
      </DataFlowProvider>
    );

    act(() => {
      ctx!.setActiveTarget("net-worth");
      ctx!.setActiveConnections([
        { sourceId: "section-assets", targetId: "net-worth", label: "+$65k", value: 65000, sign: "positive" },
      ]);
      ctx!.setActiveTargetMeta({ label: "Net Worth", formattedValue: "-$230,000" });
    });

    expect(screen.getByTestId("explainer-modal")).toBeInTheDocument();
  });

  it("does not render SVG overlay or spotlight overlay", () => {
    render(
      <DataFlowProvider>
        <div>content</div>
      </DataFlowProvider>
    );
    expect(screen.queryByTestId("data-flow-overlay")).toBeNull();
    expect(screen.queryByTestId("spotlight-overlay")).toBeNull();
  });
});

// --- prioritizeConnections (preserved from before) ---

describe("prioritizeConnections", () => {
  it("returns all connections when under MAX_ARROWS limit", () => {
    const connections: ActiveConnection[] = [
      { sourceId: "a", targetId: "t", value: 100, sign: "positive" },
      { sourceId: "b", targetId: "t", value: 200, sign: "negative" },
    ];
    const result = prioritizeConnections(connections);
    expect(result).toHaveLength(2);
  });

  it("limits to MAX_ARROWS when over limit", () => {
    const connections: ActiveConnection[] = Array.from({ length: 12 }, (_, i) => ({
      sourceId: `source-${i}`,
      targetId: "target",
      value: i * 100,
      sign: "positive" as const,
    }));
    const result = prioritizeConnections(connections);
    expect(result).toHaveLength(MAX_ARROWS);
  });

  it("prioritizes by absolute value magnitude", () => {
    const connections: ActiveConnection[] = [
      { sourceId: "small", targetId: "t", value: 10, sign: "positive" },
      { sourceId: "large", targetId: "t", value: 100000, sign: "negative" },
      { sourceId: "medium", targetId: "t", value: 5000, sign: "positive" },
    ];
    const result = prioritizeConnections(connections, 2);
    expect(result[0].sourceId).toBe("large");
    expect(result[1].sourceId).toBe("medium");
  });

  it("MAX_ARROWS constant is 8", () => {
    expect(MAX_ARROWS).toBe(8);
  });
});
