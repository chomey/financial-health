"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type RefObject,
  type ReactNode,
} from "react";

// --- Types ---

export interface SourceMetadataItem {
  label: string;
  value: number;
}

export interface SourceMetadata {
  label: string;
  value: number;
  color?: string;
  items?: SourceMetadataItem[];
}

export interface ActiveConnection {
  sourceId: string;
  targetId: string;
  label?: string;
  value?: number;
  sign?: "positive" | "negative";
  /** "light" renders thinner, more transparent arrows (used by insight cards) */
  style?: "default" | "light";
}

interface RegisteredElement {
  ref: RefObject<HTMLElement | null>;
  metadata?: SourceMetadata;
}

export interface ActiveTargetMeta {
  label: string;
  formattedValue: string;
}

interface DataFlowContextValue {
  registerSource: (
    id: string,
    ref: RefObject<HTMLElement | null>,
    metadata?: SourceMetadata
  ) => void;
  unregisterSource: (id: string) => void;
  registerTarget: (id: string, ref: RefObject<HTMLElement | null>) => void;
  unregisterTarget: (id: string) => void;
  setActiveTarget: (id: string | null) => void;
  activeTarget: string | null;
  activeConnections: ActiveConnection[];
  setActiveConnections: (connections: ActiveConnection[]) => void;
  activeTargetMeta: ActiveTargetMeta | null;
  setActiveTargetMeta: (meta: ActiveTargetMeta | null) => void;
  getSourceMetadata: (id: string) => SourceMetadata | undefined;
}

// --- Constants ---

/** Maximum simultaneous arrows to render (prioritize by absolute value) */
export const MAX_ARROWS = 8;

// --- Context ---

const DataFlowContext = createContext<DataFlowContextValue | null>(null);

export function useDataFlow(): DataFlowContextValue {
  const ctx = useContext(DataFlowContext);
  if (!ctx) {
    throw new Error("useDataFlow must be used within a DataFlowProvider");
  }
  return ctx;
}

/** Returns the data flow context or null if outside a provider. Safe for optional usage. */
export function useOptionalDataFlow(): DataFlowContextValue | null {
  return useContext(DataFlowContext);
}

/**
 * Prioritize connections by absolute value magnitude, returning at most MAX_ARROWS.
 */
export function prioritizeConnections(
  connections: ActiveConnection[],
  maxArrows: number = MAX_ARROWS
): ActiveConnection[] {
  if (connections.length <= maxArrows) return connections;
  return [...connections]
    .sort((a, b) => Math.abs(b.value ?? 0) - Math.abs(a.value ?? 0))
    .slice(0, maxArrows);
}

// --- Hand-drawn SVG utilities ---

/**
 * Generate a wobbly SVG oval path that looks hand-drawn.
 * Uses sinusoidal jitter to create organic imperfection.
 */
export function handDrawnOval(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  seed: number = 0
): string {
  const points = 24;
  const jitterAmp = Math.min(rx, ry) * 0.08; // 8% of smaller radius
  const coords: [number, number][] = [];

  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * Math.PI * 2;
    // Sinusoidal jitter with seed for deterministic but varied results
    const jx = jitterAmp * Math.sin(angle * 5 + seed * 1.7);
    const jy = jitterAmp * Math.cos(angle * 7 + seed * 2.3);
    coords.push([
      cx + (rx + jx) * Math.cos(angle),
      cy + (ry + jy) * Math.sin(angle),
    ]);
  }

  let d = `M ${coords[0][0].toFixed(1)} ${coords[0][1].toFixed(1)}`;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    // Quadratic bezier with midpoint control for smoothness
    const cpx = (prev[0] + curr[0]) / 2 + jitterAmp * Math.sin(i * 3.1 + seed);
    const cpy = (prev[1] + curr[1]) / 2 + jitterAmp * Math.cos(i * 2.7 + seed);
    d += ` Q ${cpx.toFixed(1)} ${cpy.toFixed(1)} ${curr[0].toFixed(1)} ${curr[1].toFixed(1)}`;
  }
  d += " Z";
  return d;
}

/**
 * Generate a wobbly hand-drawn line path with slight curve.
 */
export function handDrawnLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed: number = 0
): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const jitter = Math.min(len * 0.05, 4); // Max 4px jitter
  // Perpendicular offset for curve
  const nx = -dy / len;
  const ny = dx / len;
  const cp1x = x1 + dx * 0.33 + nx * jitter * Math.sin(seed * 1.3);
  const cp1y = y1 + dy * 0.33 + ny * jitter * Math.cos(seed * 2.1);
  const cp2x = x1 + dx * 0.66 + nx * jitter * Math.sin(seed * 3.7);
  const cp2y = y1 + dy * 0.66 + ny * jitter * Math.cos(seed * 1.9);

  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

// --- DataFlowSourceItem (wrapper for sub-source registration) ---

