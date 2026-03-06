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
}

interface RegisteredElement {
  ref: RefObject<HTMLElement | null>;
  metadata?: SourceMetadata;
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
}

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

// --- Path calculation (exported for testing) ---

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Get the center point of an element's bounding rect.
 */
export function getCenterPoint(rect: Rect): Point {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

/**
 * Get the best edge point on a rect to connect from/to another point.
 * Returns the midpoint of the edge closest to the other point.
 */
export function getEdgePoint(rect: Rect, toward: Point): Point {
  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;

  // Determine which edge to use based on direction
  const dx = toward.x - cx;
  const dy = toward.y - cy;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx > absDy) {
    // Horizontal edge
    return dx > 0
      ? { x: rect.x + rect.width, y: cy }
      : { x: rect.x, y: cy };
  } else {
    // Vertical edge
    return dy > 0
      ? { x: cx, y: rect.y + rect.height }
      : { x: cx, y: rect.y };
  }
}

/**
 * Calculate a cubic bezier SVG path between two points.
 * Creates a natural arcing curve that avoids overlapping page content.
 */
export function calculateArrowPath(from: Point, to: Point): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Control point offset — larger distance = more pronounced arc
  const curvature = Math.min(dist * 0.3, 120);

  // Arc direction: perpendicular to the line between points
  // Choose the direction that arcs away from content (leftward bias for right-to-left)
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;

  // Perpendicular unit vector
  const len = dist || 1;
  const perpX = -dy / len;
  const perpY = dx / len;

  // Single control point for quadratic-like feel, but using cubic for smoother result
  const cp1x = midX + perpX * curvature * 0.5;
  const cp1y = midY + perpY * curvature * 0.5;
  const cp2x = midX + perpX * curvature * 0.3;
  const cp2y = midY + perpY * curvature * 0.3;

  return `M ${from.x} ${from.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${to.x} ${to.y}`;
}

/**
 * Calculate the approximate length of a cubic bezier path (for dash animation).
 */
export function approximatePathLength(from: Point, to: Point): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  // Rough approximation: slightly longer than straight-line distance due to curve
  return Math.sqrt(dx * dx + dy * dy) * 1.2;
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

// --- Provider ---

export function DataFlowProvider({ children }: { children: ReactNode }) {
  const sourcesRef = useRef<Map<string, RegisteredElement>>(new Map());
  const targetsRef = useRef<Map<string, RegisteredElement>>(new Map());
  const [activeTarget, setActiveTarget] = useState<string | null>(null);
  const [activeConnections, setActiveConnections] = useState<
    ActiveConnection[]
  >([]);

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
  };

  return (
    <DataFlowContext.Provider value={value}>
      {children}
      <DataFlowArrowOverlay
        sources={sourcesRef}
        targets={targetsRef}
        activeTarget={activeTarget}
        connections={activeConnections}
      />
    </DataFlowContext.Provider>
  );
}

// --- Arrow Overlay ---

interface ArrowOverlayProps {
  sources: React.RefObject<Map<string, RegisteredElement>>;
  targets: React.RefObject<Map<string, RegisteredElement>>;
  activeTarget: string | null;
  connections: ActiveConnection[];
}

interface ArrowData {
  path: string;
  length: number;
  color: string;
  label?: string;
  labelPos: Point;
  delay: number;
}

