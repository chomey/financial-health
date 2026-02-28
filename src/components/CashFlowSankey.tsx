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
  type CashFlowInput,
} from "@/lib/sankey-data";

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

function formatCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (Math.abs(amount) >= 1_000) return `$${(amount / 1_000).toFixed(1)}k`;
  return `$${Math.round(amount)}`;
}

const CHART_WIDTH = 700;
const CHART_HEIGHT = 400;
const CHART_PADDING = { top: 10, right: 120, bottom: 10, left: 120 };

interface CashFlowSankeyProps {
  income: CashFlowInput["income"];
  expenses: CashFlowInput["expenses"];
  investmentContributions: number;
  mortgagePayments: number;
  monthlyFederalTax: number;
  monthlyProvincialTax: number;
  monthlySurplus: number;
}

export default function CashFlowSankey({
  income,
  expenses,
  investmentContributions,
  mortgagePayments,
  monthlyFederalTax,
  monthlyProvincialTax,
  monthlySurplus,
}: CashFlowSankeyProps) {
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
    }),
    [income, expenses, investmentContributions, mortgagePayments, monthlyFederalTax, monthlyProvincialTax, monthlySurplus]
  );

  const rawData = useMemo(() => buildSankeyData(input), [input]);

  // d3-sankey layout
  const layout = useMemo(() => {
    if (rawData.nodes.length === 0) return null;

    const nodeMap = new Map(rawData.nodes.map((n, i) => [n.id, i]));
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
        content: `${(link.source as D3SankeyNode).label} → ${(link.target as D3SankeyNode).label}: ${formatCurrency(link.value)}/mo`,
      });
    },
    []
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
        content: `${node.label}: ${formatCurrency(node.value ?? 0)}/mo`,
      });
    },
    []
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredLink(null);
    setHoveredNode(null);
    setTooltip(null);
  }, []);

  const hasData = rawData.nodes.length > 0;

  return (
    <div
      className="rounded-xl border border-stone-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
      data-testid="cash-flow-sankey"
    >
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors duration-150 hover:bg-stone-50 rounded-xl"
        aria-expanded={!collapsed}
        data-testid="cash-flow-toggle"
      >
        <div className="flex items-center gap-2">
          <span aria-hidden="true">🌊</span>
          <h3 className="text-sm font-semibold text-stone-800">Cash Flow</h3>
        </div>
        <svg
          className={`h-4 w-4 text-stone-400 transition-transform duration-200 ${
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
            <p className="text-sm text-stone-400 text-center py-6">
              Add income to see your cash flow
            </p>
          ) : layout ? (
            <div className="relative" data-testid="sankey-chart">
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
                    node.type === "income";
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
                        className="text-[10px] fill-stone-600 pointer-events-none select-none"
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
                  className="absolute pointer-events-none z-10 rounded-md bg-stone-800 px-2 py-1 text-xs text-white shadow-lg whitespace-nowrap"
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
              <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-stone-500" data-testid="sankey-legend">
                <span className="flex items-center gap-1">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: SANKEY_COLORS.income }}
                  />
                  Income
                </span>
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
          ) : null}
        </div>
      )}
    </div>
  );
}
