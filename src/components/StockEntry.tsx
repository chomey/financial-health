"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface StockHolding {
  id: string;
  ticker: string;
  shares: number;
  manualPrice?: number; // manual override price per share
  costBasis?: number; // optional cost basis per share
  lastFetchedPrice?: number; // auto-fetched price (not persisted in URL)
  lastUpdated?: string; // timestamp of last price fetch (not persisted)
}

/** Compute total value of a stock holding */
export function getStockValue(stock: StockHolding): number {
  const price = stock.manualPrice ?? stock.lastFetchedPrice ?? 0;
  return stock.shares * price;
}

/** Get the display price for a stock */
export function getStockPrice(stock: StockHolding): number {
  return stock.manualPrice ?? stock.lastFetchedPrice ?? 0;
}

/** Compute gain/loss for a stock if cost basis is set */
export function getStockGainLoss(stock: StockHolding): { amount: number; percentage: number } | null {
  if (stock.costBasis === undefined || stock.costBasis <= 0) return null;
  const currentPrice = getStockPrice(stock);
  if (currentPrice <= 0) return null;
  const amount = (currentPrice - stock.costBasis) * stock.shares;
  const percentage = ((currentPrice - stock.costBasis) / stock.costBasis) * 100;
  return { amount, percentage };
}

function generateId(): string {
  return `s${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, "");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

interface StockEntryProps {
  items?: StockHolding[];
  onChange?: (items: StockHolding[]) => void;
}

async function fetchStockPrice(ticker: string): Promise<{ price: number; timestamp: string } | null> {
  try {
    const res = await fetch(`/api/stock-price?ticker=${encodeURIComponent(ticker.toUpperCase())}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.price !== undefined && data.price !== null) {
      return { price: data.price, timestamp: data.timestamp || new Date().toISOString() };
    }
    return null;
  } catch {
    return null;
  }
}

const MOCK_STOCKS: StockHolding[] = [];