function DataFlowArrowOverlay({
  sources,
  targets,
  activeTarget,
  connections,
}: ArrowOverlayProps) {
  const [arrows, setArrows] = useState<ArrowData[]>([]);
  const [visible, setVisible] = useState(false);
  const recalcRef = useRef<number>(0);

  const calculateArrows = useCallback(() => {
    if (!activeTarget || connections.length === 0) {
      setArrows([]);
      setVisible(false);
      return;
    }

    const targetEntry = targets.current.get(activeTarget);
    if (!targetEntry?.ref.current) {
      setArrows([]);
      return;
    }

    const targetRect = targetEntry.ref.current.getBoundingClientRect();
    const targetCenter = getCenterPoint(targetRect);

    const newArrows: ArrowData[] = [];

    connections.forEach((conn, index) => {
      const sourceEntry = sources.current.get(conn.sourceId);
      if (!sourceEntry?.ref.current) return;

      const sourceRect = sourceEntry.ref.current.getBoundingClientRect();
      const sourcePoint = getEdgePoint(sourceRect, targetCenter);
      const targetPoint = getEdgePoint(targetRect, getCenterPoint(sourceRect));

      const path = calculateArrowPath(sourcePoint, targetPoint);
      const length = approximatePathLength(sourcePoint, targetPoint);
      const isPositive = conn.sign !== "negative";
      const color = isPositive
        ? "rgba(16, 185, 129, 0.7)"
        : "rgba(244, 63, 94, 0.7)";

      const labelPos: Point = {
        x: (sourcePoint.x + targetPoint.x) / 2,
        y: (sourcePoint.y + targetPoint.y) / 2 - 12,
      };

      newArrows.push({
        path,
        length,
        color,
        label: conn.label,
        labelPos,
        delay: index * 50,
      });
    });

    setArrows(newArrows);
    setVisible(true);
  }, [activeTarget, connections, sources, targets]);

  // Recalculate on scroll/resize
  useEffect(() => {
    if (!activeTarget) {
      setArrows([]);
      setVisible(false);
      return;
    }

    calculateArrows();

    const handleUpdate = () => {
      cancelAnimationFrame(recalcRef.current);
      recalcRef.current = requestAnimationFrame(calculateArrows);
    };

    window.addEventListener("scroll", handleUpdate, { passive: true });
    window.addEventListener("resize", handleUpdate, { passive: true });

    // ResizeObserver for element size changes
    const resizeObserver = new ResizeObserver(handleUpdate);
    const targetEntry = targets.current.get(activeTarget);
    if (targetEntry?.ref.current) {
      resizeObserver.observe(targetEntry.ref.current);
    }
    connections.forEach((conn) => {
      const sourceEntry = sources.current.get(conn.sourceId);
      if (sourceEntry?.ref.current) {
        resizeObserver.observe(sourceEntry.ref.current);
      }
    });

    return () => {
      window.removeEventListener("scroll", handleUpdate);
      window.removeEventListener("resize", handleUpdate);
      resizeObserver.disconnect();
      cancelAnimationFrame(recalcRef.current);
    };
  }, [activeTarget, connections, calculateArrows, sources, targets]);

  if (!visible || arrows.length === 0) return null;

  return (
    <svg
      data-testid="data-flow-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 50,
      }}
      aria-hidden="true"
    >
      <defs>
        <filter id="arrow-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <marker
          id="arrowhead-positive"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <polygon
            points="0 0, 8 3, 0 6"
            fill="rgba(16, 185, 129, 0.8)"
          />
        </marker>
        <marker
          id="arrowhead-negative"
          markerWidth="8"
          markerHeight="6"
          refX="7"
          refY="3"
          orient="auto"
        >
          <polygon
            points="0 0, 8 3, 0 6"
            fill="rgba(244, 63, 94, 0.8)"
          />
        </marker>
      </defs>

      {arrows.map((arrow, i) => {
        const isPositive = arrow.color.includes("129");
        return (
          <g key={i}>
            {/* Background glow path */}
            <path
              d={arrow.path}
              fill="none"
              stroke={arrow.color}
              strokeWidth={4}
              opacity={0.3}
              filter="url(#arrow-glow)"
              style={{
                animation: `arrow-fade-in 0.3s ease-out ${arrow.delay}ms both`,
              }}
            />
            {/* Main animated path */}
            <path
              d={arrow.path}
              fill="none"
              stroke={arrow.color}
              strokeWidth={2.5}
              strokeLinecap="round"
              markerEnd={`url(#arrowhead-${isPositive ? "positive" : "negative"})`}
              style={{
                strokeDasharray: `${arrow.length}`,
                strokeDashoffset: `${arrow.length}`,
                animation: `arrow-draw 1.2s ease-out ${arrow.delay}ms forwards`,
              }}
            />
            {/* Label */}
            {arrow.label && (
              <g
                style={{
                  animation: `arrow-fade-in 0.3s ease-out ${arrow.delay + 300}ms both`,
                }}
              >
                <rect
                  x={arrow.labelPos.x - 40}
                  y={arrow.labelPos.y - 10}
                  width={80}
                  height={20}
                  rx={4}
                  fill="white"
                  fillOpacity={0.9}
                  stroke={arrow.color}
                  strokeWidth={1}
                />
                <text
                  x={arrow.labelPos.x}
                  y={arrow.labelPos.y + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill={isPositive ? "#059669" : "#e11d48"}
                  fontFamily="system-ui, sans-serif"
                >
                  {arrow.label}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}
