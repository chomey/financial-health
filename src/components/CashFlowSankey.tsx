"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  sankey as d3Sankey,
  sankeyLinkHorizontal,
  sankeyJustify,
} from "d3-sankey";
import {
  buildSankeyData,
  SANKEY_COLORS,
  type SankeyNode,
  type SankeyLink,
  type CashFlowInput,
} from "@/lib/sankey-data";
import { useCurrency } from "@/lib/CurrencyContext";

interface D3SankeyNode extends SankeyNode {
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  index?: number;
}

interface D3SankeyLink {
  source: D3SankeyNode;
  target: D3SankeyNode;
  value: number;
  width?: number;
  y0?: number;
  y1?: number;
  index?: number;
}

const CHART_WIDTH = 700;
const CHART_HEIGHT = 400;
const CHART_PADDING = { top: 10, right: 90, bottom: 10, left: 90 };

interface CashFlowSankeyProps {
  income: CashFlowInput["income"];
  expenses: CashFlowInput["expenses"];
  investmentContributions: number;
  mortgagePayments: number;
  monthlyFederalTax: number;
  monthlyProvincialTax: number;
  monthlySurplus: number;
  investmentReturns?: CashFlowInput["investmentReturns"];
}

/** Mobile-friendly table showing cash flow as grouped rows */
function CashFlowTable({
  links,
  nodes,
  fmt,
}: {
  links: SankeyLink[];
  nodes: SankeyNode[];
  fmt: { full: (v: number) => string };
}) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Group links by source type for a clean breakdown
  const sections: { title: string; color: string; rows: { label: string; value: number }[] }[] = [];

  // Income sources
  const incomeRows = nodes
    .filter((n) => n.type === "income" || n.type === "investment-income")
    .map((n) => ({ label: n.label, value: n.value ?? 0 }))
    .filter((r) => r.value > 0);
  if (incomeRows.length > 0) {
    sections.push({ title: "Income", color: SANKEY_COLORS.income, rows: incomeRows });
  }

  // Outflows: group by target type from the pool
  const outflowTypes: { title: string; type: string; color: string }[] = [
    { title: "Taxes", type: "tax", color: SANKEY_COLORS.tax },
    { title: "Expenses", type: "expense", color: SANKEY_COLORS.expense },
    { title: "Investments", type: "investment", color: SANKEY_COLORS.investment },
    { title: "Debt & Mortgage", type: "debt", color: SANKEY_COLORS.debt },
    { title: "Surplus", type: "surplus", color: SANKEY_COLORS.surplus },
  ];

  for (const { title, type, color } of outflowTypes) {
    const rows = nodes
      .filter((n) => n.type === type)
      .map((n) => {
        // Get the actual flow value from links targeting this node
        const flowValue = links
          .filter((l) => l.target === n.id)
          .reduce((sum, l) => sum + l.value, 0);
        return { label: n.label, value: flowValue || n.value || 0 };
      })
      .filter((r) => r.value > 0);
    if (rows.length > 0) {
      sections.push({ title, color, rows });
    }
  }

  return (
    <div className="space-y-3">
      {sections.map((section) => {
        const sectionTotal = section.rows.reduce((sum, r) => sum + r.value, 0);
        return (
          <div key={section.title}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: section.color }} />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{section.title}</span>
              </div>
              <span className="text-xs font-medium text-slate-400">{fmt.full(sectionTotal)}/mo</span>
            </div>
            <div className="space-y-0.5">
              {section.rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded px-2 py-1 bg-white/5">
                  <span className="text-xs text-slate-300">{row.label}</span>
                  <span className="text-xs font-medium text-slate-300">{fmt.full(row.value)}/mo</span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CashFlowSankey({
  income,
  expenses,
  investmentContributions,
  mortgagePayments,
  monthlyFederalTax,
  monthlyProvincialTax,
  monthlySurplus,
  investmentReturns,
}: CashFlowSankeyProps) {
  const fmt = useCurrency();
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<number | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    content: string;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const input: CashFlowInput = useMemo(
    () => ({
      income,
      expenses,
      investmentContributions,
      mortgagePayments,
      monthlyFederalTax,
      monthlyProvincialTax,
      monthlySurplus,
      investmentReturns,
    }),
    [income, expenses, investmentContributions, mortgagePayments, monthlyFederalTax, monthlyProvincialTax, monthlySurplus, investmentReturns]
  );

  const rawData = useMemo(() => buildSankeyData(input), [input]);

  // d3-sankey layout
  const layout = useMemo(() => {
    if (rawData.nodes.length === 0) return null;

    const nodeMap = new Map(rawData.nodes.map((n, i) => [n.id, i]));
    // Preserve original values — d3-sankey mutates node.value to flow totals
    const originalValues = new Map(rawData.nodes.map((n) => [n.id, n.value]));
    const nodes = rawData.nodes.map((n) => ({ ...n }));
    const links = rawData.links
      .filter((l) => nodeMap.has(l.source) && nodeMap.has(l.target) && l.value > 0)
      .map((l) => ({
        source: nodeMap.get(l.source)!,
        target: nodeMap.get(l.target)!,
        value: l.value,
      }));

    if (links.length === 0) return null;

    const generator = d3Sankey<D3SankeyNode, D3SankeyLink>()
      .nodeId((d) => d.index as unknown as string)
      .nodeAlign(sankeyJustify)
      .nodeWidth(16)
      .nodePadding(14)
      .extent([
        [CHART_PADDING.left, CHART_PADDING.top],
        [CHART_WIDTH - CHART_PADDING.right, CHART_HEIGHT - CHART_PADDING.bottom],
      ]);

    const result = generator({ nodes, links } as Parameters<typeof generator>[0]);
    // Restore original values that d3-sankey overwrote with flow totals
    for (const node of result.nodes as D3SankeyNode[]) {
      const orig = originalValues.get(node.id);
      if (orig !== undefined) node.value = orig;
    }
    return {
      nodes: result.nodes as D3SankeyNode[],
      links: result.links as D3SankeyLink[],
    };
  }, [rawData]);

  const linkPath = useMemo(() => sankeyLinkHorizontal(), []);

  const handleLinkEnter = useCallback(
    (e: React.MouseEvent, link: D3SankeyLink, index: number) => {
      setHoveredLink(index);
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 10,
        content: `${(link.source as D3SankeyNode).label} → ${(link.target as D3SankeyNode).label}: ${fmt.full(link.value)}/mo`,
      });
    },
    [fmt]
  );

  const handleNodeEnter = useCallback(
    (e: React.MouseEvent, node: D3SankeyNode) => {
      setHoveredNode(node.id);
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 10,
        content: `${node.label}: ${fmt.full(node.value ?? 0)}/mo`,
      });
    },
    [fmt]
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredLink(null);
    setHoveredNode(null);
    setTooltip(null);
  }, []);

  const hasData = rawData.nodes.length > 0;

  return (
    <div
      className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-sm"
      data-testid="cash-flow-sankey"
    >
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors duration-150 hover:bg-white/5 rounded-xl"
        aria-expanded={!collapsed}
        data-testid="cash-flow-toggle"
      >
        <div className="flex items-center gap-2">
          <span aria-hidden="true">🌊</span>
          <h3 className="text-sm font-semibold text-slate-200">Cash Flow</h3>
        </div>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
            collapsed ? "" : "rotate-180"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div className="px-4 pb-4">
          {!hasData ? (
            <p className="text-sm text-slate-400 text-center py-6">
              Add income to see your cash flow
            </p>
          ) : layout ? (
            <>
            {/* Mobile: table view */}
            <div className="sm:hidden" data-testid="sankey-table">
              <CashFlowTable links={rawData.links} nodes={rawData.nodes} fmt={fmt} />
            </div>
            {/* Desktop: SVG Sankey */}
            <div className="relative hidden sm:block" data-testid="sankey-chart">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                className="w-full h-auto"
                role="img"
                aria-label="Cash flow Sankey diagram showing how income flows to expenses, investments, and savings"
                onMouseLeave={handleMouseLeave}
              >
                {/* Links */}
                {layout.links.map((link, i) => {
                  const sourceNode = link.source as D3SankeyNode;
                  const targetNode = link.target as D3SankeyNode;
                  const sourceColor = SANKEY_COLORS[sourceNode.type] ?? "#94a3b8";
                  const targetColor = SANKEY_COLORS[targetNode.type] ?? "#94a3b8";
                  const isHighlighted =
                    hoveredLink === i ||
                    hoveredNode === sourceNode.id ||
                    hoveredNode === targetNode.id;
                  const isOther = hoveredLink !== null || hoveredNode !== null;
                  const opacity = isHighlighted ? 0.6 : isOther ? 0.1 : 0.3;

                  return (
                    <g key={`link-${i}`}>
                      <defs>
                        <linearGradient
                          id={`grad-${i}`}
                          gradientUnits="userSpaceOnUse"
                          x1={sourceNode.x1}
                          x2={targetNode.x0}
                        >
                          <stop offset="0%" stopColor={sourceColor} />
                          <stop offset="100%" stopColor={targetColor} />
                        </linearGradient>
                      </defs>
                      <path
                        d={linkPath(link as Parameters<typeof linkPath>[0]) ?? ""}
                        fill="none"
                        stroke={`url(#grad-${i})`}
                        strokeWidth={Math.max(1, link.width ?? 1)}
                        strokeOpacity={opacity}
                        className="transition-all duration-200 cursor-pointer"
                        onMouseEnter={(e) => handleLinkEnter(e, link, i)}
                        onMouseMove={(e) => handleLinkEnter(e, link, i)}
                        onMouseLeave={handleMouseLeave}
                      />
                    </g>
                  );
                })}

                {/* Nodes */}
                {layout.nodes.map((node) => {
                  const color = SANKEY_COLORS[node.type] ?? "#94a3b8";
                  const nodeHeight = (node.y1 ?? 0) - (node.y0 ?? 0);
                  const isLeft =
                    node.type === "income" || node.type === "investment-income";
                  const isRight = !isLeft && node.type !== "pool" && node.type !== "tax";
                  const labelX = isLeft
                    ? (node.x0 ?? 0) - 6
                    : isRight
                    ? (node.x1 ?? 0) + 6
                    : (node.x0 ?? 0) + 8;
                  const labelAnchor = isLeft
                    ? "end"
                    : isRight
                    ? "start"
                    : "start";

                  return (
                    <g
                      key={node.id}
                      className="cursor-pointer"
                      onMouseEnter={(e) => handleNodeEnter(e, node)}
                      onMouseLeave={handleMouseLeave}
                    >
                      <rect
                        x={node.x0}
                        y={node.y0}
                        width={(node.x1 ?? 0) - (node.x0 ?? 0)}
                        height={Math.max(1, nodeHeight)}
                        fill={color}
                        rx={2}
                        className="transition-opacity duration-200"
                        opacity={
                          hoveredNode === node.id
                            ? 1
                            : hoveredNode !== null || hoveredLink !== null
                            ? 0.5
                            : 0.85
                        }
                        data-testid={`sankey-node-${node.id}`}
                      />
                      {/* Label */}
                      <text
                        x={labelX}
                        y={(node.y0 ?? 0) + nodeHeight / 2}
                        dy="0.35em"
                        textAnchor={labelAnchor}
                        className="text-[10px] fill-slate-300 pointer-events-none select-none"
                        data-testid={`sankey-label-${node.id}`}
                      >
                        {node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Tooltip */}
              {tooltip && (
                <div
                  className="absolute pointer-events-none z-10 rounded-md bg-slate-900 border border-white/10 px-2 py-1 text-xs text-slate-200 shadow-lg whitespace-nowrap"
                  style={{
                    left: tooltip.x,
                    top: tooltip.y,
                    transform: "translate(-50%, -100%)",
                  }}
                  data-testid="sankey-tooltip"
                >
                  {tooltip.content}
                </div>
              )}

              {/* Legend */}
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-slate-400" data-testid="sankey-legend">
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: SANKEY_COLORS.income }}
                  />
                  Income
                </span>
                {rawData.nodes.some((n) => n.type === "investment-income") && (
                  <span className="flex items-center gap-1" data-testid="sankey-legend-investment-income">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: SANKEY_COLORS["investment-income"] }}
                    />
                    Interest Income
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: SANKEY_COLORS.tax }}
                  />
                  Taxes
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: SANKEY_COLORS.expense }}
                  />
                  Expenses
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: SANKEY_COLORS.investment }}
                  />
                  Investments
                </span>
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: SANKEY_COLORS.surplus }}
                  />
                  Surplus
                </span>
              </div>
            </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
