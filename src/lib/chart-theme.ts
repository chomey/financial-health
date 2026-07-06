export const CHART_SERIES = ["#22d3ee", "#a78bfa", "#f472b6", "#fbbf24", "#fb7185", "#94a3b8"] as const;

export const CHART_SEMANTIC = {
  income: "#22d3ee",
  surplus: "#67e8f9",
  expenses: "#fb7185",
  taxes: "#fbbf24",
  investments: "#a78bfa",
  debt: "#fb7185",
  assets: "#22d3ee",
} as const;

export const CHART_GRID = "rgba(255,255,255,0.06)";

export const CHART_AXIS_TICK = {
  fill: "#94a3b8",
  fontSize: 11,
} as const;

export const CHART_TOOLTIP_STYLE = {
  backgroundColor: "#1e293b",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "0.5rem",
  color: "#e2e8f0",
  fontSize: "12px",
} as const;
