import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "../test-utils";
import AssetEntry from "@/components/AssetEntry";
import type { Asset } from "@/components/AssetEntry";

const SAMPLE_ASSETS: Asset[] = [
  { id: "a1", category: "Savings Account", amount: 10000, roi: 2, monthlyContribution: 200, surplusTarget: true },
  { id: "a2", category: "RRSP", amount: 30000, roi: 5, employerMatchPct: 50, employerMatchCap: 6 },
  { id: "a3", category: "Brokerage", amount: 5000, costBasisPercent: 60, taxTreatment: "taxable" },
];

const COMPUTED_ASSET: Asset = {
  id: "_computed_equity",
  category: "Property Equity",
  amount: 200000,
  computed: true,
};

describe("AssetEntry — simple mode", () => {
  it("shows category and amount in simple mode", () => {
    render(<AssetEntry items={SAMPLE_ASSETS} />, { mode: "simple" });
    expect(screen.getByText("Savings Account")).toBeInTheDocument();
    expect(screen.getByText("$10,000")).toBeInTheDocument();
    expect(screen.getByText("RRSP")).toBeInTheDocument();
    expect(screen.getByText("$30,000")).toBeInTheDocument();
  });

  it("hides ROI badge in simple mode", () => {
    render(<AssetEntry items={SAMPLE_ASSETS} />, { mode: "simple" });
    expect(screen.queryByTestId("roi-badge-a1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("roi-badge-a2")).not.toBeInTheDocument();
  });

  it("hides tax treatment pill in simple mode", () => {
    render(<AssetEntry items={SAMPLE_ASSETS} />, { mode: "simple" });
    expect(screen.queryByTestId("tax-treatment-pill-a1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("tax-treatment-pill-a2")).not.toBeInTheDocument();
  });

  it("hides monthly contribution badge in simple mode", () => {
    render(<AssetEntry items={SAMPLE_ASSETS} />, { mode: "simple" });
    expect(screen.queryByTestId("contribution-badge-a1")).not.toBeInTheDocument();
  });

  it("hides employer match section in simple mode", () => {
    render(<AssetEntry items={SAMPLE_ASSETS} />, { mode: "simple" });
    expect(screen.queryByTestId("employer-match-section-a2")).not.toBeInTheDocument();
  });

  it("hides cost basis badge in simple mode", () => {
    render(<AssetEntry items={SAMPLE_ASSETS} />, { mode: "simple" });
    expect(screen.queryByTestId("cost-basis-badge-a3")).not.toBeInTheDocument();
  });

  it("hides surplus target radio in simple mode", () => {
    render(<AssetEntry items={SAMPLE_ASSETS} />, { mode: "simple" });
    expect(screen.queryByTestId("surplus-target-a1")).not.toBeInTheDocument();
  });

  it("hides computed assets in simple mode", () => {
    render(<AssetEntry items={[...SAMPLE_ASSETS, COMPUTED_ASSET]} />, { mode: "simple" });
    expect(screen.queryByText("Property Equity")).not.toBeInTheDocument();
  });

  it("hides per-asset projections in simple mode", () => {
    render(<AssetEntry items={SAMPLE_ASSETS} />, { mode: "simple" });
    expect(screen.queryByTestId("asset-projection-a1")).not.toBeInTheDocument();
    expect(screen.queryByTestId("asset-projection-a2")).not.toBeInTheDocument();
  });

  it("still shows total and Add Asset button in simple mode", () => {
    render(<AssetEntry items={SAMPLE_ASSETS} />, { mode: "simple" });
    expect(screen.getByText(/Total:/)).toBeInTheDocument();
    expect(screen.getByText("+ Add Asset")).toBeInTheDocument();
  });
});

describe("AssetEntry — advanced mode (default)", () => {
  it("shows ROI badge in advanced mode", () => {
    render(<AssetEntry items={SAMPLE_ASSETS} />, { mode: "advanced" });
    expect(screen.getByTestId("roi-badge-a1")).toBeInTheDocument();
    expect(screen.getByTestId("roi-badge-a2")).toBeInTheDocument();
  });

  it("shows tax treatment pill in advanced mode", () => {
    render(<AssetEntry items={SAMPLE_ASSETS} />, { mode: "advanced" });
    expect(screen.getByTestId("tax-treatment-pill-a1")).toBeInTheDocument();
  });

  it("shows computed assets in advanced mode", () => {
    render(<AssetEntry items={[...SAMPLE_ASSETS, COMPUTED_ASSET]} />, { mode: "advanced" });
    expect(screen.getByText("Property Equity")).toBeInTheDocument();
  });

  it("shows monthly contribution badge in advanced mode", () => {
    render(<AssetEntry items={SAMPLE_ASSETS} />, { mode: "advanced" });
    expect(screen.getByTestId("contribution-badge-a1")).toBeInTheDocument();
  });

  it("shows surplus target radio in advanced mode", () => {
    render(<AssetEntry items={SAMPLE_ASSETS} />, { mode: "advanced" });
    expect(screen.getByTestId("surplus-target-a1")).toBeInTheDocument();
  });
});
