import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import RunwayBurndownChart, { buildSummary } from "@/components/RunwayBurndownChart";
import type { RunwayExplainerDetails } from "@/components/DataFlowArrows";

// Mock recharts to avoid rendering issues in jsdom
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

  it("renders a plain-English summary", () => {
    render(<RunwayBurndownChart details={makeDetails()} />);
    const summary = screen.getByTestId("burndown-summary");
    expect(summary).toBeInTheDocument();
    expect(summary.textContent).toContain("Your savings could last");
  });

  it("renders a clean legend", () => {
    render(<RunwayBurndownChart details={makeDetails()} />);
    const legend = screen.getByTestId("burndown-legend");
    expect(legend).toBeInTheDocument();
    expect(legend.textContent).toContain("With investment growth");
    expect(legend.textContent).toContain("Without growth");
    expect(legend.textContent).toContain("After withdrawal taxes");
  });

  it("hides tax line from legend when no tax drag", () => {
    render(<RunwayBurndownChart details={makeDetails({ taxDragMonths: 0 })} />);
    const legend = screen.getByTestId("burndown-legend");
    expect(legend.textContent).not.toContain("After withdrawal taxes");
  });

  it("renders starting balances", () => {
    render(<RunwayBurndownChart details={makeDetails()} />);
    const balances = screen.getByTestId("burndown-starting-balances");
    expect(balances).toBeInTheDocument();
    expect(balances.textContent).toContain("Starting:");
    expect(balances.textContent).toContain("TFSA");
    expect(balances.textContent).toContain("RRSP");
    expect(balances.textContent).toContain("$10,000");
    expect(balances.textContent).toContain("$5,000");
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

  it("uses LineChart instead of AreaChart (no stacked areas)", () => {
    render(<RunwayBurndownChart details={makeDetails()} />);
    expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    expect(screen.queryByTestId("area-chart")).not.toBeInTheDocument();
  });
});

describe("buildSummary", () => {
  it("generates basic summary with growth and tax drag", () => {
    const details = makeDetails();
    const summary = buildSummary(details);
    expect(summary).toContain("Your savings could last ~6 mo");
    expect(summary).toContain("Investment growth adds ~2 mo");
    expect(summary).toContain("withdrawal taxes reduce it by ~1 mo");
  });

  it("shows only growth when no tax drag", () => {
    const details = makeDetails({ taxDragMonths: 0 });
    const summary = buildSummary(details);
    expect(summary).toContain("Investment growth extends this by ~2 mo");
    expect(summary).not.toContain("taxes");
  });

  it("formats years for long runways", () => {
    const details = makeDetails({ runwayMonths: 24 });
    const summary = buildSummary(details);
    expect(summary).toContain("~2 yr");
  });

  it("formats fractional years", () => {
    const details = makeDetails({ runwayMonths: 18 });
    const summary = buildSummary(details);
    expect(summary).toContain("~1.5 yr");
  });

  it("handles no growth and no tax", () => {
    const details = makeDetails({
      growthExtensionMonths: undefined,
      taxDragMonths: undefined,
      runwayWithGrowthMonths: undefined,
      runwayAfterTaxMonths: undefined,
    });
    const summary = buildSummary(details);
    expect(summary).toBe("Your savings could last ~6 mo.");
  });
});
