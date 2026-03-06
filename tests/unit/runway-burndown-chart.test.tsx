import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RunwayBurndownChart from "@/components/RunwayBurndownChart";
import type { RunwayExplainerDetails } from "@/components/DataFlowArrows";

// Mock recharts to avoid rendering issues in jsdom
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="responsive-container">{children}</div>,
  AreaChart: ({ children }: { children: React.ReactNode }) => <div data-testid="area-chart">{children}</div>,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  Legend: () => <div />,
}));

function makeDetails(overrides?: Partial<RunwayExplainerDetails>): RunwayExplainerDetails {
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

describe("RunwayBurndownChart", () => {
  it("renders with the correct test id", () => {
    render(<RunwayBurndownChart details={makeDetails()} />);
    expect(screen.getByTestId("runway-burndown-main")).toBeInTheDocument();
  });

  it("renders the chart title", () => {
    render(<RunwayBurndownChart details={makeDetails()} />);
    expect(screen.getByText("Runway Burndown")).toBeInTheDocument();
  });

  it("shows growth extension annotation", () => {
    render(<RunwayBurndownChart details={makeDetails({ growthExtensionMonths: 5 })} />);
    expect(screen.getByTestId("burndown-growth-extension")).toHaveTextContent("+5 months from growth");
  });

  it("shows tax drag annotation", () => {
    render(<RunwayBurndownChart details={makeDetails({ taxDragMonths: 3 })} />);
    expect(screen.getByTestId("burndown-tax-drag")).toHaveTextContent("-3 months tax drag");
  });

  it("hides growth extension when zero or undefined", () => {
    render(<RunwayBurndownChart details={makeDetails({ growthExtensionMonths: 0 })} />);
    expect(screen.queryByTestId("burndown-growth-extension")).not.toBeInTheDocument();
  });

  it("hides tax drag when zero or undefined", () => {
    render(<RunwayBurndownChart details={makeDetails({ taxDragMonths: undefined })} />);
    expect(screen.queryByTestId("burndown-tax-drag")).not.toBeInTheDocument();
  });

  it("renders withdrawal order entries", () => {
    render(<RunwayBurndownChart details={makeDetails()} />);
    expect(screen.getByTestId("burndown-withdrawal-order")).toBeInTheDocument();
    expect(screen.getByTestId("burndown-withdrawal-0")).toBeInTheDocument();
    expect(screen.getByTestId("burndown-withdrawal-1")).toBeInTheDocument();
    expect(screen.getByText("TFSA")).toBeInTheDocument();
    expect(screen.getByText("RRSP")).toBeInTheDocument();
  });

  it("shows tax treatment labels for withdrawal order", () => {
    render(<RunwayBurndownChart details={makeDetails()} />);
    expect(screen.getByText("(tax-free)")).toBeInTheDocument();
    expect(screen.getByText("(taxed as income)")).toBeInTheDocument();
  });

  it("renders nothing when chart data has 1 or fewer points", () => {
    const details = makeDetails({
      withGrowth: [{ month: 0, balances: { TFSA: 10000 }, totalBalance: 10000 }],
      withoutGrowth: [{ month: 0, balances: { TFSA: 10000 }, totalBalance: 10000 }],
      withTax: [{ month: 0, balances: { TFSA: 10000 }, totalBalance: 10000 }],
    });
    const { container } = render(<RunwayBurndownChart details={details} />);
    expect(container.innerHTML).toBe("");
  });

  it("hides withdrawal order when empty", () => {
    render(<RunwayBurndownChart details={makeDetails({ withdrawalOrder: [] })} />);
    expect(screen.queryByTestId("burndown-withdrawal-order")).not.toBeInTheDocument();
  });

  it("labels withdrawal order as Suggested", () => {
    render(<RunwayBurndownChart details={makeDetails()} />);
    expect(screen.getByText("Suggested Withdrawal Order")).toBeInTheDocument();
  });
});
