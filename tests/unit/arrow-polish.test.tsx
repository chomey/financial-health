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
    const result = prioritizeConnections(connections, 2);
    expect(result).toHaveLength(2);
    expect(result[0].sourceId).toBe("large");
    expect(result[1].sourceId).toBe("medium");
  });

  it("handles connections without value (treats as 0)", () => {
    const connections: ActiveConnection[] = [
      { sourceId: "a", targetId: "t", value: 1000, sign: "positive" },
      { sourceId: "b", targetId: "t", sign: "negative" },
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
  it("renders sr-only aria-live region in metric card", async () => {
    const { default: SnapshotDashboard } = await import("@/components/SnapshotDashboard");

    render(
      <DataFlowProvider>
        <SnapshotDashboard />
      </DataFlowProvider>
    );

    const ariaLiveRegions = screen.getAllByTestId("dataflow-aria-live");
    expect(ariaLiveRegions.length).toBeGreaterThan(0);

    for (const region of ariaLiveRegions) {
      expect(region).toHaveAttribute("aria-live", "polite");
    }

    for (const region of ariaLiveRegions) {
      expect(region.textContent).toBe("");
    }
  });
});

// --- ExplainerModal replaces SpotlightOverlay ---

describe("ExplainerModal behavior", () => {
  it("no explainer modal when no active target", () => {
    render(
      <DataFlowProvider>
        <div>content</div>
      </DataFlowProvider>
    );

    expect(screen.queryByTestId("explainer-modal")).toBeNull();
  });

  it("explainer modal appears when target is activated", () => {
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
      ctx!.setActiveTarget("some-target");
      ctx!.setActiveConnections([
        { sourceId: "section-assets", targetId: "some-target", value: 50000, sign: "positive", label: "+$50k" },
      ]);
      ctx!.setActiveTargetMeta({ label: "Net Worth", formattedValue: "$50,000" });
    });

    expect(screen.getByTestId("explainer-modal")).toBeInTheDocument();
  });

  it("no SVG overlay is rendered (replaced by modal)", () => {
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
        { sourceId: "source-1", targetId: "target-1", value: 50000, sign: "positive", label: "+$50k" },
      ]);
      ctx!.setActiveTargetMeta({ label: "Test", formattedValue: "$50,000" });
    });

    expect(screen.queryByTestId("data-flow-overlay")).toBeNull();
    expect(screen.queryByTestId("spotlight-overlay")).toBeNull();
  });
});
