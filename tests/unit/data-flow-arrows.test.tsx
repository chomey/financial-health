import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, act } from "@testing-library/react";
import React, { useRef, useEffect } from "react";

// Mock ResizeObserver for jsdom
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
});
import {
  DataFlowProvider,
  useDataFlow,
  SpotlightOverlay,
  FormulaBar,
  type ActiveConnection,
  type ActiveTargetMeta,
} from "@/components/DataFlowArrows";

// --- SpotlightOverlay tests ---

describe("SpotlightOverlay", () => {
  it("renders with opacity 0 when inactive", () => {
    render(<SpotlightOverlay active={false} />);
    const overlay = screen.getByTestId("spotlight-overlay");
    expect(overlay).toBeInTheDocument();
    expect(overlay.style.opacity).toBe("0");
  });

  it("renders with opacity 1 when active", () => {
    render(<SpotlightOverlay active={true} />);
    const overlay = screen.getByTestId("spotlight-overlay");
    expect(overlay.style.opacity).toBe("1");
  });

  it("has correct styling properties", () => {
    render(<SpotlightOverlay active={true} />);
    const overlay = screen.getByTestId("spotlight-overlay");
    expect(overlay.style.position).toBe("fixed");
    expect(overlay.style.zIndex).toBe("40");
    expect(overlay.style.pointerEvents).toBe("none");
    expect(overlay).toHaveAttribute("aria-hidden", "true");
  });
});

// --- FormulaBar tests ---

describe("FormulaBar", () => {
  const connections: ActiveConnection[] = [
    { sourceId: "section-assets", targetId: "net-worth", label: "+$65k", value: 65000, sign: "positive" },
    { sourceId: "section-debts", targetId: "net-worth", label: "-$295k", value: 295000, sign: "negative" },
  ];
  const targetMeta: ActiveTargetMeta = { label: "Net Worth", formattedValue: "-$230,000" };

  it("renders nothing when targetMeta is null", () => {
    const { container } = render(
      <FormulaBar connections={connections} targetMeta={null} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when connections are empty", () => {
    const { container } = render(
      <FormulaBar connections={[]} targetMeta={targetMeta} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders formula terms and result", () => {
    render(<FormulaBar connections={connections} targetMeta={targetMeta} />);
    const bar = screen.getByTestId("formula-bar");
    expect(bar).toBeInTheDocument();

    // Check terms
    expect(screen.getByTestId("formula-term-section-assets")).toHaveTextContent("+$65k");
    expect(screen.getByTestId("formula-term-section-debts")).toHaveTextContent("-$295k");

    // Check result
    expect(screen.getByTestId("formula-result")).toHaveTextContent("-$230,000");
  });

  it("applies green styling for positive terms and red for negative", () => {
    render(<FormulaBar connections={connections} targetMeta={targetMeta} />);
    const posTerm = screen.getByTestId("formula-term-section-assets");
    const negTerm = screen.getByTestId("formula-term-section-debts");
    expect(posTerm.className).toContain("bg-green-50");
    expect(negTerm.className).toContain("bg-rose-50");
  });

  it("has aria-label describing the formula", () => {
    render(<FormulaBar connections={connections} targetMeta={targetMeta} />);
    const bar = screen.getByTestId("formula-bar");
    expect(bar).toHaveAttribute("aria-label", "Formula: Net Worth = -$230,000");
  });
});

// --- Context tests ---

describe("DataFlowProvider and useDataFlow", () => {
  it("provides context with activeTargetMeta to children", () => {
    let contextValue: ReturnType<typeof useDataFlow> | null = null;

    function TestConsumer() {
      contextValue = useDataFlow();
      return <div>consumer</div>;
    }

    render(
      <DataFlowProvider>
        <TestConsumer />
      </DataFlowProvider>
    );

    expect(contextValue).not.toBeNull();
    expect(typeof contextValue!.registerSource).toBe("function");
    expect(typeof contextValue!.registerTarget).toBe("function");
    expect(typeof contextValue!.setActiveTarget).toBe("function");
    expect(typeof contextValue!.setActiveConnections).toBe("function");
    expect(typeof contextValue!.setActiveTargetMeta).toBe("function");
    expect(contextValue!.activeTarget).toBeNull();
    expect(contextValue!.activeConnections).toEqual([]);
    expect(contextValue!.activeTargetMeta).toBeNull();
  });

  it("throws when useDataFlow is used outside provider", () => {
    function BadConsumer() {
      useDataFlow();
      return null;
    }

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<BadConsumer />)).toThrow(
      "useDataFlow must be used within a DataFlowProvider"
    );
    spy.mockRestore();
  });

  it("allows registering sources and targets", () => {
    let ctx: ReturnType<typeof useDataFlow> | null = null;

    function TestComponent() {
      ctx = useDataFlow();
      const ref = useRef<HTMLDivElement>(null);

      useEffect(() => {
        ctx!.registerSource("test-source", ref, {
          label: "Assets",
          value: 50000,
        });
        ctx!.registerTarget("test-target", ref);

        return () => {
          ctx!.unregisterSource("test-source");
          ctx!.unregisterTarget("test-target");
        };
      }, []);

      return <div ref={ref}>test</div>;
    }

    render(
      <DataFlowProvider>
        <TestComponent />
      </DataFlowProvider>
    );

    expect(ctx).not.toBeNull();
  });

  it("can set active target, connections, and targetMeta", () => {
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
        {
          sourceId: "section-assets",
          targetId: "net-worth",
          label: "$50,000",
          sign: "positive",
        },
        {
          sourceId: "section-debts",
          targetId: "net-worth",
          label: "$10,000",
          sign: "negative",
        },
      ]);
      ctx!.setActiveTargetMeta({ label: "Net Worth", formattedValue: "$40,000" });
    });

    expect(ctx!.activeTarget).toBe("net-worth");
    expect(ctx!.activeConnections).toHaveLength(2);
    expect(ctx!.activeConnections[0].sign).toBe("positive");
    expect(ctx!.activeConnections[1].sign).toBe("negative");
    expect(ctx!.activeTargetMeta).toEqual({ label: "Net Worth", formattedValue: "$40,000" });
  });

  it("renders spotlight overlay (inactive by default)", () => {
    render(
      <DataFlowProvider>
        <div>content</div>
      </DataFlowProvider>
    );

    const overlay = screen.getByTestId("spotlight-overlay");
    expect(overlay).toBeInTheDocument();
    expect(overlay.style.opacity).toBe("0");
  });

  it("does not render SVG overlay (removed)", () => {
    render(
      <DataFlowProvider>
        <div>content</div>
      </DataFlowProvider>
    );

    expect(screen.queryByTestId("data-flow-overlay")).toBeNull();
  });
});
