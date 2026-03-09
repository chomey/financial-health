"use client";

import { useState, useRef, useEffect } from "react";

interface HelpTipProps {
  text: string;
}

export default function HelpTip({ text }: HelpTipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[10px] font-medium text-slate-500 transition-all duration-150 hover:border-violet-400/50 hover:text-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30"
        aria-label="Help"
        aria-expanded={open}
        data-testid="help-tip-button"
      >
        ?
      </button>
      {open && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 z-50 mb-2 w-44 -translate-x-1/2 rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs leading-relaxed text-slate-300 shadow-lg shadow-black/30 pointer-events-none"
          data-testid="help-tip-popover"
        >
          {text}
          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-white/10 bg-slate-800" />
        </div>
      )}
    </div>
  );
}
