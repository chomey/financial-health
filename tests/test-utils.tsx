import React, { useState } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { CurrencyProvider } from "@/lib/CurrencyContext";
import type { SupportedCurrency } from "@/lib/currency";
import type { CountryCode } from "@/lib/countries";
import { ModeProvider, type AppMode } from "@/lib/ModeContext";

function TestProviders({
  children,
  currency = "USD",
  country = "US",
  mode = "advanced",
}: {
  children: React.ReactNode;
  currency?: SupportedCurrency;
  country?: CountryCode;
  mode?: AppMode;
}) {
  const [currentMode, setCurrentMode] = useState<AppMode>(mode);
  return (
    <ModeProvider mode={currentMode} setMode={setCurrentMode}>
      <CurrencyProvider currency={currency} country={country}>{children}</CurrencyProvider>
    </ModeProvider>
  );
}

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { currency?: SupportedCurrency; country?: CountryCode; mode?: AppMode },
) {
  const { currency, country, mode, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders currency={currency} country={country} mode={mode}>{children}</TestProviders>
    ),
    ...renderOptions,
  });
}

export { customRender as render };
