"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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

/** Maps a step status to Tailwind color class for its title text */
export function getStepTitleColor(status: StepStatus): string {
  if (status === "complete") return "text-emerald-400";
  if (status === "in-progress") return "text-amber-400";
  return "text-slate-400";
}

/** Returns Tailwind class for the vertical connector line below a step circle */
export function getConnectorColor(status: StepStatus): string {
  return status === "complete" ? "bg-emerald-500/40" : "bg-white/10";
}

// ── Step circle indicator ──────────────────────────────────────────────────────

function StepCircle({ step }: { step: FlowchartStep }) {
  if (step.status === "complete") {
    return (
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30">
        <svg
          className="h-4 w-4 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    );
  }

  if (step.status === "in-progress") {
    return (
      <div
        className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 shadow-sm shadow-amber-500/30"
        aria-label="In progress"
      >
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-30" />
        <span className="relative text-xs font-bold text-white">{step.stepNumber}</span>
      </div>
    );
  }

  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5">
      <span className="text-xs font-medium text-slate-500">{step.stepNumber}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function FinancialFlowchart({ state }: { state: FinancialState }) {
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load URL state and auto-expand current step on mount
  useEffect(() => {
    const acks = getFlowchartAcksFromURL();
    const skps = getFlowchartSkipsFromURL();
    setAcknowledged(acks);
    setSkipped(skps);
    const stepsWithOverrides = applyUserOverrides(getFlowchartSteps(state), acks, skps);
    const idx = getCurrentStepIndex(stepsWithOverrides);
    setExpandedId(stepsWithOverrides[idx]?.id ?? null);
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
    (stepId: string, checked: boolean, wasSkipped: boolean) => {
      const newSkips = wasSkipped && checked ? skipped.filter((id) => id !== stepId) : skipped;
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
    (stepId: string, checked: boolean, wasAcknowledged: boolean) => {
      const newAcks =
        wasAcknowledged && checked ? acknowledged.filter((id) => id !== stepId) : acknowledged;
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

  const toggleExpand = useCallback((stepId: string) => {
    setExpandedId((prev) => (prev === stepId ? null : stepId));
  }, []);

  const caWikiUrl = "https://www.reddit.com/r/PersonalFinanceCanada/wiki/money-steps";
  const usWikiUrl = "https://www.reddit.com/r/personalfinance/wiki/commontopics";

  return (
    <div
      className="rounded-xl border border-white/10 bg-white/5 p-5 shadow-sm transition-all duration-200"
      data-testid="financial-flowchart"
    >
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-400">Financial Roadmap</h3>
          <span className="text-lg" aria-hidden="true">
            🗺️
          </span>
        </div>
        <p className="mt-1 text-2xl font-bold text-white">
          {completed}
          <span className="text-slate-400">/{total}</span>
          <span className="ml-2 text-sm font-normal text-slate-400">steps complete</span>
        </p>
        {/* Gradient progress bar */}
        <div
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Roadmap progress: ${completed} of ${total} steps`}
        >
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${percentage}%`,
              background:
                percentage === 100
                  ? "linear-gradient(to right, #10b981, #34d399)"
                  : "linear-gradient(to right, #10b981, #f59e0b)",
            }}
          />
        </div>
      </div>

      {/* Steps list */}
      <div role="list" aria-label="Financial roadmap steps">
        {steps.map((step, idx) => {
          const isExpanded = expandedId === step.id;
          const isAcknowledged = acknowledged.includes(step.id);
          const isSkipped = skipped.includes(step.id);
          const isOverridden = isAcknowledged || isSkipped;
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.id} role="listitem" className="relative flex gap-3">
              {/* Left column: circle + connector line */}
              <div className="flex flex-col items-center">
                <StepCircle step={step} />
                {!isLast && (
                  <div
                    className={`mt-0.5 w-0.5 flex-1 ${getConnectorColor(step.status)}`}
                    style={{ minHeight: "1.5rem" }}
                    aria-hidden="true"
                  />
                )}
              </div>

              {/* Step content */}
              <div className={`min-w-0 flex-1 ${isLast ? "pb-0" : "pb-3"}`}>
                <button
                  type="button"
                  className="w-full rounded-lg px-2 py-1 text-left transition-colors duration-150 hover:bg-white/5 focus:outline-none focus:ring-1 focus:ring-violet-400 active:bg-white/10"
                  onClick={() => toggleExpand(step.id)}
                  aria-expanded={isExpanded}
                  data-testid={`step-button-${step.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-medium leading-tight ${getStepTitleColor(step.status)}`}>
                        {step.title}
                        {isSkipped && (
                          <span className="ml-2 rounded-full bg-slate-700/60 px-1.5 py-0.5 text-xs font-normal text-slate-500">
                            N/A
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                        {step.completionHint}
                      </p>
                    </div>
                    <div className="flex flex-shrink-0 items-center gap-1.5">
                      {step.status !== "complete" && step.progress > 0 && step.progress < 100 && (
                        <span className="text-xs font-medium text-amber-400">{step.progress}%</span>
                      )}
                      <svg
                        className={`h-3 w-3 text-slate-600 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Expanded detail panel */}
                {isExpanded && (
                  <div
                    className="mt-1.5 space-y-3 rounded-lg border border-white/5 bg-black/20 px-3 py-3 text-xs leading-relaxed text-slate-400"
                    data-testid={`step-detail-${step.id}`}
                  >
                    <p>{step.detailText}</p>

                    {/* User-acknowledgeable checkboxes */}
                    {(step.userAcknowledgeable || step.skippable) && (
                      <div className="space-y-2 border-t border-white/10 pt-2">
                        {step.userAcknowledgeable && step.acknowledgeLabel && (
                          <label
                            className="flex cursor-pointer items-start gap-2"
                          >
                            <input
                              type="checkbox"
                              checked={isAcknowledged}
                              onChange={(e) => {
                                handleAcknowledge(step.id, e.target.checked, isSkipped);
                              }}
                              className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded accent-emerald-500"
                              data-testid={`ack-checkbox-${step.id}`}
                            />
                            <span className="text-slate-300">{step.acknowledgeLabel}</span>
                          </label>
                        )}
                        {step.skippable && step.skipLabel && (
                          <label
                            className="flex cursor-pointer items-start gap-2"
                          >
                            <input
                              type="checkbox"
                              checked={isSkipped}
                              onChange={(e) => {
                                handleSkip(step.id, e.target.checked, isAcknowledged);
                              }}
                              className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 rounded accent-slate-500"
                              data-testid={`skip-checkbox-${step.id}`}
                            />
                            <span className="text-slate-500">{step.skipLabel}</span>
                          </label>
                        )}
                        {isOverridden && (
                          <button
                            type="button"
                            onClick={() => handleUndo(step.id)}
                            className="text-xs text-slate-500 underline underline-offset-2 transition-colors duration-150 hover:text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-400"
                            data-testid={`undo-button-${step.id}`}
                          >
                            Undo
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Community credit + disclaimer */}
      <div className="mt-5 border-t border-white/5 pt-4">
        <p className="text-xs leading-relaxed text-slate-600">
          Based on the{" "}
          {country === "CA" ? (
            <a
              href={caWikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 underline underline-offset-2 transition-colors duration-150 hover:text-slate-300"
            >
              r/PersonalFinanceCanada Money Steps
            </a>
          ) : (
            <a
              href={usWikiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 underline underline-offset-2 transition-colors duration-150 hover:text-slate-300"
            >
              r/personalfinance How to handle $
            </a>
          )}{" "}
          community guide. General guidance only — not financial advice.
        </p>
      </div>
    </div>
  );
}
