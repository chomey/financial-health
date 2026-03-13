"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useOptionalDataFlow, type SourceMetadataItem } from "@/components/DataFlowArrows";
import { formatCurrencyCompact } from "@/lib/currency";
import { useModeContext } from "@/lib/ModeContext";

export function PrintSnapshotButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-md p-1.5 text-slate-500 transition-all duration-150 hover:bg-white/10 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-400 active:scale-95 print:hidden"
      aria-label="Print snapshot"
      data-testid="print-snapshot-button"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        />
      </svg>
    </button>
  );
}

/** Simple/Advanced mode toggle pill, reads from ModeContext. */
export function ModeToggle() {
  const { mode, setMode } = useModeContext();
  return (
    <div className="inline-flex rounded-lg border border-white/10 text-xs" data-testid="mode-toggle">
      <button
        type="button"
        onClick={() => setMode("simple")}
        className={`rounded-l-lg px-2 py-1 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400 ${
          mode === "simple"
            ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30"
            : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
        }`}
        aria-pressed={mode === "simple"}
        data-testid="mode-toggle-simple"
      >
        Simple
      </button>
      <button
        type="button"
        onClick={() => setMode("advanced")}
        className={`rounded-r-lg px-2 py-1 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400 ${
          mode === "advanced"
            ? "bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-500/30"
            : "text-slate-400 hover:bg-white/10 hover:text-slate-200"
        }`}
        aria-pressed={mode === "advanced"}
        data-testid="mode-toggle-advanced"
      >
        Advanced
      </button>
    </div>
  );
}

/**
 * Shared header bar for both Dashboard and Wizard views.
 * `activePhase` controls which pill is highlighted; the other is a clickable button.
 */
export function ResetButton() {
  const handleReset = useCallback(() => {
    if (window.confirm("This will erase all your data and start fresh. Are you sure?")) {
      try { localStorage.removeItem("fhs-visited"); } catch { /* noop */ }
      window.location.href = window.location.pathname;
    }
  }, []);

  return (
    <button
      type="button"
      onClick={handleReset}
      className="rounded-md p-1.5 text-slate-500 transition-all duration-150 hover:bg-rose-500/10 hover:text-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400 active:scale-95 print:hidden"
      aria-label="Reset all data"
      title="Reset all data"
      data-testid="reset-all-button"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    </button>
  );
}

export function AppHeader({
  activePhase,
  onSwitchPhase,
  children,
}: {
  activePhase: "inputs" | "dashboard";
  onSwitchPhase: () => void;
  /** Optional extra content below the title row (e.g. stepper nav) */
  children?: React.ReactNode;
}) {
  const inputsActive = activePhase === "inputs";
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-900/95 backdrop-blur-sm px-4 py-2 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 print:hidden">
          <h1 className="text-sm font-bold text-white whitespace-nowrap">
            <span className="hidden sm:inline">Financial Health</span>
            <span className="sm:hidden">FH</span>
          </h1>
          {/* Inputs / Dashboard pill toggle */}
          <div className="flex rounded-lg border border-white/10 text-xs">
            {inputsActive ? (
              <>
                <span className="rounded-l-lg bg-violet-500/15 px-2 py-1 font-medium text-violet-300 ring-1 ring-inset ring-violet-500/30">
                  <span className="hidden sm:inline">📝 </span>Inputs
                </span>
                <button
                  type="button"
                  onClick={onSwitchPhase}
                  className="rounded-r-lg px-2 py-1 font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400"
                  data-testid="wizard-skip-to-dashboard"
                >
                  <span className="hidden sm:inline">📊 </span>Dashboard
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onSwitchPhase}
                  className="rounded-l-lg px-2 py-1 font-medium text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400"
                >
                  <span className="hidden sm:inline">📝 </span>Inputs
                </button>
                <span className="rounded-r-lg bg-violet-500/15 px-2 py-1 font-medium text-violet-300 ring-1 ring-inset ring-violet-500/30">
                  <span className="hidden sm:inline">📊 </span>Dashboard
                </span>
              </>
            )}
          </div>
          <ModeToggle />
          <span className="flex-1" />
          <a
            href="/changelog"
            className="rounded-md px-1.5 py-1 text-xs text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
          >
            <span className="hidden sm:inline">Changelog</span>
            <span className="sm:hidden text-sm">📋</span>
          </a>
          <a
            href="https://ko-fi.com/R6R11VMSML"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md px-1.5 py-1 text-xs text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300"
          >
            <span className="hidden sm:inline">☕ Tip</span>
            <span className="sm:hidden text-sm">☕</span>
          </a>
          <ResetButton />
          <span className="hidden sm:flex sm:items-center sm:gap-1">
            <CopyLinkButton />
            <PrintSnapshotButton />
          </span>
        </div>
        {children && (
          <div className="relative">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-slate-900 to-transparent z-10 sm:hidden" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-slate-900 to-transparent z-10 sm:hidden" />
            {children}
          </div>
        )}
      </div>
    </header>
  );
}

