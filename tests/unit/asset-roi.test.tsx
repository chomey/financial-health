import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import AssetEntry, { getDefaultRoi, DEFAULT_ROI } from "@/components/AssetEntry";
import type { Asset } from "@/components/AssetEntry";
import { encodeState, decodeState, toCompact, fromCompact } from "@/lib/url-state";
import type { FinancialState } from "@/lib/financial-state";

function ControlledAssetEntry({ items: initial }: { items?: Asset[] }) {
  const [items, setItems] = useState(initial);
  return <AssetEntry items={items} onChange={setItems} />;
}

describe("getDefaultRoi", () => {
  it("returns 7 for 401k", () => {
    expect(getDefaultRoi("401k")).toBe(7);
  });

  it("returns 7 for IRA and Roth IRA", () => {
    expect(getDefaultRoi("IRA")).toBe(7);
    expect(getDefaultRoi("Roth IRA")).toBe(7);
  });

  it("returns 5 for Canadian accounts", () => {
    expect(getDefaultRoi("TFSA")).toBe(5);
    expect(getDefaultRoi("RRSP")).toBe(5);
    expect(getDefaultRoi("RESP")).toBe(5);
    expect(getDefaultRoi("FHSA")).toBe(5);
    expect(getDefaultRoi("LIRA")).toBe(5);
  });

  it("returns 2 for Savings", () => {
    expect(getDefaultRoi("Savings")).toBe(2);
    expect(getDefaultRoi("Savings Account")).toBe(2);
  });

  it("returns undefined for unknown categories", () => {
    expect(getDefaultRoi("Unknown Category")).toBeUndefined();
    expect(getDefaultRoi("Other")).toBeUndefined();
  });
});

describe("Asset ROI and contribution UI", () => {
  it("shows ROI suggested badge for known account types", () => {
    const items = [{ id: "a1", category: "TFSA", amount: 35000 }];
    render(<AssetEntry items={items} />);
    const roiBadge = screen.getByTestId("roi-badge-a1");
    expect(roiBadge).toHaveTextContent("5% ROI (suggested)");
  });

  it("shows placeholder text for unknown category ROI", () => {
    const items = [{ id: "a1", category: "Other", amount: 5000 }];
    render(<AssetEntry items={items} />);
    const roiBadge = screen.getByTestId("roi-badge-a1");
    expect(roiBadge).toHaveTextContent("Annual return %");
  });

  it("shows set ROI without (suggested) label", () => {
    const items = [{ id: "a1", category: "TFSA", amount: 35000, roi: 8 }];
    render(<AssetEntry items={items} />);
    const roiBadge = screen.getByTestId("roi-badge-a1");
    expect(roiBadge).toHaveTextContent("8% ROI");
    expect(roiBadge).not.toHaveTextContent("suggested");
  });

  it("shows contribution badge when set", () => {
    const items = [{ id: "a1", category: "TFSA", amount: 35000, monthlyContribution: 500 }];
    render(<AssetEntry items={items} />);
    const badge = screen.getByTestId("contribution-badge-a1");
    expect(badge).toHaveTextContent("+$500/mo");
  });

  it("shows placeholder for monthly contribution when not set", () => {
    const items = [{ id: "a1", category: "TFSA", amount: 35000 }];
    render(<AssetEntry items={items} />);
    const badge = screen.getByTestId("contribution-badge-a1");
    expect(badge).toHaveTextContent("Monthly contribution");
  });

  it("allows editing ROI via click", async () => {
    const user = userEvent.setup();
    const items = [{ id: "a1", category: "TFSA", amount: 35000 }];
    render(<ControlledAssetEntry items={items} />);

    await user.click(screen.getByTestId("roi-badge-a1"));
    const input = screen.getByLabelText("Edit ROI for TFSA");
    expect(input).toBeInTheDocument();

    await user.clear(input);
    await user.type(input, "8");
    await user.keyboard("{Enter}");

    // After editing, should show the user-set value
    const badge = screen.getByTestId("roi-badge-a1");
    expect(badge).toHaveTextContent("8% ROI");
    expect(badge).not.toHaveTextContent("suggested");
  });

  it("allows editing monthly contribution via click", async () => {
    const user = userEvent.setup();
    const items = [{ id: "a1", category: "TFSA", amount: 35000 }];
    render(<ControlledAssetEntry items={items} />);

    await user.click(screen.getByTestId("contribution-badge-a1"));
    const input = screen.getByLabelText("Edit monthly contribution for TFSA");
    expect(input).toBeInTheDocument();

    await user.type(input, "500");
    await user.keyboard("{Enter}");

    const badge = screen.getByTestId("contribution-badge-a1");
    expect(badge).toHaveTextContent("+$500/mo");
  });

  it("calls onChange when ROI is set", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const items = [{ id: "a1", category: "TFSA", amount: 35000 }];
    render(<AssetEntry items={items} onChange={onChange} />);

    await user.click(screen.getByTestId("roi-badge-a1"));
    const input = screen.getByLabelText("Edit ROI for TFSA");
    await user.type(input, "10");
    await user.keyboard("{Enter}");

    // onChange should be called with updated assets
    expect(onChange).toHaveBeenCalled();
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0];
    expect(lastCall[0].roi).toBe(10);
  });
});

