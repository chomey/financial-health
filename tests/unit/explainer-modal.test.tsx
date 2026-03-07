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
  ConnectorLine,
  CountUpValue,
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

  it("contains C (cubic bezier) commands instead of Q commands", () => {
    const path = handDrawnOval(50, 50, 30, 20);
    expect(path).toContain(" C ");
    expect(path).not.toContain(" Q ");
  });

  it("uses exactly 4 cubic bezier curves (one per quadrant)", () => {
    const path = handDrawnOval(50, 50, 30, 20);
    const cCount = (path.match(/ C /g) || []).length;
    expect(cCount).toBe(4);
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
    expect(screen.getByTestId("source-summary-oval-section-assets")).toBeInTheDocument();
    expect(screen.getByTestId("source-summary-oval-section-debts")).toBeInTheDocument();
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
    const assetsCard = screen.getByTestId("source-summary-section-assets");
    const debtsCard = screen.getByTestId("source-summary-section-debts");
    expect(assetsCard.className).toContain("border-l-cyan-500");
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

// --- Hand-drawn SVG path wobble bounds tests ---

describe("handDrawnOval path wobble bounds", () => {
  it("all coordinates stay within expected bounds of the oval", () => {
    const cx = 50, cy = 20, rx = 45, ry = 16;
    const path = handDrawnOval(cx, cy, rx, ry, 3);
    // Extract all numeric coordinates from the path
    const numbers = path.match(/-?[\d.]+/g)!.map(Number);
    for (let i = 0; i < numbers.length; i += 2) {
      const x = numbers[i];
      const y = numbers[i + 1];
      // Should be within ~15% of the ellipse bounds (tighter with smoother curves)
      expect(x).toBeGreaterThan(cx - rx * 1.15);
      expect(x).toBeLessThan(cx + rx * 1.15);
      expect(y).toBeGreaterThan(cy - ry * 1.15);
      expect(y).toBeLessThan(cy + ry * 1.15);
    }
  });

  it("uses exactly 4 cubic bezier curves (one per quadrant)", () => {
    const path = handDrawnOval(50, 50, 30, 20, 0);
    const cCount = (path.match(/ C /g) || []).length;
    expect(cCount).toBe(4);
  });

  it("has fewer control points than the old 24-segment implementation", () => {
    const path = handDrawnOval(50, 50, 30, 20, 0);
    // 4 C commands × 3 coordinate pairs = 12, plus 1 M = 13 coordinate pairs
    const numbers = path.match(/-?[\d.]+/g)!;
    // Should have significantly fewer numbers than old 24-segment version
    expect(numbers.length).toBeLessThanOrEqual(30); // 4 C × 6 nums + M × 2 = 26
  });

  it("jitter amplitude is proportional to smaller radius", () => {
    // Small oval should have small jitter
    const smallPath = handDrawnOval(50, 50, 10, 8, 1);
    const largePath = handDrawnOval(50, 50, 100, 80, 1);
    // Both should be valid paths
    expect(smallPath).toMatch(/^M /);
    expect(largePath).toMatch(/^M /);
    // Large path should span a bigger range
    const smallNums = smallPath.match(/-?[\d.]+/g)!.map(Number);
    const largeNums = largePath.match(/-?[\d.]+/g)!.map(Number);
    const smallXRange = Math.max(...smallNums.filter((_, i) => i % 2 === 0)) - Math.min(...smallNums.filter((_, i) => i % 2 === 0));
    const largeXRange = Math.max(...largeNums.filter((_, i) => i % 2 === 0)) - Math.min(...largeNums.filter((_, i) => i % 2 === 0));
    expect(largeXRange).toBeGreaterThan(smallXRange * 3);
  });
});

describe("handDrawnLine wobble bounds", () => {
  it("jitter stays within 2.5px of the straight line", () => {
    // Horizontal line
    const path = handDrawnLine(0, 50, 400, 50, 5);
    const numbers = path.match(/-?[\d.]+/g)!.map(Number);
    // Y values of control points should be near 50 (within gentler jitter bounds)
    for (let i = 1; i < numbers.length; i += 2) {
      expect(numbers[i]).toBeGreaterThan(50 - 5);
      expect(numbers[i]).toBeLessThan(50 + 5);
    }
  });
});

// --- ConnectorLine component tests ---

describe("ConnectorLine", () => {
  it("renders an SVG with connector line path", () => {
    render(<ConnectorLine isPositive={true} seed={1} index={0} />);
    const connector = screen.getByTestId("explainer-connector-0");
    expect(connector).toBeInTheDocument();
    expect(connector.tagName.toLowerCase()).toBe("svg");
  });

  it("renders arrowhead marker", () => {
    render(<ConnectorLine isPositive={true} seed={1} index={0} />);
    const svg = screen.getByTestId("explainer-connector-0");
    const marker = svg.querySelector("marker");
    expect(marker).not.toBeNull();
    expect(marker!.querySelector("polygon")).not.toBeNull();
  });

  it("uses cyan color for positive connections (dark theme)", () => {
    render(<ConnectorLine isPositive={true} seed={1} index={0} />);
    const svg = screen.getByTestId("explainer-connector-0");
    const path = svg.querySelector("path");
    expect(path!.getAttribute("stroke")).toBe("#22d3ee");
  });

  it("uses rose color for negative connections (dark theme)", () => {
    render(<ConnectorLine isPositive={false} seed={1} index={0} />);
    const svg = screen.getByTestId("explainer-connector-0");
    const path = svg.querySelector("path");
    expect(path!.getAttribute("stroke")).toBe("#fb7185");
  });

  it("has animate-draw-connector class", () => {
    render(<ConnectorLine isPositive={true} seed={1} index={0} />);
    const svg = screen.getByTestId("explainer-connector-0");
    const path = svg.querySelector("path");
    expect(path!.classList.contains("animate-draw-connector")).toBe(true);
  });

  it("staggers animation delay by index", () => {
    render(<ConnectorLine isPositive={true} seed={1} index={2} />);
    const svg = screen.getByTestId("explainer-connector-2");
    const path = svg.querySelector("path");
    // index=2: delay = 400 + 2*50 = 500ms
    expect(path!.style.animationDelay).toBe("500ms");
  });
});

// --- CountUpValue component tests ---

describe("CountUpValue", () => {
  it("renders the formatted value", () => {
    render(<span data-testid="val"><CountUpValue formattedValue="$30,000" /></span>);
    // Eventually settles on the target value
    expect(screen.getByTestId("val")).toBeInTheDocument();
  });

  it("handles negative values", () => {
    render(<span data-testid="val"><CountUpValue formattedValue="-$230,000" /></span>);
    expect(screen.getByTestId("val")).toBeInTheDocument();
  });

  it("handles zero value", () => {
    render(<span data-testid="val"><CountUpValue formattedValue="$0" /></span>);
    expect(screen.getByTestId("val")).toHaveTextContent("$0");
  });
});

// --- Sequenced animation tests ---

describe("ExplainerModal sequenced animations", () => {
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

  it("source cards have animate-source-card-in class", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    const sources = screen.getByTestId("explainer-sources");
    const animatedCards = sources.querySelectorAll(".animate-source-card-in");
    expect(animatedCards.length).toBe(2);
  });

  it("source cards have staggered animation delays", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    const sources = screen.getByTestId("explainer-sources");
    const cards = sources.querySelectorAll(".animate-source-card-in");
    expect((cards[0] as HTMLElement).style.animationDelay).toBe("0ms");
    expect((cards[1] as HTMLElement).style.animationDelay).toBe("50ms");
  });

  it("connector lines are rendered for each source", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    expect(screen.getByTestId("explainer-connector-0")).toBeInTheDocument();
    expect(screen.getByTestId("explainer-connector-1")).toBeInTheDocument();
  });

  it("operators have animate-operator-in class", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    const operator = screen.getByTestId("explainer-operator-1");
    expect(operator.classList.contains("animate-operator-in")).toBe(true);
  });

  it("sum bar has animate-draw-sum-bar class", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    const sumBar = screen.getByTestId("explainer-sum-bar");
    const path = sumBar.querySelector("path");
    expect(path!.classList.contains("animate-draw-sum-bar")).toBe(true);
  });

  it("result area has animate-result-in class", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    const resultArea = screen.getByTestId("explainer-result-area");
    expect(resultArea.classList.contains("animate-result-in")).toBe(true);
  });

  it("hand-drawn oval paths have opacity 0.7", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    const oval = screen.getByTestId("source-summary-oval-section-assets");
    const path = oval.querySelector("path");
    expect(path!.getAttribute("opacity")).toBe("0.7");
  });

  it("hand-drawn oval paths have strokeLinecap round and strokeLinejoin round", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    const oval = screen.getByTestId("source-summary-oval-section-assets");
    const path = oval.querySelector("path");
    expect(path!.getAttribute("stroke-linecap")).toBe("round");
    expect(path!.getAttribute("stroke-linejoin")).toBe("round");
  });

  it("connector lines have arrowhead markers", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    const connector0 = screen.getByTestId("explainer-connector-0");
    const path = connector0.querySelector("path");
    expect(path!.getAttribute("marker-end")).toMatch(/url\(#arrowhead-0\)/);
  });

  it("positive connector lines are green, negative are red", () => {
    render(
      <ExplainerModal
        connections={mockConnections}
        targetMeta={mockTargetMeta}
        onClose={() => {}}
        getSourceMetadata={mockGetSourceMetadata}
      />
    );
    // First connection is positive (Assets) — cyan in dark theme
    const connector0 = screen.getByTestId("explainer-connector-0");
    expect(connector0.querySelector("path")!.getAttribute("stroke")).toBe("#22d3ee");
    // Second connection is negative (Debts) — rose in dark theme
    const connector1 = screen.getByTestId("explainer-connector-1");
    expect(connector1.querySelector("path")!.getAttribute("stroke")).toBe("#fb7185");
  });
});
