import { describe, it, expect } from "vitest";
import {
  computeFlowchartSummary,
  getStepTitleColor,
  getConnectorColor,
} from "@/components/FinancialFlowchart";
import type { FlowchartStep } from "@/lib/flowchart-steps";

function makeStep(overrides: Partial<FlowchartStep> = {}): FlowchartStep {
  return {
    id: "test-step",
    stepNumber: 1,
    title: "Test Step",
    description: "A test step",
    completionHint: "Do this",
    detailText: "Detail text",
    status: "upcoming",
    progress: 0,
    ...overrides,
  };
}

describe("computeFlowchartSummary", () => {
  it("returns zero counts for empty steps", () => {
    const result = computeFlowchartSummary([]);
    expect(result).toEqual({ completed: 0, total: 0, percentage: 0 });
  });

  it("counts only complete steps", () => {
    const steps = [
      makeStep({ id: "s1", status: "complete" }),
      makeStep({ id: "s2", status: "in-progress" }),
      makeStep({ id: "s3", status: "upcoming" }),
    ];
    const result = computeFlowchartSummary(steps);
    expect(result.completed).toBe(1);
    expect(result.total).toBe(3);
    expect(result.percentage).toBe(33);
  });

  it("returns 100% when all steps are complete", () => {
    const steps = [
      makeStep({ id: "s1", status: "complete" }),
      makeStep({ id: "s2", status: "complete" }),
    ];
    const result = computeFlowchartSummary(steps);
    expect(result.completed).toBe(2);
    expect(result.total).toBe(2);
    expect(result.percentage).toBe(100);
  });

  it("returns 0% when no steps are complete", () => {
    const steps = [
      makeStep({ id: "s1", status: "in-progress" }),
      makeStep({ id: "s2", status: "upcoming" }),
    ];
    const result = computeFlowchartSummary(steps);
    expect(result.completed).toBe(0);
    expect(result.percentage).toBe(0);
  });

  it("rounds percentage to nearest integer", () => {
    const steps = Array.from({ length: 3 }, (_, i) =>
      makeStep({ id: `s${i}`, status: i === 0 ? "complete" : "upcoming" }),
    );
    const result = computeFlowchartSummary(steps);
    expect(result.percentage).toBe(33); // 1/3 = 33.33 → 33
  });

  it("handles 10-step CA roadmap with 4 complete", () => {
    const steps = Array.from({ length: 10 }, (_, i) =>
      makeStep({ id: `s${i}`, status: i < 4 ? "complete" : i === 4 ? "in-progress" : "upcoming" }),
    );
    const result = computeFlowchartSummary(steps);
    expect(result.completed).toBe(4);
    expect(result.total).toBe(10);
    expect(result.percentage).toBe(40);
  });
});

describe("getStepTitleColor", () => {
  it("returns emerald for complete steps", () => {
    expect(getStepTitleColor("complete")).toBe("text-emerald-400");
  });

  it("returns amber for in-progress steps", () => {
    expect(getStepTitleColor("in-progress")).toBe("text-amber-400");
  });

  it("returns slate for upcoming steps", () => {
    expect(getStepTitleColor("upcoming")).toBe("text-slate-400");
  });
});

describe("getConnectorColor", () => {
  it("returns emerald for complete steps", () => {
    expect(getConnectorColor("complete")).toContain("emerald");
  });

  it("returns white/10 for non-complete steps", () => {
    expect(getConnectorColor("in-progress")).toContain("white/10");
    expect(getConnectorColor("upcoming")).toContain("white/10");
  });
});