describe("URL state encoding with ROI and contributions", () => {
  it("roundtrips assets with ROI", () => {
    const state: FinancialState = {
      assets: [{ id: "a1", category: "TFSA", amount: 35000, roi: 8 }],
      debts: [],
      income: [],
      expenses: [],

      properties: [],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.assets[0].roi).toBe(8);
  });

  it("roundtrips assets with monthly contribution", () => {
    const state: FinancialState = {
      assets: [{ id: "a1", category: "TFSA", amount: 35000, monthlyContribution: 500 }],
      debts: [],
      income: [],
      expenses: [],

      properties: [],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.assets[0].monthlyContribution).toBe(500);
  });

  it("roundtrips assets with both ROI and contribution", () => {
    const state: FinancialState = {
      assets: [{ id: "a1", category: "401k", amount: 100000, roi: 7, monthlyContribution: 1000 }],
      debts: [],
      income: [],
      expenses: [],

      properties: [],
    };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded).not.toBeNull();
    expect(decoded!.assets[0].roi).toBe(7);
    expect(decoded!.assets[0].monthlyContribution).toBe(1000);
  });

  it("does not include ROI/contribution in compact when not set", () => {
    const state: FinancialState = {
      assets: [{ id: "a1", category: "TFSA", amount: 35000 }],
      debts: [],
      income: [],
      expenses: [],

      properties: [],
    };
    const compact = toCompact(state);
    expect(compact.a[0]).toEqual({ c: "TFSA", a: 35000 });
    expect(compact.a[0].r).toBeUndefined();
    expect(compact.a[0].m).toBeUndefined();
  });

  it("includes ROI/contribution in compact when set", () => {
    const state: FinancialState = {
      assets: [{ id: "a1", category: "401k", amount: 50000, roi: 7, monthlyContribution: 500 }],
      debts: [],
      income: [],
      expenses: [],

      properties: [],
    };
    const compact = toCompact(state);
    expect(compact.a[0].r).toBe(7);
    expect(compact.a[0].m).toBe(500);
  });

  it("restores ROI/contribution from compact", () => {
    const compact = {
      a: [{ c: "TFSA", a: 35000, r: 5, m: 200 }],
      d: [],
      i: [],
      e: [],

    };
    const state = fromCompact(compact);
    expect(state.assets[0].roi).toBe(5);
    expect(state.assets[0].monthlyContribution).toBe(200);
  });

  it("backward compat: no ROI/contribution in compact still works", () => {
    const compact = {
      a: [{ c: "TFSA", a: 35000 }],
      d: [],
      i: [],
      e: [],

    };
    const state = fromCompact(compact);
    expect(state.assets[0].roi).toBeUndefined();
    expect(state.assets[0].monthlyContribution).toBeUndefined();
  });
});

// Need to import vi for the onChange spy
import { vi } from "vitest";
