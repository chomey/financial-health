"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

interface HelpTipProps {
  text: string;
}

export default function HelpTip({ text }: HelpTipProps) {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // Position above trigger, centered
    setPosition({
      top: rect.top + window.scrollY,
      left: rect.left + rect.width / 2,
    });
  }, []);

  const handleEnter = useCallback(() => {
    updatePosition();
    setShow(true);
  }, [updatePosition]);

  const handleLeave = useCallback(() => {
    setShow(false);
  }, []);

  // Adjust if tooltip overflows viewport
  useEffect(() => {
    if (!show || !tooltipRef.current) return;
    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    // If overflowing right edge
    if (rect.right > window.innerWidth - 8) {
      tooltip.style.transform = `translateX(-${rect.right - window.innerWidth + 16}px)`;
    }
    // If overflowing left edge
    if (rect.left < 8) {
      tooltip.style.transform = `translateX(${8 - rect.left}px)`;
    }
  }, [show, position]);

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[10px] font-medium text-slate-500 transition-all duration-150 hover:border-violet-400/50 hover:text-violet-400 cursor-help"
        aria-label="Help"
        data-testid="help-tip-button"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
        tabIndex={0}
      >
        ?
      </span>
      {show && position && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-[9999] w-52 -translate-x-1/2 rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs leading-relaxed text-slate-300 shadow-xl shadow-black/40 pointer-events-none"
          style={{
            top: position.top - window.scrollY - 8,
            left: position.left,
            transform: "translate(-50%, -100%)",
          }}
          data-testid="help-tip-popover"
        >
          {text}
          <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-white/10 bg-slate-800" />
        </div>,
        document.body,
      )}
    </>
  );
}
