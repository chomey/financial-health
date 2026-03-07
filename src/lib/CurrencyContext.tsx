"use client";

import { createContext, useContext, useMemo } from "react";
import { CurrencyFormatter, type SupportedCurrency } from "@/lib/currency";

const CurrencyContext = createContext<CurrencyFormatter | null>(null);

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: SupportedCurrency;
  children: React.ReactNode;
}) {
  const fmt = useMemo(() => new CurrencyFormatter(currency), [currency]);
  return (
    <CurrencyContext.Provider value={fmt}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyFormatter {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return ctx;
}
