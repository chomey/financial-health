"use client";

import { useCurrency } from "@/lib/CurrencyContext";
import type { CustomTooltipProps } from "./ProjectionUtils";

export function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  const fmt = useCurrency();
  if (!active || !payload?.length) return null;

  const years = label ?? 0;
  const yearLabel = years === 1 ? "1 year" : `${years} years`;

  // Extract withdrawal tax drag from the data point (available via the first payload entry)
  const dataPoint = payload[0]?.payload;
  const withdrawalTaxDrag = typeof dataPoint?.withdrawalTaxDrag === "number" ? dataPoint.withdrawalTaxDrag : 0;

  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/90 p-3 shadow-lg backdrop-blur-sm">
      <p className="mb-1 text-xs font-medium text-slate-400">{yearLabel} from now</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {fmt.full(entry.value)}
        </p>
      ))}
      {withdrawalTaxDrag > 0 && (
        <p className="mt-1 text-xs text-amber-400" data-testid="tooltip-tax-drag">
          Withdrawal tax paid: {fmt.full(withdrawalTaxDrag)}
        </p>
      )}
    </div>
  );
}

export function BurndownTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const yearVal = label ?? 0;
  const yearLabel = yearVal < 1 ? `${Math.round(yearVal * 12)} months` : yearVal === 1 ? "1 year" : `${Number(yearVal.toFixed(1))} years`;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/90 p-3 shadow-lg backdrop-blur-sm">
      <p className="mb-1 text-xs font-medium text-slate-400">{yearLabel}</p>
      {payload.map((entry, i) => {
        const n = String(entry.name ?? "");
        const displayName = n === "withGrowth" ? "With growth" : n === "withoutGrowth" ? "Without growth" : n === "withTax" ? "After taxes" : n;
        return (
          <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
            {displayName}: ${Math.abs(entry.value).toLocaleString("en-US", { maximumFractionDigits: 0 })}
          </p>
        );
      })}
    </div>
  );
}

/** Custom SVG label for vertical ReferenceLine — renders a pill below the top edge to prevent clipping */
export function MilestoneLabelContent({
  viewBox,
  value,
  fill = "#10b981",
  offsetY = 0,
}: {
  viewBox?: { x: number; y: number; width: number; height: number };
  value?: string;
  fill?: string;
  offsetY?: number;
}) {
  if (!viewBox || !value) return null;
  const { x, y } = viewBox;
  const textWidth = value.length * 5.8 + 10;
  const yPos = y + 6 + offsetY;
  return (
    <g>
      <rect
        x={x + 3}
        y={yPos}
        width={textWidth}
        height={15}
        rx={3}
        fill="#0f172a"
        fillOpacity={0.9}
        stroke={fill}
        strokeWidth={0.5}
        strokeOpacity={0.7}
      />
      <text x={x + 7} y={yPos + 11} fontSize={10} fill={fill} fontWeight={600}>
        {value}
      </text>
    </g>
  );
}
