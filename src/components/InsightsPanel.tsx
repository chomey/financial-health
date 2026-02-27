"use client";

import { useState, useEffect } from "react";
import { generateInsights, type FinancialData, type Insight } from "@/lib/insights";

// Mock financial data matching the existing entry component mock values
// Assets: $12,000 + $35,000 + $18,500 = $65,500
// Debts: $280,000 + $15,000 = $295,000
// Income: $5,500 + $800 = $6,300
// Expenses: $2,200 + $600 + $150 = $2,950
// Goals: Rainy Day Fund $14,500/$20,000, New Car $13,500/$42,000, Vacation $6,200/$6,500
const MOCK_FINANCIAL_DATA: FinancialData = {
  totalAssets: 65500,
  totalDebts: 295000,
  monthlyIncome: 6300,
  monthlyExpenses: 2950,
  goals: [
    { name: "Rainy Day Fund", target: 20000, current: 14500 },
    { name: "New Car", target: 42000, current: 13500 },
    { name: "Vacation", target: 6500, current: 6200 },
  ],
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
      className={`flex items-start gap-3 rounded-lg border border-stone-100 bg-gradient-to-r from-white to-stone-50 p-4 shadow-sm transition-all duration-500 hover:shadow-md hover:-translate-y-0.5 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      }`}
      role="article"
      aria-label={insight.message}
    >
      <span className="mt-0.5 text-xl flex-shrink-0" aria-hidden="true">
        {insight.icon}
      </span>
      <p className="text-sm leading-relaxed text-stone-700">{insight.message}</p>
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
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-stone-400">
        Insights
      </h3>
      <div className="space-y-3">
        {insights.map((insight, i) => (
          <InsightCard key={insight.id} insight={insight} index={i} />
        ))}
      </div>
    </div>
  );
}
