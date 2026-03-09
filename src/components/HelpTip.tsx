"use client";

interface HelpTipProps {
  text: string;
}

export default function HelpTip({ text }: HelpTipProps) {
  return (
    <div className="group relative inline-flex items-center">
      <span
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[10px] font-medium text-slate-500 transition-all duration-150 hover:border-violet-400/50 hover:text-violet-400 cursor-help"
        aria-label="Help"
        data-testid="help-tip-button"
      >
        ?
      </span>
      <div
        role="tooltip"
        className="absolute bottom-full left-1/2 z-50 mb-2 w-44 -translate-x-1/2 rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs leading-relaxed text-slate-300 shadow-lg shadow-black/30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
        data-testid="help-tip-popover"
      >
        {text}
        <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-white/10 bg-slate-800" />
      </div>
    </div>
  );
}