export function PrintFooter() {
  const [date, setDate] = useState("");
  const [url, setUrl] = useState("");

  useEffect(() => {
    const updateValues = () => {
      setDate(
        new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
      setUrl(window.location.href);
    };
    updateValues();
    // Also refresh right before the browser opens the print dialog
    window.addEventListener("beforeprint", updateValues);
    return () => window.removeEventListener("beforeprint", updateValues);
  }, []);

  return (
    <footer
      className="mt-8 hidden border-t border-slate-700 pt-4 print:block"
      data-testid="print-footer"
    >
      <div className="flex items-start justify-between gap-4 text-xs text-slate-500">
        <div>
          <p className="font-semibold text-slate-300">Financial Health Snapshot</p>
          <p className="mt-0.5">Your finances at a glance — no accounts, no data stored</p>
        </div>
        <div className="space-y-0.5 text-right">
          <p data-testid="print-footer-date">{date}</p>
          <p
            className="break-all font-mono text-xs text-slate-500"
            data-testid="print-footer-url"
          >
            {url}
          </p>
        </div>
      </div>
    </footer>
  );
}

export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const input = document.createElement("input");
      input.value = window.location.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    }
  }, []);

  return (
    <button
      onClick={handleCopy}
      className="rounded-md p-1.5 text-slate-500 transition-all duration-150 hover:bg-white/10 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-violet-400 active:scale-95 print:hidden"
      aria-label="Copy link to clipboard"
    >
      {copied ? (
        <svg
          className="h-4 w-4 text-emerald-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
      )}
    </button>
  );
}

export function AgeInputHeader({ age, onAgeChange }: { age?: number; onAgeChange: (age: number | undefined) => void }) {
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState(age?.toString() ?? "");

  const submit = () => {
    const parsed = parseInt(input, 10);
    if (parsed >= 18 && parsed <= 120) {
      onAgeChange(parsed);
    } else if (input === "") {
      onAgeChange(undefined);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5" data-testid="age-input-header-form">
        <label className="text-sm font-medium text-slate-400">Age:</label>
        <input
          type="number"
          min={18}
          max={120}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") setEditing(false); }}
          onBlur={submit}
          autoFocus
          className="w-16 rounded-lg border border-white/10 bg-slate-800 px-2 py-1 text-sm text-slate-200 focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20 transition-all duration-150"
          placeholder="e.g. 35"
          data-testid="age-input-header"
        />
      </div>
    );
  }

  if (age) {
    return (
      <div className="flex items-center gap-1" data-testid="age-display-header">
        <span className="text-sm font-medium text-slate-400">Age:</span>
        <button
          onClick={() => { setInput(age.toString()); setEditing(true); }}
          className="min-h-[36px] rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-sm font-medium text-slate-300 shadow-sm transition-all duration-200 hover:border-white/20 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 focus:ring-offset-slate-900"
          data-testid="age-value-header"
        >
          {age}
        </button>
        <button
          onClick={() => { onAgeChange(undefined); setInput(""); }}
          className="p-1 text-slate-500 hover:text-slate-300 transition-colors duration-150 rounded"
          aria-label="Clear age"
          data-testid="age-clear-header"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setInput(""); setEditing(true); }}
      className="min-h-[36px] rounded-lg border border-dashed border-white/10 bg-transparent px-3 py-1 text-sm text-slate-500 transition-all duration-200 hover:border-white/20 hover:text-slate-300 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-1 focus:ring-offset-slate-900"
      data-testid="age-add-header"
    >
      Add age
    </button>
  );
}

