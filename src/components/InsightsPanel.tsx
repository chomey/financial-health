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
};

function InsightCard({
  insight,
  index,
  connections,
}: {
  insight: Insight;
  index: number;
  connections?: DataFlowConnectionDef[];
}) {
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const ctx = useOptionalDataFlow();
  const targetId = `insight-${insight.id}`;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100 + index * 150);
    return () => clearTimeout(timer);
  }, [index]);

  // Register as a data-flow target
  useEffect(() => {
    if (!ctx) return;
    ctx.registerTarget(targetId, cardRef);
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

  return (
    <div
      ref={cardRef}
      className={`flex items-start gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-3 shadow-sm transition-all duration-500 hover:shadow-md hover:border-white/20 hover:-translate-y-0.5 min-w-[260px] max-w-[320px] flex-shrink-0 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      role="article"
      aria-label={insight.message}
      data-testid={`insight-card-${insight.id}`}
      data-insight-type={insight.type}
      onClick={handleClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleClick(); } }}
      style={{ cursor: connections && connections.length > 0 ? "pointer" : undefined }}
      tabIndex={0}
    >
      <span className="mt-0.5 text-lg flex-shrink-0" aria-hidden="true">
        {insight.icon}
      </span>
      <p className="text-xs leading-relaxed text-slate-300">{insight.message}</p>
    </div>
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

  if (insights.length === 0) {
    return null;
  }

  return (
    <div data-testid="insights-panel">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {insights.map((insight, i) => (
          <InsightCard
            key={insight.id}
            insight={insight}
            index={i}
            connections={insightConnections?.[insight.type]}
          />
        ))}
      </div>
    </div>
  );
}
