"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  getFlowchartSteps,
  getCurrentStepIndex,
  applyUserOverrides,
  getStepContext,
  detectRetirementHeuristic,
  type FlowchartStep,
  type StepStatus,
  type StepContext,
} from "@/lib/flowchart-steps";
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

// ── Currency formatter ───────────────────────────────────────────────────────

function fmtMoney(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs >= 1000
    ? "$" + Math.round(abs).toLocaleString()
    : "$" + abs.toFixed(0);
  return n < 0 ? "-" + formatted : formatted;
}

// ── Step context display ─────────────────────────────────────────────────────

function StepContextSection({ context }: { context: StepContext }) {
  const hasItems = context.items.length > 0;
  const hasProgress = context.progress && context.progress.target > 0;

  if (!hasItems && !hasProgress) {
    return (
      <div className="mt-3 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2.5">
        <p className="text-xs font-medium text-slate-500 mb-1">{context.heading}</p>
        <p className="text-xs text-slate-600 italic">None found in your data yet</p>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg bg-white/[0.03] border border-white/5 px-3 py-2.5">
      <p className="text-xs font-medium text-slate-500 mb-1.5">{context.heading}</p>
      {hasItems && (
        <div className="space-y-1">
          {context.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-slate-300 truncate">{item.label}</span>
              <span className="flex-shrink-0 tabular-nums text-slate-400">
                {fmtMoney(item.amount)}
                {item.detail && <span className="text-slate-600 text-xs ml-0.5">{item.detail}</span>}
              </span>
            </div>
          ))}
        </div>
      )}
      {hasProgress && context.progress && (
        <div className="mt-2 pt-2 border-t border-white/5">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500">
              {fmtMoney(context.progress.current)} of {fmtMoney(context.progress.target)}
            </span>
            <span className="font-medium tabular-nums text-amber-400">
              {Math.min(100, Math.round((context.progress.current / context.progress.target) * 100))}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (context.progress.current / context.progress.target) * 100)}%`,
                background: context.progress.current >= context.progress.target
                  ? "linear-gradient(to right, #10b981, #34d399)"
                  : "linear-gradient(to right, #f59e0b, #fbbf24)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Detail modal (portal) ────────────────────────────────────────────────────

function StepDetailModal({
  step,
  context,
  isAcknowledged,
  isSkipped,
  onAcknowledge,
  onSkip,
  onUndo,
  onClose,
}: {
  step: FlowchartStep;
  context: StepContext | null;
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
        data-testid={`step-modal-${step.id}`}
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

        {context && <StepContextSection context={context} />}

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

// ── Timeline step row (compact) ──────────────────────────────────────────────

function TimelineStep({
  step,
  isSkipped,
  isLast,
  onClick,
}: {
  step: FlowchartStep;
  isSkipped: boolean;
  isLast: boolean;
  onClick: () => void;
}) {
  // Timeline line color: completed segments are green, others are dim
  const lineColor = step.status === "complete" ? "bg-emerald-500/40" : "bg-white/10";

  return (
    <button
      type="button"
      className="group flex w-full items-stretch gap-0 text-left focus:outline-none"
      onClick={onClick}
      data-testid={`flowchart-step-${step.id}`}
    >
      {/* Timeline column: circle + connecting line */}
      <div className="relative flex flex-col items-center w-8 flex-shrink-0">
        {/* Top line segment (connects to previous step) */}
        <div className={`w-0.5 flex-1 min-h-1 ${lineColor}`} />
        {/* Circle */}
        <div className="flex-shrink-0 my-0.5">
          <StepCircle step={step} />
        </div>
        {/* Bottom line segment (connects to next step) */}
        {!isLast ? (
          <div className={`w-0.5 flex-1 min-h-1 ${lineColor}`} />
        ) : (
          <div className="flex-1" />
        )}
      </div>

      {/* Content */}
      <div
        className={`flex-1 min-w-0 py-1.5 pl-2 pr-2 my-0.5 rounded-lg transition-all duration-200 ${
          step.status === "in-progress"
            ? "bg-amber-500/8 ring-1 ring-amber-400/25 hover:bg-amber-500/12"
            : step.status === "complete"
              ? "hover:bg-white/[0.03]"
              : "hover:bg-white/[0.03]"
        }`}
      >
        <div className="flex items-center gap-2">
          <p className={`text-sm font-medium leading-tight truncate ${
            step.status === "complete"
              ? "text-emerald-400/70"
              : step.status === "in-progress"
                ? "text-amber-300 font-semibold"
                : "text-slate-500"
          }`}>
            {step.title}
          </p>
          {isSkipped && (
            <span className="flex-shrink-0 rounded-full bg-slate-700/60 px-1.5 py-0.5 text-[10px] text-slate-500">N/A</span>
          )}
          {step.status === "in-progress" && step.progress > 0 && step.progress < 100 && (
            <span className="flex-shrink-0 text-[10px] font-medium tabular-nums text-amber-400/80">{step.progress}%</span>
          )}
          {/* Chevron */}
          <svg className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
        {step.status !== "complete" && step.completionHint && (
          <p className="mt-0.5 text-[11px] leading-snug text-slate-600 truncate">{step.completionHint}</p>
        )}
      </div>
    </button>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function FinancialFlowchart({
  state,
  acknowledged,
  skipped,
  isRetired,
  onAcksChange,
  onSkipsChange,
  onRetiredChange,
}: {
  state: FinancialState;
  acknowledged: string[];
  skipped: string[];
  isRetired: boolean;
  onAcksChange: (acks: string[]) => void;
  onSkipsChange: (skips: string[]) => void;
  onRetiredChange: (retired: boolean) => void;
}) {
  const [detailStep, setDetailStep] = useState<FlowchartStep | null>(null);

  const retirementSuggested = useMemo(
    () => !isRetired && detectRetirementHeuristic(state),
    [isRetired, state],
  );

  const handleRetiredChange = useCallback((checked: boolean) => {
    onRetiredChange(checked);
  }, [onRetiredChange]);

  const baseSteps = useMemo(() => getFlowchartSteps(state, isRetired), [state, isRetired]);
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
      onAcksChange(newAcks);
      onSkipsChange(newSkips);
    },
    [acknowledged, skipped, onAcksChange, onSkipsChange],
  );

  const handleSkip = useCallback(
    (stepId: string, checked: boolean) => {
      const newAcks = acknowledged.filter((id) => id !== stepId);
      const newSkips = checked
        ? [...skipped.filter((id) => id !== stepId), stepId]
        : skipped.filter((id) => id !== stepId);
      onAcksChange(newAcks);
      onSkipsChange(newSkips);
    },
    [acknowledged, skipped, onAcksChange, onSkipsChange],
  );

  const handleUndo = useCallback(
    (stepId: string) => {
      const newAcks = acknowledged.filter((id) => id !== stepId);
      const newSkips = skipped.filter((id) => id !== stepId);
      onAcksChange(newAcks);
      onSkipsChange(newSkips);
    },
    [acknowledged, skipped, onAcksChange, onSkipsChange],
  );

  const openDetail = useCallback((step: FlowchartStep) => {
    setDetailStep(step);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailStep(null);
  }, []);

  const caWikiUrl = "https://www.reddit.com/r/PersonalFinanceCanada/wiki/money-steps";
  const usWikiUrl = "https://www.reddit.com/r/personalfinance/wiki/commontopics";

  return (
    <div
      className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5 shadow-sm transition-all duration-200"
      data-testid="financial-flowchart"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
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

      {/* Retirement toggle */}
      <div className="mb-3 flex items-center gap-2">
        <label className="flex cursor-pointer items-center gap-2" data-testid="retired-toggle-label">
          <input
            type="checkbox"
            checked={isRetired}
            onChange={(e) => handleRetiredChange(e.target.checked)}
            className="h-4 w-4 flex-shrink-0 rounded accent-violet-500"
            data-testid="retired-toggle"
          />
          <span className="text-xs text-slate-500">I&apos;m retired</span>
        </label>
        {isRetired && (
          <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-400">
            Retirement mode
          </span>
        )}
      </div>

      {/* Retirement suggestion banner */}
      {retirementSuggested && (
        <div
          className="mb-3 flex items-start gap-2 rounded-lg border border-violet-500/20 bg-violet-500/5 px-3 py-2.5"
          data-testid="retirement-suggestion"
        >
          <span className="mt-0.5 text-sm text-violet-400" aria-hidden="true">💡</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400">
              It looks like you may be retired — your income is non-employment and you have a long runway.
            </p>
            <button
              type="button"
              onClick={() => handleRetiredChange(true)}
              className="mt-1 text-xs font-medium text-violet-400 underline underline-offset-2 transition-colors hover:text-violet-300"
            >
              Enable retirement mode
            </button>
          </div>
        </div>
      )}

      {/* Top-down timeline flow */}
      <div role="list" aria-label="Money steps">
        {steps.map((step, idx) => (
          <div key={step.id} role="listitem">
            <TimelineStep
              step={step}
              isSkipped={skipped.includes(step.id)}
              isLast={idx === steps.length - 1}
              onClick={() => openDetail(step)}
            />
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {detailStep && (
        <StepDetailModal
          step={detailStep}
          context={getStepContext(detailStep.id, state)}
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