export function DataFlowSourceItem({
  id,
  label,
  value,
  children,
}: {
  id: string;
  label: string;
  value: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const ctx = useOptionalDataFlow();

  useEffect(() => {
    if (!ctx) return;
    ctx.registerSource(id, ref, { label, value });
    return () => ctx.unregisterSource(id);
  }, [id, label, value, ctx]);

  return <div ref={ref} data-dataflow-source={id}>{children}</div>;
}

// --- Section icon mapping ---

const SECTION_ICONS: Record<string, string> = {
  "section-assets": "💰",
  "section-debts": "💳",
  "section-income": "💵",
  "section-expenses": "🧾",
  "section-property": "🏠",
  "section-stocks": "📊",
};

// --- SourceSummaryCard ---

const MAX_VISIBLE_ITEMS = 5;

export function SourceSummaryCard({
  sourceId,
  sectionName,
  items,
  total,
  isPositive,
  ovalSeed,
}: {
  sourceId: string;
  sectionName: string;
  items?: SourceMetadataItem[];
  total: string;
  isPositive: boolean;
  ovalSeed: number;
}) {
  const icon = SECTION_ICONS[sourceId] || "";
  const visibleItems = items && items.length > MAX_VISIBLE_ITEMS ? items.slice(0, MAX_VISIBLE_ITEMS) : items;
  const hiddenCount = items ? Math.max(0, items.length - MAX_VISIBLE_ITEMS) : 0;

  return (
    <div
      className={`relative rounded-xl border-l-4 bg-white p-4 shadow-sm ${
        isPositive ? "border-l-green-500" : "border-l-rose-500"
      }`}
      data-testid={`source-summary-${sourceId}`}
    >
      {/* Header: icon + title */}
      <div className="mb-2 flex items-center gap-2">
        {icon && <span aria-hidden="true" className="text-base">{icon}</span>}
        <span className="text-sm font-semibold text-stone-700" data-testid={`source-summary-title-${sourceId}`}>{sectionName}</span>
      </div>

      {/* Item list */}
      {visibleItems && visibleItems.length > 0 && (
        <ul className="mb-3 space-y-1" data-testid={`source-summary-items-${sourceId}`}>
          {visibleItems.map((item, i) => (
            <li key={i} className="flex items-center justify-between text-sm">
              <span className="text-stone-500 truncate mr-2">{item.label}</span>
              <span className="font-medium text-stone-700 whitespace-nowrap">${Math.abs(item.value).toLocaleString()}</span>
            </li>
          ))}
          {hiddenCount > 0 && (
            <li className="text-xs text-stone-400 italic" data-testid={`source-summary-more-${sourceId}`}>
              +{hiddenCount} more
            </li>
          )}
        </ul>
      )}

      {/* Total with hand-drawn oval */}
      <div className="flex items-center justify-between border-t border-stone-100 pt-2">
        <span className="text-xs font-medium text-stone-500 uppercase tracking-wide">Total</span>
        <div className="relative">
          <span
            className={`text-lg font-bold ${isPositive ? "text-green-600" : "text-rose-600"}`}
            data-testid={`source-summary-total-${sourceId}`}
          >
            {total}
          </span>
          {/* Hand-drawn oval annotation */}
          <svg
            className="pointer-events-none absolute -inset-2 h-[calc(100%+16px)] w-[calc(100%+16px)]"
            viewBox="0 0 100 40"
            preserveAspectRatio="none"
            aria-hidden="true"
            data-testid={`source-summary-oval-${sourceId}`}
          >
            <path
              d={handDrawnOval(50, 20, 45, 16, ovalSeed)}
              fill="none"
              stroke={isPositive ? "#059669" : "#e11d48"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.6"
              className="animate-draw-oval"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

// --- ExplainerModal ---

function ExplainerModal({
  connections,
  targetMeta,
  onClose,
  getSourceMetadata,
}: {
  connections: ActiveConnection[];
  targetMeta: ActiveTargetMeta;
  onClose: () => void;
  getSourceMetadata: (id: string) => SourceMetadata | undefined;
}) {
  const [closing, setClosing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(onClose, 200);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose]);

  // Trap focus within modal
  useEffect(() => {
    const el = modalRef.current;
    if (el) {
      const focusable = el.querySelector<HTMLElement>("button, [tabindex]");
      focusable?.focus();
    }
  }, []);

  // Group connections by sign for arithmetic display
  const positiveConns = connections.filter((c) => c.sign !== "negative");
  const negativeConns = connections.filter((c) => c.sign === "negative");

  return (
    <div
      data-testid="explainer-backdrop"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 ${closing ? "animate-modal-out" : "animate-modal-in"}`}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      aria-modal="true"
      role="dialog"
      aria-label={`How ${targetMeta.label} is calculated`}
    >
      <div
        ref={modalRef}
        data-testid="explainer-modal"
        className={`relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-8 ${closing ? "animate-modal-content-out" : "animate-modal-content-in"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
          aria-label="Close explainer"
          data-testid="explainer-close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Metric title & value */}
        <div className="mb-6 text-center">
          <h2 className="text-lg font-semibold text-stone-700" data-testid="explainer-title">{targetMeta.label}</h2>
          <p className="mt-1 text-3xl font-bold text-stone-900" data-testid="explainer-value">{targetMeta.formattedValue}</p>
        </div>

        {/* Source summary cards */}
        <div className="space-y-3" data-testid="explainer-sources">
          {connections.map((conn, i) => {
            const meta = getSourceMetadata(conn.sourceId);
            const isPositive = conn.sign !== "negative";
            const showOperator = i > 0;
            const sectionName = meta?.label || conn.label || conn.sourceId.replace("section-", "");
            const displayValue = conn.label || (meta ? `$${Math.abs(meta.value).toLocaleString()}` : "");

            return (
              <div key={conn.sourceId + i} data-testid={`explainer-source-${conn.sourceId}`}>
                {showOperator && (
                  <div className="flex justify-center py-1">
                    <span
                      className={`text-2xl font-bold ${isPositive ? "text-green-600" : "text-rose-600"}`}
                      data-testid={`explainer-operator-${i}`}
                    >
                      {isPositive ? "+" : "\u2212"}
                    </span>
                  </div>
                )}
                <SourceSummaryCard
                  sourceId={conn.sourceId}
                  sectionName={sectionName}
                  items={meta?.items}
                  total={displayValue}
                  isPositive={isPositive}
                  ovalSeed={i + 1}
                />
              </div>
            );
          })}
        </div>

        {/* Sum bar and result */}
        <div className="mt-6" data-testid="explainer-result-section">
          {/* Hand-drawn horizontal line */}
          <svg className="h-3 w-full" viewBox="0 0 400 12" preserveAspectRatio="none" aria-hidden="true">
            <path
              d={handDrawnLine(10, 6, 390, 6, 42)}
              fill="none"
              stroke="#78716c"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.5"
              className="animate-draw-line"
            />
          </svg>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xl font-bold text-stone-500">=</span>
            <span className="text-2xl font-bold text-stone-900" data-testid="explainer-result-value">
              {targetMeta.formattedValue}
            </span>
          </div>
          {/* Summary: positive vs negative */}
          {positiveConns.length > 0 && negativeConns.length > 0 && (
            <p className="mt-2 text-center text-xs text-stone-400" data-testid="explainer-summary">
              {positiveConns.map((c) => c.label || getSourceMetadata(c.sourceId)?.label || c.sourceId).join(" + ")}
              {" \u2212 "}
              {negativeConns.map((c) => c.label || getSourceMetadata(c.sourceId)?.label || c.sourceId).join(" \u2212 ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export { ExplainerModal };

// --- Provider ---

export function DataFlowProvider({ children }: { children: ReactNode }) {
  const sourcesRef = useRef<Map<string, RegisteredElement>>(new Map());
  const targetsRef = useRef<Map<string, RegisteredElement>>(new Map());
  const [activeTarget, setActiveTarget] = useState<string | null>(null);
  const [activeConnections, setActiveConnections] = useState<
    ActiveConnection[]
  >([]);
  const [activeTargetMeta, setActiveTargetMeta] =
    useState<ActiveTargetMeta | null>(null);

  const registerSource = useCallback(
    (
      id: string,
      ref: RefObject<HTMLElement | null>,
      metadata?: SourceMetadata
    ) => {
      sourcesRef.current.set(id, { ref, metadata });
    },
    []
  );

  const unregisterSource = useCallback((id: string) => {
    sourcesRef.current.delete(id);
  }, []);

  const registerTarget = useCallback(
    (id: string, ref: RefObject<HTMLElement | null>) => {
      targetsRef.current.set(id, { ref });
    },
    []
  );

  const unregisterTarget = useCallback((id: string) => {
    targetsRef.current.delete(id);
  }, []);

  const getSourceMetadata = useCallback((id: string) => {
    return sourcesRef.current.get(id)?.metadata;
  }, []);

  const handleClose = useCallback(() => {
    setActiveConnections([]);
    setActiveTarget(null);
    setActiveTargetMeta(null);
  }, []);

  const value: DataFlowContextValue = {
    registerSource,
    unregisterSource,
    registerTarget,
    unregisterTarget,
    setActiveTarget,
    activeTarget,
    activeConnections,
    setActiveConnections,
    activeTargetMeta,
    setActiveTargetMeta,
    getSourceMetadata,
  };

  return (
    <DataFlowContext.Provider value={value}>
      {children}
      {activeTarget && activeTargetMeta && activeConnections.length > 0 && (
        <ExplainerModal
          connections={activeConnections}
          targetMeta={activeTargetMeta}
          onClose={handleClose}
          getSourceMetadata={getSourceMetadata}
        />
      )}
    </DataFlowContext.Provider>
  );
}
