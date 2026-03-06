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
  getCenterPoint,
  getEdgePoint,
  calculateArrowPath,
  approximatePathLength,
  DataFlowProvider,
  useDataFlow,
  type Point,
  type Rect,
} from "@/components/DataFlowArrows";

// --- Pure function tests ---

describe("getCenterPoint", () => {
  it("returns center of a rect", () => {
    const rect: Rect = { x: 100, y: 200, width: 50, height: 30 };
    const center = getCenterPoint(rect);
    expect(center).toEqual({ x: 125, y: 215 });
  });

  it("handles zero-origin rect", () => {
    const rect: Rect = { x: 0, y: 0, width: 100, height: 100 };
    expect(getCenterPoint(rect)).toEqual({ x: 50, y: 50 });
  });
});

describe("getEdgePoint", () => {
  const rect: Rect = { x: 100, y: 100, width: 200, height: 100 };

  it("returns right edge when target is to the right", () => {
    const toward: Point = { x: 500, y: 150 };
    const edge = getEdgePoint(rect, toward);
    expect(edge).toEqual({ x: 300, y: 150 }); // right edge, center y
  });

  it("returns left edge when target is to the left", () => {
    const toward: Point = { x: 0, y: 150 };
    const edge = getEdgePoint(rect, toward);
    expect(edge).toEqual({ x: 100, y: 150 }); // left edge, center y
  });

  it("returns bottom edge when target is below", () => {
    const toward: Point = { x: 200, y: 400 };
    const edge = getEdgePoint(rect, toward);
    expect(edge).toEqual({ x: 200, y: 200 }); // center x, bottom edge
  });

  it("returns top edge when target is above", () => {
    const toward: Point = { x: 200, y: 0 };
    const edge = getEdgePoint(rect, toward);
    expect(edge).toEqual({ x: 200, y: 100 }); // center x, top edge
  });
});

describe("calculateArrowPath", () => {
  it("returns a valid SVG path string starting with M and containing C", () => {
    const from: Point = { x: 100, y: 100 };
    const to: Point = { x: 300, y: 200 };
    const path = calculateArrowPath(from, to);

    expect(path).toMatch(/^M\s/);
    expect(path).toMatch(/C\s/);
    expect(path).toContain("100 100"); // start point
    expect(path).toContain("300 200"); // end point
  });

  it("handles same point (zero distance)", () => {
    const point: Point = { x: 150, y: 150 };
    const path = calculateArrowPath(point, point);
    expect(path).toMatch(/^M\s/);
    expect(path).toContain("150 150");
  });

  it("produces different paths for different directions", () => {
    const from: Point = { x: 100, y: 100 };
    const path1 = calculateArrowPath(from, { x: 300, y: 100 }); // horizontal
    const path2 = calculateArrowPath(from, { x: 100, y: 300 }); // vertical
    expect(path1).not.toEqual(path2);
  });
});

describe("approximatePathLength", () => {
  it("returns a value greater than straight-line distance", () => {
    const from: Point = { x: 0, y: 0 };
    const to: Point = { x: 300, y: 400 };
    const straightLine = Math.sqrt(300 * 300 + 400 * 400); // 500
    const approx = approximatePathLength(from, to);

    expect(approx).toBeGreaterThan(straightLine);
    expect(approx).toBeCloseTo(straightLine * 1.2, 0);
  });

  it("returns 0 for same point", () => {
    const p: Point = { x: 50, y: 50 };
    expect(approximatePathLength(p, p)).toBe(0);
  });
});

// --- Context tests ---

describe("DataFlowProvider and useDataFlow", () => {
  it("provides context to children", () => {
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
    expect(contextValue!.activeTarget).toBeNull();
    expect(contextValue!.activeConnections).toEqual([]);
  });

  it("throws when useDataFlow is used outside provider", () => {
    function BadConsumer() {
      useDataFlow();
      return null;
    }

    // Suppress console.error for expected error
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

    // Context functions should be callable without error
    expect(ctx).not.toBeNull();
  });

  it("can set active target and connections", () => {
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
    });

    expect(ctx!.activeTarget).toBe("net-worth");
    expect(ctx!.activeConnections).toHaveLength(2);
    expect(ctx!.activeConnections[0].sign).toBe("positive");
    expect(ctx!.activeConnections[1].sign).toBe("negative");
  });

  it("renders nothing when no active target", () => {
    render(
      <DataFlowProvider>
        <div>content</div>
      </DataFlowProvider>
    );

    expect(screen.queryByTestId("data-flow-overlay")).toBeNull();
  });
});