export default function StockEntry({ items, onChange }: StockEntryProps = {}) {
  const [stocks, setStocks] = useState<StockHolding[]>(items ?? MOCK_STOCKS);
  const isExternalSync = useRef(false);
  const didMount = useRef(false);
  const syncDidMount = useRef(false);

  // Sync with parent if controlled
  useEffect(() => {
    if (!syncDidMount.current) {
      syncDidMount.current = true;
      return;
    }
    if (items !== undefined) {
      isExternalSync.current = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStocks(items);
    }
  }, [items]);

  // Notify parent of internal changes
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (isExternalSync.current) {
      isExternalSync.current = false;
      return;
    }
    onChangeRef.current?.(stocks);
  }, [stocks]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<
    "ticker" | "shares" | "manualPrice" | "costBasis" | null
  >(null);
  const [editValue, setEditValue] = useState("");
  const [addingNew, setAddingNew] = useState(false);
  const [newTicker, setNewTicker] = useState("");
  const [newShares, setNewShares] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [fetchingPrices, setFetchingPrices] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const newTickerRef = useRef<HTMLInputElement>(null);
  const newSharesRef = useRef<HTMLInputElement>(null);
  const newPriceRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (addingNew && newTickerRef.current) {
      newTickerRef.current.focus();
    }
  }, [addingNew]);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId, editingField]);

  // Fetch price for a single stock
  const fetchPrice = useCallback(async (stockId: string, ticker: string) => {
    if (!ticker.trim()) return;
    setFetchingPrices((prev) => new Set(prev).add(stockId));
    const result = await fetchStockPrice(ticker);
    if (result) {
      setStocks((prev) =>
        prev.map((s) =>
          s.id === stockId
            ? { ...s, lastFetchedPrice: result.price, lastUpdated: result.timestamp }
            : s
        )
      );
    }
    setFetchingPrices((prev) => {
      const next = new Set(prev);
      next.delete(stockId);
      return next;
    });
  }, []);

  // Fetch all prices
  const refreshAllPrices = useCallback(async () => {
    const toFetch = stocks.filter((s) => s.ticker.trim());
    if (toFetch.length === 0) return;
    const ids = new Set(toFetch.map((s) => s.id));
    setFetchingPrices(ids);
    await Promise.all(
      toFetch.map(async (stock) => {
        const result = await fetchStockPrice(stock.ticker);
        if (result) {
          setStocks((prev) =>
            prev.map((s) =>
              s.id === stock.id
                ? { ...s, lastFetchedPrice: result.price, lastUpdated: result.timestamp }
                : s
            )
          );
        }
        setFetchingPrices((prev) => {
          const next = new Set(prev);
          next.delete(stock.id);
          return next;
        });
      })
    );
  }, [stocks]);

  // Auto-fetch prices for stocks that have tickers but no price
  // Track which tickers we've already fetched to avoid duplicate requests
  const fetchedTickersRef = useRef(new Set<string>());
  useEffect(() => {
    const needFetch = stocks.filter(
      (s) => s.ticker.trim() && !s.manualPrice && !s.lastFetchedPrice && !fetchedTickersRef.current.has(s.ticker)
    );
    if (needFetch.length > 0) {
      needFetch.forEach((s) => {
        fetchedTickersRef.current.add(s.ticker);
        fetchPrice(s.id, s.ticker);
      });
    }
  }, [stocks, fetchPrice]);

  const startEdit = (
    id: string,
    field: "ticker" | "shares" | "manualPrice" | "costBasis",
    currentValue: string
  ) => {
    setEditingId(id);
    setEditingField(field);
    setEditValue(currentValue);
  };

  const commitEdit = () => {
    if (editingId && editingField) {
      setStocks((prev) =>
        prev.map((s) => {
          if (s.id !== editingId) return s;
          if (editingField === "ticker") {
            const newTicker = editValue.toUpperCase().trim() || s.ticker;
            return { ...s, ticker: newTicker, lastFetchedPrice: undefined, lastUpdated: undefined };
          }
          if (editingField === "shares") {
            const val = parseCurrencyInput(editValue);
            return { ...s, shares: val };
          }
          if (editingField === "manualPrice") {
            const val = parseCurrencyInput(editValue);
            return { ...s, manualPrice: val || undefined };
          }
          if (editingField === "costBasis") {
            const val = parseCurrencyInput(editValue);
            return { ...s, costBasis: val || undefined };
          }
          return s;
        })
      );
      // If ticker was changed, fetch new price
      if (editingField === "ticker" && editValue.trim()) {
        fetchPrice(editingId, editValue.trim());
      }
    }
    setEditingId(null);
    setEditingField(null);
    setEditValue("");
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      commitEdit();
    } else if (e.key === "Escape") {
      setEditingId(null);
      setEditingField(null);
    }
  };

  const deleteStock = (id: string) => {
    setStocks((prev) => prev.filter((s) => s.id !== id));
  };

  const addStock = () => {
    if (!newTicker.trim()) return;
    const shares = parseCurrencyInput(newShares) || 0;
    const price = parseCurrencyInput(newPrice);
    const id = generateId();
    const stock: StockHolding = {
      id,
      ticker: newTicker.toUpperCase().trim(),
      shares,
      manualPrice: price || undefined,
    };
    setStocks((prev) => [...prev, stock]);
    // Fetch price if no manual price set
    if (!price && newTicker.trim()) {
      fetchPrice(id, newTicker.trim());
    }
    setNewTicker("");
    setNewShares("");
    setNewPrice("");
    setAddingNew(false);
  };

  const handleNewKeyDown = (
    e: React.KeyboardEvent,
    field: "ticker" | "shares" | "price"
  ) => {
    if (e.key === "Enter") {
      if (field === "ticker" && newSharesRef.current) {
        newSharesRef.current.focus();
      } else if (field === "shares" && newPriceRef.current) {
        newPriceRef.current.focus();
      } else {
        addStock();
      }
    } else if (e.key === "Escape") {
      setAddingNew(false);
      setNewTicker("");
      setNewShares("");
      setNewPrice("");
    }
  };

  const total = stocks.reduce((sum, s) => sum + getStockValue(s), 0);

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-stone-800">
          <span aria-hidden="true">📈</span>
          Stocks &amp; Equity
        </h2>
        {stocks.length > 0 && (
          <button
            type="button"
            onClick={refreshAllPrices}
            disabled={fetchingPrices.size > 0}
            className="rounded-md px-2 py-1 text-xs font-medium text-blue-600 transition-all duration-150 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh all stock prices"
            data-testid="refresh-all-prices"
          >
            {fetchingPrices.size > 0 ? (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Updating...
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </span>
            )}
          </button>
        )}
      </div>

      {stocks.length === 0 && !addingNew ? (
        <div className="flex flex-col items-center py-4 text-center" data-testid="stock-empty-state">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-sm text-stone-400">
            Track your stock and equity holdings to include them in your net worth.
          </p>
        </div>
      ) : (
        <div className="space-y-1" role="list" aria-label="Stock holdings">
          {stocks.map((stock) => {
            const price = getStockPrice(stock);
            const value = getStockValue(stock);
            const gainLoss = getStockGainLoss(stock);
            const isFetching = fetchingPrices.has(stock.id);
            return (
              <div key={stock.id} role="listitem">
                <div className="group flex items-center justify-between rounded-lg px-3 py-2 transition-all duration-200 hover:bg-stone-50">
                  <div className="flex flex-1 items-center gap-3 min-w-0">
                    {/* Ticker */}
                    {editingId === stock.id && editingField === "ticker" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                        onBlur={commitEdit}
                        onKeyDown={handleEditKeyDown}
                        className="w-24 rounded-md border border-blue-300 bg-white px-2 py-1 text-sm font-mono font-medium text-stone-800 uppercase outline-none ring-2 ring-blue-100 transition-all duration-200"
                        aria-label="Edit ticker symbol"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(stock.id, "ticker", stock.ticker)}
                        className="min-h-[44px] sm:min-h-0 rounded px-2 py-2 sm:py-1 text-sm font-mono font-semibold text-stone-800 transition-colors duration-150 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        aria-label={`Edit ticker for ${stock.ticker}`}
                        data-testid={`ticker-${stock.id}`}
                      >
                        {stock.ticker || "???"}
                      </button>
                    )}

                    {/* Shares */}
                    {editingId === stock.id && editingField === "shares" ? (
                      <input
                        ref={inputRef}
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={commitEdit}
                        onKeyDown={handleEditKeyDown}
                        className="w-20 rounded-md border border-blue-300 bg-white px-2 py-1 text-right text-sm text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200"
                        aria-label={`Edit shares for ${stock.ticker}`}
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(stock.id, "shares", String(stock.shares))}
                        className="min-h-[44px] sm:min-h-0 rounded px-2 py-2 sm:py-1 text-sm text-stone-500 transition-colors duration-150 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        aria-label={`Edit shares for ${stock.ticker}, currently ${stock.shares} shares`}
                      >
                        {stock.shares} shares
                      </button>
                    )}

                    {/* Price display */}
                    <span className="text-xs text-stone-400">
                      @{" "}
                      {isFetching ? (
                        <span className="inline-flex items-center gap-1">
                          <svg className="h-3 w-3 animate-spin text-blue-400" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        </span>
                      ) : (
                        formatPrice(price)
                      )}
                    </span>

                    {/* Total value */}
                    <span
                      className="ml-auto text-sm font-medium text-green-700"
                      data-testid={`stock-value-${stock.id}`}
                    >
                      {formatCurrency(value)}
                    </span>
                  </div>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => deleteStock(stock.id)}
                    className="ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md p-2 text-stone-400 sm:min-h-0 sm:min-w-0 sm:p-1 sm:text-stone-300 sm:opacity-0 transition-all duration-150 hover:bg-rose-50 hover:text-rose-500 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-rose-200 sm:group-hover:opacity-100"
                    aria-label={`Delete ${stock.ticker}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                {/* Secondary details: manual price override, cost basis, gain/loss */}
                <div className="flex flex-wrap items-center gap-2 px-5 pb-1" data-testid={`stock-details-${stock.id}`}>
                  {/* Manual price override */}
                  {editingId === stock.id && editingField === "manualPrice" ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={handleEditKeyDown}
                      className="w-24 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs text-stone-700 outline-none ring-1 ring-blue-100"
                      aria-label={`Edit manual price for ${stock.ticker}`}
                      placeholder="e.g. 150.00"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(stock.id, "manualPrice", String(stock.manualPrice ?? ""))}
                      className={`rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                        stock.manualPrice !== undefined
                          ? "bg-amber-50 text-amber-600 hover:bg-amber-100"
                          : "text-stone-300 hover:bg-stone-50 hover:text-stone-400"
                      }`}
                      aria-label={`Set manual price for ${stock.ticker}${stock.manualPrice ? `, currently ${formatPrice(stock.manualPrice)}` : ""}`}
                      data-testid={`manual-price-${stock.id}`}
                    >
                      {stock.manualPrice !== undefined
                        ? `Manual: ${formatPrice(stock.manualPrice)}`
                        : "Manual price"}
                    </button>
                  )}

                  {/* Cost basis */}
                  {editingId === stock.id && editingField === "costBasis" ? (
                    <input
                      ref={inputRef}
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={handleEditKeyDown}
                      className="w-24 rounded border border-blue-300 bg-white px-1.5 py-0.5 text-xs text-stone-700 outline-none ring-1 ring-blue-100"
                      aria-label={`Edit cost basis for ${stock.ticker}`}
                      placeholder="e.g. 120.00"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(stock.id, "costBasis", String(stock.costBasis ?? ""))}
                      className={`rounded px-1.5 py-0.5 text-xs transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                        stock.costBasis !== undefined
                          ? "bg-stone-100 text-stone-600 hover:bg-stone-200"
                          : "text-stone-300 hover:bg-stone-50 hover:text-stone-400"
                      }`}
                      aria-label={`Set cost basis for ${stock.ticker}${stock.costBasis ? `, currently ${formatPrice(stock.costBasis)}` : ""}`}
                      data-testid={`cost-basis-${stock.id}`}
                    >
                      {stock.costBasis !== undefined
                        ? `Basis: ${formatPrice(stock.costBasis)}`
                        : "Cost basis"}
                    </button>
                  )}

                  {/* Gain/Loss display */}
                  {gainLoss && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                        gainLoss.amount >= 0
                          ? "bg-green-50 text-green-600"
                          : "bg-rose-50 text-rose-600"
                      }`}
                      data-testid={`gain-loss-${stock.id}`}
                    >
                      {gainLoss.amount >= 0 ? "+" : ""}
                      {formatCurrency(gainLoss.amount)} ({gainLoss.percentage >= 0 ? "+" : ""}
                      {gainLoss.percentage.toFixed(1)}%)
                    </span>
                  )}

                  {/* Last updated timestamp */}
                  {stock.lastUpdated && !stock.manualPrice && (
                    <span className="text-[10px] text-stone-300" data-testid={`last-updated-${stock.id}`}>
                      Updated {new Date(stock.lastUpdated).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add new stock row */}
      {addingNew && (
        <div className="mt-2 rounded-lg border border-dashed border-blue-200 bg-blue-50/50 px-3 py-2 animate-in">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              ref={newTickerRef}
              type="text"
              placeholder="Ticker (e.g. AAPL)"
              value={newTicker}
              onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
              onKeyDown={(e) => handleNewKeyDown(e, "ticker")}
              className="w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-base font-mono uppercase text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200 sm:w-28 sm:px-2 sm:py-1 sm:text-sm"
              aria-label="New stock ticker"
            />
            <input
              ref={newSharesRef}
              type="text"
              placeholder="Shares"
              value={newShares}
              onChange={(e) => setNewShares(e.target.value)}
              onKeyDown={(e) => handleNewKeyDown(e, "shares")}
              className="w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-right text-base text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200 sm:w-20 sm:px-2 sm:py-1 sm:text-sm"
              aria-label="Number of shares"
            />
            <input
              ref={newPriceRef}
              type="text"
              placeholder="Price (optional)"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              onKeyDown={(e) => handleNewKeyDown(e, "price")}
              className="w-full rounded-md border border-blue-300 bg-white px-3 py-2 text-right text-base text-stone-800 outline-none ring-2 ring-blue-100 transition-all duration-200 sm:w-28 sm:px-2 sm:py-1 sm:text-sm"
              aria-label="Price per share (leave empty to auto-fetch)"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addStock}
                className="min-h-[44px] rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-300 active:scale-95 sm:min-h-0 sm:px-3 sm:py-1"
                aria-label="Confirm add stock"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setAddingNew(false);
                  setNewTicker("");
                  setNewShares("");
                  setNewPrice("");
                }}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-md p-2 text-stone-400 sm:min-h-0 sm:min-w-0 sm:p-1 transition-colors duration-150 hover:bg-stone-100 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-stone-200"
                aria-label="Cancel adding stock"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-4 sm:w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Total and Add button */}
      <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
        <span className="text-sm font-medium text-stone-500">
          Total: {formatCurrency(total)}
        </span>
        {!addingNew && (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 transition-all duration-150 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200 active:bg-blue-100"
          >
            + Add Stock
          </button>
        )}
      </div>
    </div>
  );
}
