"use client";

import { useEffect, useRef } from "react";
import { WIZARD_STEPS, type WizardStep } from "@/lib/url-state";

const STEP_META: Record<string, { icon: string; label: string; shortLabel: string }> = {
  welcome: { icon: "👋", label: "Welcome", shortLabel: "Start" },
  profile: { icon: "👤", label: "Profile", shortLabel: "Profile" },
  property: { icon: "🏠", label: "Properties", shortLabel: "Property" },
  assets: { icon: "💰", label: "Assets", shortLabel: "Assets" },
  stocks: { icon: "📊", label: "Stocks", shortLabel: "Stocks" },
  debts: { icon: "💳", label: "Debts", shortLabel: "Debts" },
  income: { icon: "💵", label: "Income", shortLabel: "Income" },
  "tax-summary": { icon: "📋", label: "Tax Summary", shortLabel: "Tax" },
  expenses: { icon: "🧾", label: "Expenses & Credits", shortLabel: "Expenses" },
};

export default function WizardStepper({
  currentStep,
  onStepChange,
  stepCompletion,
}: {
  currentStep: WizardStep;
  onStepChange: (step: WizardStep) => void;
  stepCompletion: Record<string, boolean>;
}) {
  const currentIdx = WIZARD_STEPS.indexOf(currentStep);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll the active step into view (centered) when step changes
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [currentStep]);

  return (
    <nav className="w-full overflow-x-auto scrollbar-hide" aria-label="Wizard steps" style={{ scrollbarWidth: "none" }}>
      <ol className="flex items-center gap-0 min-w-max px-1 py-0.5 pr-8">
        {WIZARD_STEPS.map((step, idx) => {
          const meta = STEP_META[step];
          const isCurrent = step === currentStep;
          const isComplete = stepCompletion[step] ?? false;
          const isPast = idx < currentIdx;

          return (
            <li key={step} className="flex items-center">
              <button
                ref={isCurrent ? activeRef : undefined}
                type="button"
                onClick={() => onStepChange(step)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-violet-400 ${
                  isCurrent
                    ? "bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30"
                    : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                }`}
                aria-current={isCurrent ? "step" : undefined}
                data-testid={`wizard-step-${step}`}
              >
                <span className="text-sm" aria-hidden="true">{meta.icon}</span>
                <span className="hidden sm:inline">{meta.label}</span>
                <span className="sm:hidden">{meta.shortLabel}</span>
              </button>
              {idx < WIZARD_STEPS.length - 1 && (
                <div
                  className="mx-0.5 h-px w-4 bg-white/10"
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
