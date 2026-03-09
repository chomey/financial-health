import React, { useState } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { CurrencyProvider } from "@/lib/CurrencyContext";
import type { SupportedCurrency } from "@/lib/currency";
import { ModeProvider, type AppMode } from "@/lib/ModeContext";

function TestProviders({
  children,
  currency = "USD",
  mode = "advanced",
}: {
  children: React.ReactNode;
  currency?: SupportedCurrency;
  mode?: AppMode;
}) {
  const [currentMode, setCurrentMode] = useState<AppMode>(mode);
  return (
    <ModeProvider mode={currentMode} setMode={setCurrentMode}>
      <CurrencyProvider currency={currency}>{children}</CurrencyProvider>
    </ModeProvider>
  );
}

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { currency?: SupportedCurrency; mode?: AppMode },
) {
  const { currency, mode, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders currency={currency} mode={mode}>{children}</TestProviders>
    ),
    ...renderOptions,
  });
}

export { customRender as render };
