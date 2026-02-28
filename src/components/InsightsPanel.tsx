"use client";

import { useState, useEffect } from "react";
import { generateInsights, type FinancialData, type Insight } from "@/lib/insights";

// Mock financial data matching the existing entry component mock values
const MOCK_FINANCIAL_DATA: FinancialData = {
  totalAssets: 65500,
  totalDebts: 295000,
  monthlyIncome: 6300,
  monthlyExpenses: 2950,
};

export { MOCK_FINANCIAL_DATA };

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100 + index * 150);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-stone-100 bg-gradient-to-r from-white to-stone-50 px-4 py-3 shadow-sm transition-all duration-500 hover:shadow-md hover:-translate-y-0.5 min-w-[260px] max-w-[320px] flex-shrink-0 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      role="article"
      aria-label={insight.message}
    >
      <span className="mt-0.5 text-lg flex-shrink-0" aria-hidden="true">
        {insight.icon}
      </span>
      <p className="text-xs leading-relaxed text-stone-700">{insight.message}</p>
    </div>
  );
}

export default function InsightsPanel({
  data = MOCK_FINANCIAL_DATA,
}: {
  data?: FinancialData;
}) {
  const insights = generateInsights(data);

  if (insights.length === 0) {
    return null;
  }

  return (
    <div data-testid="insights-panel">
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {insights.map((insight, i) => (
          <InsightCard key={insight.id} insight={insight} index={i} />
        ))}
      </div>
    </div>
  );
}
