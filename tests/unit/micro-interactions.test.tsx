import { describe, it, expect } from "vitest";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "../test-utils";
import userEvent from "@testing-library/user-event";
import SnapshotDashboard from "@/components/SnapshotDashboard";
import type { MetricData } from "@/components/SnapshotDashboard";
import AssetEntry from "@/components/AssetEntry";
import DebtEntry from "@/components/DebtEntry";
import IncomeEntry from "@/components/IncomeEntry";
import ExpenseEntry from "@/components/ExpenseEntry";
describe("Metric cards have consistent styling", () => {
  it("metric cards have no special glow or pulse animations", () => {
    const metrics: MetricData[] = [
      { title: "Net Worth", value: 100000, format: "currency", icon: "💰", tooltip: "test", positive: true },
      { title: "Monthly Cash Flow", value: 2000, format: "currency", icon: "📈", tooltip: "test", positive: true },
      { title: "Financial Runway", value: 18.5, format: "months", icon: "🛡️", tooltip: "test", positive: true },
      { title: "Debt-to-Asset Ratio", value: 0.5, format: "ratio", icon: "⚖️", tooltip: "test", positive: true },
    ];
    render(<SnapshotDashboard metrics={metrics} />);
    const runwayCard = screen.getByRole("group", { name: "Financial Runway" });
    expect(runwayCard.className).not.toContain("animate-glow-pulse");
    expect(runwayCard.className).not.toContain("animate-warning-pulse");
    expect(runwayCard.className).toContain("border-white/10");
  });
});

describe("Metric descriptions always visible", () => {
  it("shows description text without hover interaction", () => {
    render(<SnapshotDashboard />);
    // Descriptions should be visible without any hover
    expect(screen.getByText(/Your total assets minus total debts/)).toBeInTheDocument();
    expect(screen.getByText(/How much more you earn than you spend/)).toBeInTheDocument();
  });
});

describe("Empty state illustrations", () => {
  it("asset empty state shows icon and message", async () => {
    render(<AssetEntry items={[]} />);
    const emptyState = screen.getByTestId("asset-empty-state");
    expect(emptyState).toBeInTheDocument();
    expect(emptyState.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText(/Add your savings, investments/)).toBeInTheDocument();
  });

  it("debt empty state shows icon and message", () => {
    render(<DebtEntry items={[]} />);
    const emptyState = screen.getByTestId("debt-empty-state");
    expect(emptyState).toBeInTheDocument();
    expect(emptyState.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText(/Track your mortgage, loans/)).toBeInTheDocument();
  });

  it("income empty state shows icon and message", () => {
    render(<IncomeEntry items={[]} />);
    const emptyState = screen.getByTestId("income-empty-state");
    expect(emptyState).toBeInTheDocument();
    expect(emptyState.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText(/Enter your income sources/)).toBeInTheDocument();
  });

  it("expense empty state shows icon and message", () => {
    render(<ExpenseEntry items={[]} />);
    const emptyState = screen.getByTestId("expense-empty-state");
    expect(emptyState).toBeInTheDocument();
    expect(emptyState.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText(/Add your regular expenses/)).toBeInTheDocument();
  });

});

describe("Active states on confirm buttons", () => {
  it("Add Asset confirm button has active:scale-95 class", async () => {
    const user = userEvent.setup();
    render(<AssetEntry />);
    await user.click(screen.getByText("+ Add Asset"));
    const confirmBtn = screen.getByLabelText("Confirm add asset");
    expect(confirmBtn.className).toContain("active:scale-95");
  });

  it("Add Debt confirm button has active:scale-95 class", async () => {
    const user = userEvent.setup();
    render(<DebtEntry />);
    await user.click(screen.getByText("+ Add Debt"));
    const confirmBtn = screen.getByLabelText("Confirm add debt");
    expect(confirmBtn.className).toContain("active:scale-95");
  });

});
