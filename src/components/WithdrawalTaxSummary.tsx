"use client";

interface AccountsByTreatment {
  taxFree: { categories: string[]; total: number };
  taxDeferred: { categories: string[]; total: number };
  taxable: { categories: string[]; total: number };
}

interface WithdrawalTaxSummaryProps {
  taxDragMonths: number;
  withdrawalOrder: string[];
  accountsByTreatment: AccountsByTreatment;
  homeCurrency?: string;
}

function formatValue(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function WithdrawalTaxSummary({
  taxDragMonths,
  withdrawalOrder,
  accountsByTreatment,
  homeCurrency = "USD",
}: WithdrawalTaxSummaryProps) {
  const totalLiquid =
    accountsByTreatment.taxFree.total +
    accountsByTreatment.taxDeferred.total +
    accountsByTreatment.taxable.total;

  if (totalLiquid <= 0) return null;

  const treatments = [
    {
      label: "Tax-free",
      sublabel: "No tax on withdrawal",
      color: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
      barColor: "bg-emerald-400",
      data: accountsByTreatment.taxFree,
    },
    {
      label: "Taxable",
      sublabel: "Gains taxed at capital gains rate",
      color: "bg-amber-400/10 text-amber-300 border-amber-400/20",
      barColor: "bg-amber-400",
      data: accountsByTreatment.taxable,
    },
    {
      label: "Tax-deferred",
      sublabel: "Full withdrawal taxed as income",
      color: "bg-rose-400/10 text-rose-300 border-rose-400/20",
      barColor: "bg-rose-400",
      data: accountsByTreatment.taxDeferred,
    },
  ];

  return (
    <div
      className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:border-white/20 hover:-translate-y-0.5"
      data-testid="withdrawal-tax-summary"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-400">
          Withdrawal Tax Impact
        </h3>
        <span className="text-lg" aria-hidden="true">
          🏦
        </span>
      </div>

      {/* Tax drag summary */}
      {taxDragMonths > 0.5 && (
        <p className="mt-2 text-sm text-amber-400" data-testid="tax-drag-summary">
          Withdrawal taxes reduce your runway by ~{taxDragMonths.toFixed(1)} months
        </p>
      )}
      {taxDragMonths <= 0.5 && (
        <p className="mt-2 text-sm text-emerald-400" data-testid="tax-drag-summary">
          Minimal withdrawal tax impact on your runway
        </p>
      )}

      {/* Tax treatment breakdown bar */}
      <div className="mt-3">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
          {treatments.map((t) => {
            const pct = totalLiquid > 0 ? (t.data.total / totalLiquid) * 100 : 0;
            if (pct <= 0) return null;
            return (
              <div
                key={t.label}
                className={`${t.barColor} transition-all duration-500`}
                style={{ width: `${pct}%` }}
                title={`${t.label}: ${formatValue(t.data.total, homeCurrency)} (${Math.round(pct)}%)`}
              />
            );
          })}
        </div>
      </div>

      {/* Account breakdown and withdrawal order details */}
      <div className="mt-3 space-y-3" data-testid="withdrawal-tax-details">
          {/* Account breakdown by treatment */}
          <div className="space-y-2">
            {treatments.map((t) => {
              if (t.data.total <= 0) return null;
              const pct = Math.round((t.data.total / totalLiquid) * 100);
              return (
                <div
                  key={t.label}
                  className={`rounded-lg border px-3 py-2 ${t.color}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold">{t.label}</span>
                    <span className="text-xs font-medium">
                      {formatValue(t.data.total, homeCurrency)} ({pct}%)
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs opacity-75">{t.sublabel}</p>
                  <p className="mt-0.5 text-xs opacity-60">
                    {t.data.categories.join(", ")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Suggested withdrawal order */}
          {withdrawalOrder.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-400 mb-1">
                Suggested withdrawal order:
              </p>
              <div className="flex flex-wrap gap-1.5 text-xs text-slate-400">
                {withdrawalOrder.map((cat, i) => (
                  <span key={cat} className="flex items-center gap-1">
                    {i > 0 && (
                      <svg className="h-3 w-3 shrink-0 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                    <span className="max-w-[150px] truncate rounded bg-white/5 px-1.5 py-0.5 font-medium">
                      {cat}
                    </span>
                  </span>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-slate-500 italic" data-testid="withdrawal-order-disclaimer">
                We don&apos;t have full visibility into each account&apos;s tax implications — this is a rough suggestion. Consult a tax professional for personalized advice.
              </p>
            </div>
          )}
        </div>

      <p className="mt-2 text-xs text-slate-500 leading-relaxed">
        How withdrawal taxes affect your savings. Tax-free accounts are withdrawn first to minimize tax impact.
      </p>
    </div>
  );
}
