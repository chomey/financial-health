import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProjectionChart from "@/components/ProjectionChart";
import type { RunwayExplainerDetails } from "@/components/DataFlowArrows";
import { INITIAL_STATE } from "@/lib/financial-state";

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
      { month: 0, balances: { TFSA: 10000, RRSP: 5000 }, totalBalance: 15000 },
      { month: 1, balances: { TFSA: 9000, RRSP: 4500 }, totalBalance: 13500 },
      { month: 2, balances: { TFSA: 8000, RRSP: 4000 }, totalBalance: 12000 },
    ],
    withoutGrowth: [
      { month: 0, balances: { TFSA: 10000, RRSP: 5000 }, totalBalance: 15000 },
      { month: 1, balances: { TFSA: 8500, RRSP: 4250 }, totalBalance: 12750 },
    ],
    withTax: [
      { month: 0, balances: { TFSA: 10000, RRSP: 5000 }, totalBalance: 15000 },
      { month: 1, balances: { TFSA: 8000, RRSP: 4000 }, totalBalance: 12000 },
    ],
    withdrawalOrder: [
      { category: "TFSA", taxTreatment: "tax-free", startingBalance: 10000, estimatedTaxCost: 0 },
      { category: "RRSP", taxTreatment: "tax-deferred", startingBalance: 5000, estimatedTaxCost: 800 },
    ],
    monthlyExpenses: 2000,
    monthlyMortgage: 500,
    monthlyTotal: 2500,
    runwayMonths: 6,
    runwayWithGrowthMonths: 8,
    runwayAfterTaxMonths: 7,
    growthExtensionMonths: 2,
    taxDragMonths: 1,
    categories: ["TFSA", "RRSP"],
    ...overrides,
  };
}

describe("Unified ProjectionChart", () => {
  it("renders mode tabs when runwayDetails is provided", () => {
    render(<ProjectionChart state={INITIAL_STATE} runwayDetails={makeRunwayDetails()} />);
    expect(screen.getByTestId("chart-mode-tabs")).toBeInTheDocument();
    expect(screen.getByTestId("mode-keep-earning")).toBeInTheDocument();
    expect(screen.getByTestId("mode-income-stops")).toBeInTheDocument();
  });

  it("does not render mode tabs when runwayDetails is absent", () => {
    render(<ProjectionChart state={INITIAL_STATE} />);
    expect(screen.queryByTestId("chart-mode-tabs")).not.toBeInTheDocument();
  });

  it("defaults to Keep Earning mode showing projection summary", () => {
    render(<ProjectionChart state={INITIAL_STATE} runwayDetails={makeRunwayDetails()} />);
    expect(screen.getByTestId("projection-summary-table")).toBeInTheDocument();
    expect(screen.queryByTestId("burndown-summary")).not.toBeInTheDocument();
  });

  it("switches to Income Stops mode when tab is clicked", () => {
    render(<ProjectionChart state={INITIAL_STATE} runwayDetails={makeRunwayDetails()} />);
    fireEvent.click(screen.getByTestId("mode-income-stops"));
    expect(screen.getByTestId("burndown-summary")).toBeInTheDocument();
    expect(screen.queryByTestId("projection-summary-table")).not.toBeInTheDocument();
  });

  it("switches back to Keep Earning mode", () => {
    render(<ProjectionChart state={INITIAL_STATE} runwayDetails={makeRunwayDetails()} />);
    fireEvent.click(screen.getByTestId("mode-income-stops"));
    expect(screen.getByTestId("burndown-summary")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("mode-keep-earning"));
    expect(screen.getByTestId("projection-summary-table")).toBeInTheDocument();
    expect(screen.queryByTestId("burndown-summary")).not.toBeInTheDocument();
  });

  it("shows burndown legend in Income Stops mode", () => {
    render(<ProjectionChart state={INITIAL_STATE} runwayDetails={makeRunwayDetails()} />);
    fireEvent.click(screen.getByTestId("mode-income-stops"));
    const legend = screen.getByTestId("burndown-legend");
    expect(legend.textContent).toContain("With investment growth");
    expect(legend.textContent).toContain("Without growth");
    expect(legend.textContent).toContain("After withdrawal taxes");
  });

  it("shows starting balances in Income Stops mode", () => {
    render(<ProjectionChart state={INITIAL_STATE} runwayDetails={makeRunwayDetails()} />);
    fireEvent.click(screen.getByTestId("mode-income-stops"));
    const balances = screen.getByTestId("burndown-starting-balances");
    expect(balances.textContent).toContain("Starting:");
    expect(balances.textContent).toContain("TFSA");
    expect(balances.textContent).toContain("RRSP");
  });

  it("shows withdrawal order in Income Stops mode", () => {
    render(<ProjectionChart state={INITIAL_STATE} runwayDetails={makeRunwayDetails()} />);
    fireEvent.click(screen.getByTestId("mode-income-stops"));
    expect(screen.getByTestId("burndown-withdrawal-order")).toBeInTheDocument();
    expect(screen.getByTestId("burndown-withdrawal-0")).toBeInTheDocument();
    expect(screen.getByTestId("burndown-withdrawal-1")).toBeInTheDocument();
  });

  it("hides scenario buttons in Income Stops mode", () => {
    render(<ProjectionChart state={INITIAL_STATE} runwayDetails={makeRunwayDetails()} />);
    expect(screen.getByTestId("scenario-moderate")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("mode-income-stops"));
    expect(screen.queryByTestId("scenario-moderate")).not.toBeInTheDocument();
  });

  it("shows surplus subtitle when income > 0 in Keep Earning mode", () => {
    render(<ProjectionChart state={INITIAL_STATE} runwayDetails={makeRunwayDetails()} />);
    expect(screen.getByTestId("projection-surplus-subtitle")).toBeInTheDocument();
    expect(screen.getByTestId("projection-surplus-subtitle").textContent).toContain("surplus/mo");
  });

  it("hides surplus subtitle when no income", () => {
    const noIncomeState = { ...INITIAL_STATE, income: [] };
    render(<ProjectionChart state={noIncomeState} runwayDetails={makeRunwayDetails()} />);
    expect(screen.queryByTestId("projection-surplus-subtitle")).not.toBeInTheDocument();
  });

  it("hides surplus subtitle in Income Stops mode", () => {
    render(<ProjectionChart state={INITIAL_STATE} runwayDetails={makeRunwayDetails()} />);
    expect(screen.getByTestId("projection-surplus-subtitle")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("mode-income-stops"));
    expect(screen.queryByTestId("projection-surplus-subtitle")).not.toBeInTheDocument();
  });
});
