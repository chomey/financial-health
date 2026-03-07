import React from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { CurrencyProvider } from "@/lib/CurrencyContext";
import type { SupportedCurrency } from "@/lib/currency";

function TestProviders({
  children,
  currency = "USD",
}: {
  children: React.ReactNode;
  currency?: SupportedCurrency;
}) {
  return (
    <CurrencyProvider currency={currency}>{children}</CurrencyProvider>
  );
}

function customRender(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, "wrapper"> & { currency?: SupportedCurrency },
) {
  const { currency, ...renderOptions } = options ?? {};
  return render(ui, {
    wrapper: ({ children }) => (
      <TestProviders currency={currency}>{children}</TestProviders>
    ),
    ...renderOptions,
  });
}

export { customRender as render };
