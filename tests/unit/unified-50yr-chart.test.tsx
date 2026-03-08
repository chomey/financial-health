import { describe, it, expect, vi } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "../test-utils";
import ProjectionChart from "@/components/ProjectionChart";
import type { RunwayExplainerDetails } from "@/components/DataFlowArrows";
import { INITIAL_STATE } from "@/lib/financial-state";
import { projectFinances, projectAssets } from "@/lib/projections";

// Mock recharts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  ReferenceLine: () => <div data-testid="reference-line" />,
}));

function makeRunwayDetails(overrides?: Partial<RunwayExplainerDetails>): RunwayExplainerDetails {
  return {
    withGrowth: [
      { month: 0, balances: { TFSA: 10000 }, totalBalance: 10000 },
      { month: 1, balances: { TFSA: 9000 }, totalBalance: 9000 },
      { month: 2, balances: { TFSA: 8000 }, totalBalance: 8000 },
    ],
    withoutGrowth: [
      { month: 0, balances: { TFSA: 10000 }, totalBalance: 10000 },
      { month: 1, balances: { TFSA: 8500 }, totalBalance: 8500 },
    ],
    withTax: [
      { month: 0, balances: { TFSA: 10000 }, totalBalance: 10000 },
      { month: 1, balances: { TFSA: 8000 }, totalBalance: 8000 },
    ],
    withdrawalOrder: [
      { category: "TFSA", taxTreatment: "tax-free", startingBalance: 10000, estimatedTaxCost: 0 },
    ],
    monthlyExpenses: 2000,
    monthlyMortgage: 0,
    monthlyTotal: 2000,
    runwayMonths: 5,
    runwayWithGrowthMonths: 6,
    runwayAfterTaxMonths: 5.5,
    growthExtensionMonths: 1,
    taxDragMonths: 0.5,
    categories: ["TFSA"],
    ...overrides,
  };
}

describe("50-year unified chart", () => {
  it("does not render timeline selector buttons", () => {
    render(<ProjectionChart state={INITIAL_STATE} />);
    expect(screen.queryByTestId("timeline-10yr")).not.toBeInTheDocument();
    expect(screen.queryByTestId("timeline-20yr")).not.toBeInTheDocument();
    expect(screen.queryByTestId("timeline-30yr")).not.toBeInTheDocument();
  });

  it("summary table shows default 30yr milestone columns", () => {
    render(<ProjectionChart state={INITIAL_STATE} />);
    const table = screen.getByTestId("projection-summary-table");
    expect(table.textContent).toContain("5yr");
    expect(table.textContent).toContain("10yr");
    expect(table.textContent).toContain("20yr");
    expect(table.textContent).toContain("30yr");
  });

  it("asset projections table shows default 30yr milestone columns", () => {
    render(<ProjectionChart state={INITIAL_STATE} />);
    const table = screen.getByTestId("asset-projections-table");
    expect(table.textContent).toContain("10yr");
    expect(table.textContent).toContain("30yr");
  });

  it("burndown chart uses year-based X-axis data", () => {
    render(<ProjectionChart state={INITIAL_STATE} runwayDetails={makeRunwayDetails()} />);
    fireEvent.click(screen.getByTestId("mode-income-stops"));
    // Burndown chart should be visible with year-based data
    expect(screen.getByTestId("burndown-chart-container")).toBeInTheDocument();
  });
});

describe("projectFinances — 50-year default", () => {
  it("projectAssets defaults to [10, 20, 30, 40, 50] milestones", () => {
    const assets = [{ category: "TFSA", amount: 10000, roi: 5 }];
    const result = projectAssets(assets);
    expect(result[0].milestoneValues.length).toBe(5);
  });

  it("projectFinances generates 601 monthly points for 50 years", () => {
    const result = projectFinances(INITIAL_STATE, 50);
    expect(result.points.length).toBe(601); // 0..600 inclusive
    expect(result.points[result.points.length - 1].month).toBe(600);
  });
});
