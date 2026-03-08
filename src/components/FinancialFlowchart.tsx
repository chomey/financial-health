"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  getFlowchartSteps,
  getCurrentStepIndex,
  applyUserOverrides,
  type FlowchartStep,
  type StepStatus,
} from "@/lib/flowchart-steps";
import {
  getFlowchartAcksFromURL,
  getFlowchartSkipsFromURL,
  updateFlowchartOverridesURL,
} from "@/lib/url-state";
import type { FinancialState } from "@/lib/financial-types";

// ── Exported pure helpers (used in unit tests) ─────────────────────────────────

export function computeFlowchartSummary(steps: FlowchartStep[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const completed = steps.filter((s) => s.status === "complete").length;
  const total = steps.length;
  return {
    completed,
    total,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

export function getStepTitleColor(status: StepStatus): string {
  if (status === "complete") return "text-emerald-400";
  if (status === "in-progress") return "text-amber-300";
  return "text-slate-400";
}

export function getConnectorColor(status: StepStatus): string {
  return status === "complete" ? "bg-emerald-500/40" : "bg-white/10";
}

// ── Step circle ──────────────────────────────────────────────────────────────

function StepCircle({ step, size = "sm" }: { step: FlowchartStep; size?: "sm" | "lg" }) {
  const dim = size === "lg" ? "h-10 w-10" : "h-7 w-7";
  const textSize = size === "lg" ? "text-sm" : "text-xs";
  const iconSize = size === "lg" ? "h-5 w-5" : "h-3.5 w-3.5";

  if (step.status === "complete") {
    return (
      <div className={`flex ${dim} flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30`}>
        <svg className={`${iconSize} text-white`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }
  if (step.status === "in-progress") {
    return (
      <div className={`relative flex ${dim} flex-shrink-0 items-center justify-center rounded-full bg-amber-500 shadow-sm shadow-amber-500/30`} aria-label="In progress">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-30" />
        <span className={`relative ${textSize} font-bold text-white`}>{step.stepNumber}</span>
      </div>
    );
  }
  return (
    <div className={`flex ${dim} flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5`}>
      <span className={`${textSize} font-medium text-slate-500`}>{step.stepNumber}</span>
    </div>
  );
}

// ── Detail modal (portal) ────────────────────────────────────────────────────

function StepDetailModal({
  step,
  isAcknowledged,
  isSkipped,
  onAcknowledge,
  onSkip,
  onUndo,
  onClose,
}: {
  step: FlowchartStep;
  isAcknowledged: boolean;
  isSkipped: boolean;
  onAcknowledge: (checked: boolean) => void;
  onSkip: (checked: boolean) => void;
  onUndo: () => void;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isOverridden = isAcknowledged || isSkipped;

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsVisible(true));
    });
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-150 ease-out ${isVisible ? "bg-black/50 backdrop-blur-sm" : "bg-transparent"}`}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className={`relative w-full max-w-md overflow-auto rounded-2xl bg-slate-900 border border-white/10 p-5 shadow-2xl transition-all duration-150 ease-out ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-1.5 text-slate-400 transition-colors duration-150 hover:bg-white/20 hover:text-slate-200"
          aria-label="Close detail view"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="flex items-start gap-3 mb-3">
          <StepCircle step={step} size="lg" />
          <div className="min-w-0 flex-1">
            <p className={`text-base font-semibold leading-tight ${getStepTitleColor(step.status)}`}>
              {step.title}
              {isSkipped && (
                <span className="ml-1.5 rounded-full bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-normal text-slate-500">N/A</span>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-500">{step.completionHint}</p>
          </div>
        </div>

        {step.status !== "complete" && step.progress > 0 && step.progress < 100 && (
          <div className="mb-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${step.progress}%` }} />
            </div>
            <span className="text-xs font-medium text-amber-400 tabular-nums">{step.progress}%</span>
          </div>
        )}

        <div className="text-sm leading-relaxed text-slate-400" data-testid={`step-detail-${step.id}`}>
          <p>{step.detailText}</p>
        </div>

        {(step.userAcknowledgeable || step.skippable) && (
          <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
            {step.userAcknowledgeable && step.acknowledgeLabel && (
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={isAcknowledged}
                  onChange={(e) => onAcknowledge(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 rounded accent-emerald-500"
                  data-testid={`ack-checkbox-${step.id}`}
                />
                <span className="text-sm text-slate-300">{step.acknowledgeLabel}</span>
              </label>
            )}
            {step.skippable && step.skipLabel && (
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={isSkipped}
                  onChange={(e) => onSkip(e.target.checked)}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 rounded accent-slate-500"
                  data-testid={`skip-checkbox-${step.id}`}
                />
                <span className="text-sm text-slate-500">{step.skipLabel}</span>
              </label>
            )}
            {isOverridden && (
              <button
                type="button"
                onClick={onUndo}
                className="text-xs text-slate-500 underline underline-offset-2 hover:text-slate-300 transition-colors"
                data-testid={`undo-button-${step.id}`}
              >
                Undo
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

// ── Zig-zag step card (compact, no inline expand) ───────────────────────────

function ZigZagStep({
  step,
  isSkipped,
  onClick,
}: {
  step: FlowchartStep;
  isSkipped: boolean;
  onClick: () => void;
}) {
  const borderColor =
    step.status === "complete"
      ? "border-emerald-500/30"
      : step.status === "in-progress"
        ? "border-amber-400/30"
        : "border-white/10";
  const bgColor =
    step.status === "in-progress"
      ? "bg-amber-500/5"
      : "bg-white/[0.02]";

  return (
    <button
      type="button"
      className={`group flex w-full items-start gap-3 rounded-xl border ${borderColor} ${bgColor} px-3 py-2.5 text-left transition-all duration-200 hover:bg-white/5 focus:outline-none focus:ring-1 focus:ring-violet-400`}
      onClick={onClick}
      data-testid={`flowchart-step-${step.id}`}
    >
      <StepCircle step={step} />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold leading-tight ${getStepTitleColor(step.status)}`}>
          {step.title}
          {isSkipped && (
            <span className="ml-1.5 rounded-full bg-slate-700/60 px-1.5 py-0.5 text-[10px] font-normal text-slate-500">N/A</span>
          )}
        </p>
        <p className="mt-0.5 text-[11px] leading-snug text-slate-500 line-clamp-2">{step.completionHint}</p>
      </div>
    </button>
  );
}

// ── Connector arrows between rows ────────────────────────────────────────────

function HorizontalConnector({ status }: { status: StepStatus }) {
  const color = status === "complete" ? "border-emerald-500/40" : "border-white/10";
  return (
    <div className={`hidden sm:flex items-center self-center`} aria-hidden="true">
      <div className={`w-4 lg:w-6 border-t-2 border-dashed ${color}`} />
    </div>
  );
}

function ZigZagTurn({ direction, status }: { direction: "right" | "left"; status: StepStatus }) {
  const color = status === "complete" ? "border-emerald-500/40" : "border-white/10";
  // "right" turn: connector drops down from right edge, "left" turn: drops down from left edge
  return (
    <div className="hidden sm:flex w-full py-1 sm:py-2" aria-hidden="true">
      {direction === "right" ? (
        <div className="ml-auto mr-6 flex flex-col items-end">
          <div className={`h-4 border-r-2 border-dashed ${color}`} />
          <div className={`w-[calc(100vw-6rem)] max-w-[calc(100%-3rem)] border-b-2 border-dashed ${color} rounded-br-xl`} style={{ width: "80%" }} />
          <div className={`h-4 border-l-2 border-dashed ${color} self-start`} />
        </div>
      ) : (
        <div className="ml-6 mr-auto flex flex-col items-start">
          <div className={`h-4 border-l-2 border-dashed ${color}`} />
          <div className={`border-b-2 border-dashed ${color} rounded-bl-xl`} style={{ width: "80%" }} />
          <div className={`h-4 border-r-2 border-dashed ${color} self-end`} />
        </div>
      )}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function FinancialFlowchart({ state }: { state: FinancialState }) {
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [detailStep, setDetailStep] = useState<FlowchartStep | null>(null);

  useEffect(() => {
    const acks = getFlowchartAcksFromURL();
    const skps = getFlowchartSkipsFromURL();
    setAcknowledged(acks);
    setSkipped(skps);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const baseSteps = useMemo(() => getFlowchartSteps(state), [state]);
  const steps = useMemo(
    () => applyUserOverrides(baseSteps, acknowledged, skipped),
    [baseSteps, acknowledged, skipped],
  );

  const { completed, total, percentage } = computeFlowchartSummary(steps);
  const country = state.country ?? "CA";

  const handleAcknowledge = useCallback(
    (stepId: string, checked: boolean) => {
      const newSkips = skipped.filter((id) => id !== stepId);
      const newAcks = checked
        ? [...acknowledged.filter((id) => id !== stepId), stepId]
        : acknowledged.filter((id) => id !== stepId);
      setAcknowledged(newAcks);
      setSkipped(newSkips);
      updateFlowchartOverridesURL(newAcks, newSkips);
    },
    [acknowledged, skipped],
  );

  const handleSkip = useCallback(
    (stepId: string, checked: boolean) => {
      const newAcks = acknowledged.filter((id) => id !== stepId);
      const newSkips = checked
        ? [...skipped.filter((id) => id !== stepId), stepId]
        : skipped.filter((id) => id !== stepId);
      setAcknowledged(newAcks);
      setSkipped(newSkips);
      updateFlowchartOverridesURL(newAcks, newSkips);
    },
    [acknowledged, skipped],
  );

  const handleUndo = useCallback(
    (stepId: string) => {
      const newAcks = acknowledged.filter((id) => id !== stepId);
      const newSkips = skipped.filter((id) => id !== stepId);
      setAcknowledged(newAcks);
      setSkipped(newSkips);
      updateFlowchartOverridesURL(newAcks, newSkips);
    },
    [acknowledged, skipped],
  );

  const openDetail = useCallback((step: FlowchartStep) => {
    setDetailStep(step);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailStep(null);
  }, []);

  // Split steps into rows for zig-zag: 4 per row on desktop, 2 on mobile
  // We use a fixed 4-per-row for the zig-zag pattern
  const COLS = 4;
  const rows: FlowchartStep[][] = [];
  for (let i = 0; i < steps.length; i += COLS) {
    const row = steps.slice(i, i + COLS);
    // Odd rows (1, 3, ...) are right-to-left, so reverse them
    if (rows.length % 2 === 1) {
      rows.push([...row].reverse());
    } else {
      rows.push(row);
    }
  }

  const caWikiUrl = "https://www.reddit.com/r/PersonalFinanceCanada/wiki/money-steps";
  const usWikiUrl = "https://www.reddit.com/r/personalfinance/wiki/commontopics";

  return (
    <div
      className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5 shadow-sm transition-all duration-200"
      data-testid="financial-flowchart"
    >
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">🗺️</span>
          <h3 className="text-sm font-medium text-slate-400">Money Steps</h3>
          <span className="text-lg font-bold text-white ml-1">
            {completed}<span className="text-slate-500">/{total}</span>
          </span>
        </div>
        <div className="flex-1 min-w-[120px] max-w-xs">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-white/5"
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress: ${completed} of ${total} steps`}
          >
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${percentage}%`,
                background: percentage === 100
                  ? "linear-gradient(to right, #10b981, #34d399)"
                  : "linear-gradient(to right, #10b981, #f59e0b)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Zig-zag flowchart */}
      <div role="list" aria-label="Money steps">
        {rows.map((row, rowIdx) => {
          const isReversedRow = rowIdx % 2 === 1;
          // Determine the status of the last step in this row for the turn connector
          const lastStepInRow = isReversedRow ? row[0] : row[row.length - 1];
          const isLastRow = rowIdx === rows.length - 1;

          return (
            <div key={rowIdx}>
              {/* Row of step cards with horizontal connectors */}
              <div className="grid gap-2 sm:flex sm:items-stretch sm:gap-0">
                {row.map((step, colIdx) => {
                  const isLastInRow = colIdx === row.length - 1;
                  return (
                    <div key={step.id} role="listitem" className="flex items-stretch sm:flex-1 min-w-0">
                      <div className="flex-1 min-w-0">
                        <ZigZagStep
                          step={step}
                          isSkipped={skipped.includes(step.id)}
                          onClick={() => openDetail(step)}
                        />
                      </div>
                      {!isLastInRow && <HorizontalConnector status={step.status} />}
                    </div>
                  );
                })}
              </div>

              {/* Zig-zag turn connector between rows */}
              {!isLastRow && (
                <ZigZagTurn
                  direction={isReversedRow ? "left" : "right"}
                  status={lastStepInRow.status}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Detail modal */}
      {detailStep && (
        <StepDetailModal
          step={detailStep}
          isAcknowledged={acknowledged.includes(detailStep.id)}
          isSkipped={skipped.includes(detailStep.id)}
          onAcknowledge={(checked) => handleAcknowledge(detailStep.id, checked)}
          onSkip={(checked) => handleSkip(detailStep.id, checked)}
          onUndo={() => handleUndo(detailStep.id)}
          onClose={closeDetail}
        />
      )}

      {/* Attribution */}
      <div className="mt-4 border-t border-white/5 pt-3">
        <p className="text-[11px] leading-relaxed text-slate-600">
          Based on the{" "}
          {country === "CA" ? (
            <a href={caWikiUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 underline underline-offset-2 hover:text-slate-300 transition-colors">
              r/PersonalFinanceCanada Money Steps
            </a>
          ) : (
            <a href={usWikiUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 underline underline-offset-2 hover:text-slate-300 transition-colors">
              r/personalfinance How to handle $
            </a>
          )}{" "}
          community guide. General guidance only — not financial advice.
        </p>
      </div>
    </div>
  );
}
