"use client";

import StockEntry from "@/components/StockEntry";
import type { StockHolding } from "@/components/StockEntry";

export default function StocksStep({
  items,
  onChange,
}: {
  items: StockHolding[];
  onChange: (items: StockHolding[]) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-white">Stocks &amp; Equity</h2>
        <p className="mt-1 text-sm text-slate-400">
          Individual stock holdings. Prices can be fetched automatically by ticker.
        </p>
      </div>
      <StockEntry items={items} onChange={onChange} />
      {items.length === 0 && (
        <p className="text-center text-sm text-slate-600 py-4">No individual stocks? That&apos;s fine — index funds in your assets still count.</p>
      )}
    </div>
  );
}
