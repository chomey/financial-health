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

export interface SourceMetadata {
  label: string;
  value: number;
  color?: string;
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

// --- SpotlightOverlay ---

function SpotlightOverlay({ active }: { active: boolean }) {
  return (
    <div
      data-testid="spotlight-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0,0,0,0.7)",
        zIndex: 40,
        pointerEvents: "none",
        opacity: active ? 1 : 0,
        transition: "opacity 250ms ease-out",
      }}
      aria-hidden="true"
    />
  );
}

// --- FormulaBar ---

function FormulaBar({
  connections,
  targetMeta,
}: {
  connections: ActiveConnection[];
  targetMeta: ActiveTargetMeta | null;
}) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!targetMeta || connections.length === 0) return null;

  return (
    <div
      data-testid="formula-bar"
      style={{
        position: isMobile ? "fixed" : "relative",
        bottom: isMobile ? 0 : undefined,
        left: isMobile ? 0 : undefined,
        right: isMobile ? 0 : undefined,
        zIndex: 50,
      }}
      className={`flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-md ${
        isMobile ? "rounded-b-none" : "mt-2"
      }`}
      aria-label={`Formula: ${targetMeta.label} = ${targetMeta.formattedValue}`}
    >
      {connections.map((conn, i) => {
        const isPositive = conn.sign !== "negative";
        const showOperator = i > 0;
        return (
          <React.Fragment key={conn.sourceId}>
            {showOperator && (
              <span className="text-xs font-bold text-stone-400">
                {isPositive ? "+" : "\u2212"}
              </span>
            )}
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                isPositive
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
              data-testid={`formula-term-${conn.sourceId}`}
            >
              {conn.label || conn.sourceId.replace("section-", "")}
            </span>
          </React.Fragment>
        );
      })}
      <span className="text-xs font-bold text-stone-400">=</span>
      <span
        className="inline-flex items-center rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-bold text-stone-800 border border-stone-300"
        data-testid="formula-result"
      >
        {targetMeta.formattedValue}
      </span>
    </div>
  );
}

// Export FormulaBar and SpotlightOverlay for testing
export { FormulaBar, SpotlightOverlay };

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
  };

  return (
    <DataFlowContext.Provider value={value}>
      {children}
      <SpotlightOverlay active={activeTarget !== null} />
      <FormulaBar connections={activeConnections} targetMeta={activeTargetMeta} />
    </DataFlowContext.Provider>
  );
}
