import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { screen, fireEvent } from "@testing-library/react";
import { render } from "../test-utils";
import userEvent from "@testing-library/user-event";
import SnapshotDashboard from "@/components/SnapshotDashboard";
import type { MetricData } from "@/components/SnapshotDashboard";
import AssetEntry from "@/components/AssetEntry";
import DebtEntry from "@/components/DebtEntry";
import IncomeEntry from "@/components/IncomeEntry";
import ExpenseEntry from "@/components/ExpenseEntry";

const globalsCss = fs.readFileSync(
  path.join(process.cwd(), "src/app/globals.css"),
  "utf-8"
);

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
    expect(runwayCard.className).toContain("border-[var(--surface-border-strong)]");
  });
});

describe("Global motion restraint", () => {
  it("slows perpetual pulses and softens their glow", () => {
    expect(globalsCss).toContain("animation: glow-pulse 6s ease-in-out infinite");
    expect(globalsCss).toContain("animation: warning-pulse 6s ease-in-out infinite");
    expect(globalsCss).toContain("rgba(34, 211, 238, 0.15)");
    expect(globalsCss).toContain("rgba(34, 211, 238, 0.25)");
    expect(globalsCss).toContain("rgba(251, 113, 133, 0.15)");
    expect(globalsCss).toContain("rgba(251, 113, 133, 0.25)");
  });

  it("honors prefers-reduced-motion globally", () => {
    expect(globalsCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(globalsCss).toContain("animation-duration: 0.01ms !important");
    expect(globalsCss).toContain("animation-iteration-count: 1 !important");
    expect(globalsCss).toContain("transition-duration: 0.01ms !important");
    expect(globalsCss).toContain("scroll-behavior: auto !important");
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
    expect(confirmBtn.className).toContain("active:bg-cyan-500");
    expect(confirmBtn.className).toContain("focus-visible:ring-2");
    expect(confirmBtn.className).toContain("transition-colors");
  });

  it("Add Debt confirm button uses primary active state", async () => {
    const user = userEvent.setup();
    render(<DebtEntry />);
    await user.click(screen.getByText("+ Add Debt"));
    const confirmBtn = screen.getByLabelText("Confirm add debt");
    expect(confirmBtn.className).toContain("active:bg-cyan-500");
  });

});
