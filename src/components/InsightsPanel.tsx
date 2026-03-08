"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { generateInsights, type FinancialData, type Insight, type InsightType } from "@/lib/insights";
import { useOptionalDataFlow, type ActiveConnection, prioritizeConnections } from "@/components/DataFlowArrows";
import type { DataFlowConnectionDef } from "@/components/SnapshotDashboard";

// Mock financial data matching the existing entry component mock values
const MOCK_FINANCIAL_DATA: FinancialData = {
  totalAssets: 65500,
  totalDebts: 295000,
  monthlyIncome: 6300,
  monthlyExpenses: 2950,
};

export { MOCK_FINANCIAL_DATA };

/** Map insight types to the source sections they reference */
const INSIGHT_TYPE_SOURCES: Record<InsightType, string[]> = {
  "runway": ["section-assets", "section-expenses"],
  "surplus": ["section-income", "section-expenses"],
  "net-worth": ["section-assets", "section-debts"],
  "savings-rate": ["section-income", "section-expenses"],
  "debt-interest": ["section-debts"],
  "tax": ["section-income"],
  "withdrawal-tax": ["section-assets"],
  "employer-match": ["section-assets", "section-income"],
  "debt-strategy": ["section-debts"],
  "fire": ["section-expenses", "section-assets"],
  "tax-optimization": ["section-assets", "section-income"],
  "income-replacement": ["section-assets", "section-income"],
  "debt-to-income": ["section-debts", "section-income"],
  "housing-cost": ["section-expenses", "section-income"],
  "coast-fire": ["section-assets", "section-expenses"],
  "net-worth-milestone": ["section-assets", "section-debts"],
  "net-worth-percentile": ["section-assets", "section-debts"],
  "tax-credits-summary": ["section-income"],
  "tax-credits-unclaimed": ["section-income"],
  "tax-credits-refundable": ["section-income"],
  "tax-credits-ineligible": ["section-income"],
};

function InsightRow({
  insight,
  index,
  connections,
}: {
  insight: Insight;
  index: number;
  connections?: DataFlowConnectionDef[];
}) {
  const [visible, setVisible] = useState(false);
  const rowRef = useRef<HTMLLIElement>(null);
  const ctx = useOptionalDataFlow();
  const targetId = `insight-${insight.id}`;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50 + index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  // Register as a data-flow target
  useEffect(() => {
    if (!ctx) return;
    ctx.registerTarget(targetId, rowRef);
    return () => ctx.unregisterTarget(targetId);
  }, [ctx, targetId]);

  const handleClick = useCallback(() => {
    if (!ctx || !connections || connections.length === 0) return;
    const filtered = connections.filter((c) => c.value === undefined || c.value > 0);
    const activeConns = prioritizeConnections(
      filtered.map((c) => ({
        sourceId: c.sourceId,
        targetId,
        label: c.label,
        value: c.value,
        sign: c.sign,
        style: "light" as const,
      }))
    );
    ctx.setActiveConnections(activeConns);
    ctx.setActiveTarget(targetId);
    ctx.setActiveTargetMeta({
      label: insight.type,
      formattedValue: insight.message,
    });
  }, [ctx, connections, targetId, insight.type, insight.message]);

  const isClickable = connections && connections.length > 0;

  return (
    <li
      ref={rowRef}
      className={`flex items-start gap-2 transition-all duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      } ${isClickable ? "cursor-pointer hover:bg-white/5 -mx-2 px-2 rounded" : ""}`}
      data-testid={`insight-card-${insight.id}`}
      data-insight-type={insight.type}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
      tabIndex={isClickable ? 0 : undefined}
      role="article"
      aria-label={insight.message}
    >
      <span className="mt-0.5 text-sm flex-shrink-0" aria-hidden="true">
        {insight.icon}
      </span>
      <p className="text-xs leading-relaxed text-slate-300">{insight.message}</p>
    </li>
  );
}

export default function InsightsPanel({
  data = MOCK_FINANCIAL_DATA,
  insightConnections,
}: {
  data?: FinancialData;
  insightConnections?: Record<string, DataFlowConnectionDef[]>;
}) {
  const insights = generateInsights(data);
  const [expanded, setExpanded] = useState(false);

  if (insights.length === 0) {
    return null;
  }

  const COLLAPSED_COUNT = 5;
  const showToggle = insights.length > COLLAPSED_COUNT;
  const visibleInsights = expanded ? insights : insights.slice(0, COLLAPSED_COUNT);

  return (
    <div
      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-3 sm:p-4"
      data-testid="insights-panel"
    >
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {insights.length} Insights
      </h3>
      <ul className="space-y-2">
        {visibleInsights.map((insight, i) => (
          <InsightRow
            key={insight.id}
            insight={insight}
            index={i}
            connections={insightConnections?.[insight.type]}
          />
        ))}
      </ul>
      {showToggle && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 rounded px-1"
          data-testid="insights-toggle"
        >
          {expanded ? "Show less" : `Show ${insights.length - COLLAPSED_COUNT} more`}
        </button>
      )}
    </div>
  );
}
