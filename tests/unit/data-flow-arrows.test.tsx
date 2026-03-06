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
  type ActiveConnection,
} from "@/components/DataFlowArrows";

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
    expect(typeof contextValue!.getSourceMetadata).toBe("function");
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

  it("renders explainer modal when target is active with connections and meta", () => {
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

  it("does not render spotlight overlay or SVG overlay (removed)", () => {
    render(
      <DataFlowProvider>
        <div>content</div>
      </DataFlowProvider>
    );

    expect(screen.queryByTestId("spotlight-overlay")).toBeNull();
    expect(screen.queryByTestId("data-flow-overlay")).toBeNull();
  });
});
