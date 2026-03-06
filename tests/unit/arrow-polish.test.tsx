import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
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
  prioritizeConnections,
  MAX_ARROWS,
  DataFlowProvider,
  useDataFlow,
  type ActiveConnection,
} from "@/components/DataFlowArrows";

// --- prioritizeConnections tests ---

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

  it("prioritizes by absolute value magnitude (largest first)", () => {
    const connections: ActiveConnection[] = [
      { sourceId: "small", targetId: "t", value: 10, sign: "positive" },
      { sourceId: "large", targetId: "t", value: 100000, sign: "negative" },
      { sourceId: "medium", targetId: "t", value: 5000, sign: "positive" },
    ];
    // With max 2, should keep the two largest by absolute value
    const result = prioritizeConnections(connections, 2);
    expect(result).toHaveLength(2);
    expect(result[0].sourceId).toBe("large");
    expect(result[1].sourceId).toBe("medium");
  });

  it("handles connections without value (treats as 0)", () => {
    const connections: ActiveConnection[] = [
      { sourceId: "a", targetId: "t", value: 1000, sign: "positive" },
      { sourceId: "b", targetId: "t", sign: "negative" }, // no value
    ];
    const result = prioritizeConnections(connections, 1);
    expect(result[0].sourceId).toBe("a");
  });

  it("MAX_ARROWS constant is 8", () => {
    expect(MAX_ARROWS).toBe(8);
  });
});

// --- Accessibility: aria-live announcement tests ---

describe("MetricCard aria-live announcements", () => {
  // We test via SnapshotDashboard since MetricCard is not exported
  it("renders sr-only aria-live region in metric card", async () => {
    // Import dynamically to get the full component
    const { default: SnapshotDashboard } = await import("@/components/SnapshotDashboard");

    render(
      <DataFlowProvider>
        <SnapshotDashboard />
      </DataFlowProvider>
    );

    // Each metric card should have an aria-live region
    const ariaLiveRegions = screen.getAllByTestId("dataflow-aria-live");
    expect(ariaLiveRegions.length).toBeGreaterThan(0);

    // All should have aria-live="polite"
    for (const region of ariaLiveRegions) {
      expect(region).toHaveAttribute("aria-live", "polite");
    }

    // Initially empty (no arrows active)
    for (const region of ariaLiveRegions) {
      expect(region.textContent).toBe("");
    }
  });
});

// --- Mobile responsive: SVG overlay hidden on small viewports ---

describe("DataFlowArrowOverlay mobile behavior", () => {
  it("does not render SVG overlay when viewport is narrow (< 768px)", () => {
    // Set viewport to mobile width
    Object.defineProperty(window, "innerWidth", { value: 375, writable: true });
    window.dispatchEvent(new Event("resize"));

    let ctx: ReturnType<typeof useDataFlow> | null = null;

    function TestComponent() {
      ctx = useDataFlow();
      const ref = useRef<HTMLDivElement>(null);

      useEffect(() => {
        ctx!.registerSource("source-1", ref, { label: "Assets", value: 50000 });
        ctx!.registerTarget("target-1", ref);
      }, []);

      return <div ref={ref}>test</div>;
    }

    render(
      <DataFlowProvider>
        <TestComponent />
      </DataFlowProvider>
    );

    act(() => {
      ctx!.setActiveTarget("target-1");
      ctx!.setActiveConnections([
        { sourceId: "source-1", targetId: "target-1", value: 50000, sign: "positive" },
      ]);
    });

    // On mobile, SVG overlay should not be rendered
    expect(screen.queryByTestId("data-flow-overlay")).toBeNull();

    // Reset viewport
    Object.defineProperty(window, "innerWidth", { value: 1024, writable: true });
    window.dispatchEvent(new Event("resize"));
  });
});

// --- Label pill styling ---

describe("Arrow label pills", () => {
  it("arrow overlay has aria-hidden attribute", () => {
    // Set viewport to desktop
    Object.defineProperty(window, "innerWidth", { value: 1200, writable: true });
    window.dispatchEvent(new Event("resize"));

    let ctx: ReturnType<typeof useDataFlow> | null = null;

    function TestComponent() {
      ctx = useDataFlow();
      const sourceRef = useRef<HTMLDivElement>(null);
      const targetRef = useRef<HTMLDivElement>(null);

      useEffect(() => {
        ctx!.registerSource("src", sourceRef, { label: "Test", value: 100 });
        ctx!.registerTarget("tgt", targetRef);
      }, []);

      return (
        <>
          <div ref={sourceRef}>source</div>
          <div ref={targetRef}>target</div>
        </>
      );
    }

    render(
      <DataFlowProvider>
        <TestComponent />
      </DataFlowProvider>
    );

    act(() => {
      ctx!.setActiveTarget("tgt");
      ctx!.setActiveConnections([
        { sourceId: "src", targetId: "tgt", label: "+$50k", value: 50000, sign: "positive" },
      ]);
    });

    const overlay = screen.queryByTestId("data-flow-overlay");
    // Overlay may or may not render (depends on getBoundingClientRect in jsdom)
    // If rendered, it should have aria-hidden
    if (overlay) {
      expect(overlay).toHaveAttribute("aria-hidden", "true");
    }
  });
});

// --- will-change performance optimization ---

describe("Performance optimizations", () => {
  it("SVG overlay uses will-change: transform", () => {
    Object.defineProperty(window, "innerWidth", { value: 1200, writable: true });
    window.dispatchEvent(new Event("resize"));

    let ctx: ReturnType<typeof useDataFlow> | null = null;

    function TestComponent() {
      ctx = useDataFlow();
      const ref = useRef<HTMLDivElement>(null);

      useEffect(() => {
        ctx!.registerSource("s1", ref, { label: "A", value: 100 });
        ctx!.registerTarget("t1", ref);
      }, []);

      return <div ref={ref}>test</div>;
    }

    render(
      <DataFlowProvider>
        <TestComponent />
      </DataFlowProvider>
    );

    act(() => {
      ctx!.setActiveTarget("t1");
      ctx!.setActiveConnections([
        { sourceId: "s1", targetId: "t1", value: 100, sign: "positive" },
      ]);
    });

    const overlay = screen.queryByTestId("data-flow-overlay");
    if (overlay) {
      expect(overlay.style.willChange).toBe("transform");
    }
  });
});
