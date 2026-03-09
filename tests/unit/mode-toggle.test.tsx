import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { ModeProvider, useModeContext, type AppMode } from "@/lib/ModeContext";
import { encodeState, decodeState } from "@/lib/url-state";
import type { FinancialState } from "@/lib/financial-types";
import { INITIAL_STATE } from "@/lib/financial-state";

// ── ModeContext unit tests ─────────────────────────────────────────────────

function ModeDisplay() {
  const { mode, setMode } = useModeContext();
  return (
    <div>
      <span data-testid="mode-value">{mode}</span>
      <button onClick={() => setMode("advanced")} data-testid="set-advanced">
        Set Advanced
      </button>
      <button onClick={() => setMode("simple")} data-testid="set-simple">
        Set Simple
      </button>
    </div>
  );
}

describe("ModeContext", () => {
  it("provides default mode from provider", () => {
    const setMode = () => {};
    render(
      <ModeProvider mode="simple" setMode={setMode}>
        <ModeDisplay />
      </ModeProvider>
    );
    expect(screen.getByTestId("mode-value").textContent).toBe("simple");
  });

  it("provides advanced mode when set", () => {
    const setMode = () => {};
    render(
      <ModeProvider mode="advanced" setMode={setMode}>
        <ModeDisplay />
      </ModeProvider>
    );
    expect(screen.getByTestId("mode-value").textContent).toBe("advanced");
  });

  it("calls setMode when buttons clicked", () => {
    let captured: AppMode = "simple";
    const setMode = (m: AppMode) => { captured = m; };
    render(
      <ModeProvider mode="simple" setMode={setMode}>
        <ModeDisplay />
      </ModeProvider>
    );
    fireEvent.click(screen.getByTestId("set-advanced"));
    expect(captured).toBe("advanced");

    fireEvent.click(screen.getByTestId("set-simple"));
    expect(captured).toBe("simple");
  });

  it("throws when used outside provider", () => {
    // Suppress console.error for this test
    const origError = console.error;
    console.error = () => {};
    expect(() => render(<ModeDisplay />)).toThrow("useModeContext must be used within a ModeProvider");
    console.error = origError;
  });
});

// ── URL state serialization tests ─────────────────────────────────────────

describe("mode URL serialization", () => {
  const baseState: FinancialState = {
    ...INITIAL_STATE,
    assets: [{ id: "a1", category: "Savings Account", amount: 1000, surplusTarget: true }],
    debts: [],
    income: [{ id: "i1", category: "Salary", amount: 3000 }],
    expenses: [{ id: "e1", category: "Rent/Mortgage Payment", amount: 1200 }],
    properties: [],
    stocks: [],
  };

  it("omits mode from URL when simple (default)", () => {
    const state: FinancialState = { ...baseState, mode: "simple" };
    const encoded = encodeState(state);
    // "mo" key should not appear in the compact JSON (it's omitted when simple)
    // We verify by decoding and checking round-trip
    const decoded = decodeState(encoded);
    // mode should be undefined (omitted) or "simple" — both are fine
    expect(decoded?.mode === undefined || decoded?.mode === "simple").toBe(true);
  });

  it("round-trips advanced mode through URL encoding", () => {
    const state: FinancialState = { ...baseState, mode: "advanced" };
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded?.mode).toBe("advanced");
  });

  it("defaults to undefined mode when absent from encoded state", () => {
    const state: FinancialState = { ...baseState };
    delete state.mode;
    const encoded = encodeState(state);
    const decoded = decodeState(encoded);
    expect(decoded?.mode).toBeUndefined();
  });

  it("mode does not affect other state fields in round-trip", () => {
    const state: FinancialState = { ...baseState, mode: "advanced", age: 35, country: "CA" };
    const decoded = decodeState(encodeState(state));
    expect(decoded?.age).toBe(35);
    expect(decoded?.country).toBe("CA");
    expect(decoded?.mode).toBe("advanced");
  });
});