export function WelcomeBanner() {
  return (
    <div className="relative mb-6 rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-400/10 to-cyan-400/5 px-4 py-4 shadow-sm sm:px-6 sm:py-5 backdrop-blur-sm">
      <h2 className="mb-2 text-base font-semibold text-slate-200 sm:text-lg">
        Welcome! Here&apos;s how this works
      </h2>
      <div className="space-y-2 text-base leading-relaxed text-slate-300">
        <p>
          This is a simple tool to help you see your <strong>full financial picture in one place</strong>. Just fill in some rough numbers for your savings, debts, income, and expenses — it doesn&apos;t need to be exact.
        </p>
        <p>
          You&apos;ll get a snapshot of where you stand, plus a projection of how things could look in 10, 20, or 30 years.
        </p>
        <div className="mt-3 rounded-lg bg-white/5 px-3 py-2.5 text-sm text-slate-400 sm:text-base">
          <strong className="text-slate-300">Your privacy is fully protected.</strong> Nothing you enter is stored on any server or sent anywhere. All your data stays right here in your browser. The numbers are saved in the page link itself — so you can bookmark it or share it, but nobody can see your information unless you give them that link.
        </div>
      </div>
    </div>
  );
}

export function CollapsibleSection({
  id,
  title,
  icon,
  summary,
  children,
  defaultOpen = true,
  dataFlowId,
  dataFlowValue,
  dataFlowLabel,
  dataFlowItems,
}: {
  id?: string;
  title: string;
  icon: string;
  summary?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  dataFlowId?: string;
  dataFlowValue?: number;
  dataFlowLabel?: string;
  dataFlowItems?: SourceMetadataItem[];
}) {
  const [open, setOpen] = useState(defaultOpen);
  const collapsedRef = useRef<HTMLButtonElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  const ctx = useOptionalDataFlow();

  // Register the appropriate element as a data-flow source based on open/collapsed state
  useEffect(() => {
    if (!dataFlowId || !ctx) return;
    const ref = open ? expandedRef : collapsedRef;
    ctx.registerSource(dataFlowId, ref, {
      label: dataFlowLabel ?? title,
      value: dataFlowValue ?? 0,
      items: dataFlowItems,
    });
    return () => ctx.unregisterSource(dataFlowId);
  }, [dataFlowId, dataFlowLabel, dataFlowValue, dataFlowItems, title, open, ctx]);

  if (!open) {
    return (
      <button
        type="button"
        ref={collapsedRef}
        id={id}
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 shadow-sm text-left transition-all duration-200 hover:shadow-md hover:bg-white/10 scroll-mt-16"
        aria-expanded={false}
        data-dataflow-source={dataFlowId}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden="true">{icon}</span>
          <h2 className="text-base font-semibold text-slate-200">{title}</h2>
          {summary && (
            <span className="ml-2 text-sm text-slate-500 truncate">{summary}</span>
          )}
        </div>
        <svg
          className="h-4 w-4 flex-shrink-0 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    );
  }

  return (
    <div ref={expandedRef} id={id} className="relative scroll-mt-16" data-dataflow-source={dataFlowId}>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="absolute right-3 top-3 z-10 rounded-md p-1 text-slate-500 transition-colors duration-150 hover:bg-white/10 hover:text-slate-300"
        aria-expanded={true}
        aria-label={`Collapse ${title}`}
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
        </svg>
      </button>
      {children}
    </div>
  );
}

export function formatCurrencySummary(amount: number): string {
  return formatCurrencyCompact(amount, "USD", "USD");
}
