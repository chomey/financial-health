import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SnapshotDashboard from "@/components/SnapshotDashboard";
import type { MetricData } from "@/components/SnapshotDashboard";
import AssetEntry from "@/components/AssetEntry";
import DebtEntry from "@/components/DebtEntry";
import IncomeEntry from "@/components/IncomeEntry";
import ExpenseEntry from "@/components/ExpenseEntry";
import GoalEntry from "@/components/GoalEntry";

describe("Runway celebratory glow", () => {
  it("shows celebratory glow when runway exceeds 12 months", () => {
    const metrics: MetricData[] = [
      { title: "Net Worth", value: 100000, format: "currency", icon: "💰", tooltip: "test", positive: true },
      { title: "Monthly Surplus", value: 2000, format: "currency", icon: "📈", tooltip: "test", positive: true },
      { title: "Financial Runway", value: 18.5, format: "months", icon: "🛡️", tooltip: "test", positive: true },
      { title: "Debt-to-Asset Ratio", value: 0.5, format: "ratio", icon: "⚖️", tooltip: "test", positive: true },
    ];
    render(<SnapshotDashboard metrics={metrics} />);
    const runwayCard = screen.getByRole("group", { name: "Financial Runway" });
    expect(runwayCard.getAttribute("data-runway-celebration")).toBeTruthy();
    expect(runwayCard.className).toContain("animate-glow-pulse");
    expect(runwayCard.className).toContain("border-green-300");
  });

  it("shows 'Excellent safety net!' text for runway > 12 months", () => {
    const metrics: MetricData[] = [
      { title: "Net Worth", value: 100000, format: "currency", icon: "💰", tooltip: "test", positive: true },
      { title: "Monthly Surplus", value: 2000, format: "currency", icon: "📈", tooltip: "test", positive: true },
      { title: "Financial Runway", value: 15.0, format: "months", icon: "🛡️", tooltip: "test", positive: true },
      { title: "Debt-to-Asset Ratio", value: 0.5, format: "ratio", icon: "⚖️", tooltip: "test", positive: true },
    ];
    render(<SnapshotDashboard metrics={metrics} />);
    expect(screen.getByTestId("runway-celebration-text")).toHaveTextContent("Excellent safety net!");
  });

  it("does NOT show celebratory glow when runway is below 12 months", () => {
    const metrics: MetricData[] = [
      { title: "Net Worth", value: 50000, format: "currency", icon: "💰", tooltip: "test", positive: true },
      { title: "Monthly Surplus", value: 1000, format: "currency", icon: "📈", tooltip: "test", positive: true },
      { title: "Financial Runway", value: 8.0, format: "months", icon: "🛡️", tooltip: "test", positive: true },
      { title: "Debt-to-Asset Ratio", value: 1.0, format: "ratio", icon: "⚖️", tooltip: "test", positive: false },
    ];
    render(<SnapshotDashboard metrics={metrics} />);
    const runwayCard = screen.getByRole("group", { name: "Financial Runway" });
    expect(runwayCard.getAttribute("data-runway-celebration")).toBeNull();
    expect(runwayCard.className).not.toContain("animate-glow-pulse");
    expect(screen.queryByTestId("runway-celebration-text")).not.toBeInTheDocument();
  });

  it("does NOT show glow when runway is exactly 12 months", () => {
    const metrics: MetricData[] = [
      { title: "Net Worth", value: 50000, format: "currency", icon: "💰", tooltip: "test", positive: true },
      { title: "Monthly Surplus", value: 1000, format: "currency", icon: "📈", tooltip: "test", positive: true },
      { title: "Financial Runway", value: 12.0, format: "months", icon: "🛡️", tooltip: "test", positive: true },
      { title: "Debt-to-Asset Ratio", value: 1.0, format: "ratio", icon: "⚖️", tooltip: "test", positive: false },
    ];
    render(<SnapshotDashboard metrics={metrics} />);
    const runwayCard = screen.getByRole("group", { name: "Financial Runway" });
    expect(runwayCard.className).not.toContain("animate-glow-pulse");
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

  it("goal empty state shows icon and message", () => {
    render(<GoalEntry items={[]} />);
    const emptyState = screen.getByTestId("goal-empty-state");
    expect(emptyState).toBeInTheDocument();
    expect(emptyState.querySelector("svg")).toBeInTheDocument();
    expect(screen.getByText(/Set financial goals/)).toBeInTheDocument();
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

  it("Add Goal confirm button has active:scale-95 class", async () => {
    const user = userEvent.setup();
    render(<GoalEntry />);
    await user.click(screen.getByText("+ Add Goal"));
    const confirmBtn = screen.getByLabelText("Confirm add goal");
    expect(confirmBtn.className).toContain("active:scale-95");
  });
});
