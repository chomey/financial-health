/**
 * T1 unit tests: dark theme for page layout, FastForwardPanel, InsightsPanel,
 * and related components (Task 131)
 */
import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";
import InsightsPanel from "@/components/InsightsPanel";
import BenchmarkComparisons from "@/components/BenchmarkComparisons";
import FxRateDisplay from "@/components/FxRateDisplay";
import CurrencyBadge from "@/components/CurrencyBadge";

describe("InsightsPanel dark theme", () => {
  it("renders insight cards with dark glass style", () => {
    const { container } = render(
      <InsightsPanel
        data={{
          totalAssets: 100000,
          totalDebts: 10000,
          monthlyIncome: 5000,
          monthlyExpenses: 3000,
        }}
      />
    );
    // There should be insight cards with dark glass bg
    const cards = container.querySelectorAll('[data-testid^="insight-card-"]');
    expect(cards.length).toBeGreaterThan(0);
    const firstCard = cards[0] as HTMLElement;
    expect(firstCard.className).toContain("bg-white/5");
    expect(firstCard.className).toContain("border-white/10");
  });

  it("insight card text uses slate-300", () => {
    const { container } = render(
      <InsightsPanel
        data={{
          totalAssets: 100000,
          totalDebts: 10000,
          monthlyIncome: 5000,
          monthlyExpenses: 3000,
        }}
      />
    );
    const p = container.querySelector('[data-testid^="insight-card-"] p');
    expect((p as HTMLElement).className).toContain("text-slate-300");
  });
});

describe("BenchmarkComparisons dark theme", () => {
  it("renders dark glass card container", () => {
    const { container } = render(
      <BenchmarkComparisons
        age={35}
        country="US"
        netWorth={100000}
        savingsRate={0.2}
        emergencyMonths={6}
        debtToIncomeRatio={0.15}
        annualIncome={80000}
        onAgeChange={() => {}}
      />
    );
    const card = container.querySelector('[data-testid="benchmark-comparisons"]') as HTMLElement;
    expect(card.className).toContain("bg-white/5");
    expect(card.className).toContain("border-white/10");
  });

  it("heading uses light text color", () => {
    render(
      <BenchmarkComparisons
        age={35}
        country="US"
        netWorth={100000}
        savingsRate={0.2}
        emergencyMonths={6}
        debtToIncomeRatio={0.15}
        annualIncome={80000}
        onAgeChange={() => {}}
      />
    );
    const heading = screen.getByText("How You Compare");
    expect(heading.className).toContain("text-slate-200");
  });
});

describe("FxRateDisplay dark theme", () => {
  it("container uses slate text color", () => {
    const { container } = render(
      <FxRateDisplay
        homeCurrency="CAD"
        foreignCurrency="USD"
        fxRates={{ "USD/CAD": 1.35 }}
        onManualOverrideChange={() => {}}
      />
    );
    const wrapper = container.querySelector('[data-testid="fx-rate-display"]') as HTMLElement;
    expect(wrapper.className).toContain("text-slate-400");
  });

  it("fx-badge-live uses emerald dark colors", () => {
    const { container } = render(
      <FxRateDisplay
        homeCurrency="CAD"
        foreignCurrency="USD"
        fxRates={{ "USD/CAD": 1.35 }}
        onManualOverrideChange={() => {}}
      />
    );
    const badge = container.querySelector('[data-testid="fx-badge-live"]') as HTMLElement;
    expect(badge.className).toContain("bg-emerald-400/15");
    expect(badge.className).toContain("text-emerald-300");
  });
});

describe("CurrencyBadge dark theme", () => {
  it("home currency badge uses dark style", () => {
    const { container } = render(
      <CurrencyBadge
        homeCurrency="CAD"
        amount={1000}
        fxRates={{}}
        onCurrencyChange={() => {}}
      />
    );
    const badge = container.querySelector('[data-testid="currency-badge"]') as HTMLElement;
    expect(badge.className).toContain("bg-white/5");
    expect(badge.className).toContain("text-slate-500");
  });
});
