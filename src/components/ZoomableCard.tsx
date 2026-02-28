"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";

export default function ZoomableCard({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const open = useCallback(() => {
    setIsOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsVisible(true));
    });
  }, []);

  const close = useCallback(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsOpen(false), 150);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  return (
    <>
      <div
        className="group relative cursor-zoom-in"
        onClick={open}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } }}
        aria-label="Click to expand chart"
      >
        <div className="absolute right-2 top-2 z-10 rounded-md bg-white/80 p-1 text-stone-400 opacity-0 shadow-sm backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
          </svg>
        </div>
        {children}
      </div>

      {isOpen &&
        createPortal(
          <div
            ref={overlayRef}
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-150 ease-out ${isVisible ? "bg-black/50 backdrop-blur-sm" : "bg-transparent"}`}
            onClick={(e) => { if (e.target === overlayRef.current) close(); }}
          >
            <div
              className={`relative max-h-[95vh] w-full max-w-[95vw] overflow-auto rounded-2xl bg-white p-6 shadow-2xl transition-all duration-150 ease-out ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
            >
              <button
                onClick={(e) => { e.stopPropagation(); close(); }}
                className="absolute right-3 top-3 z-10 rounded-full bg-stone-100 p-1.5 text-stone-500 transition-colors duration-150 hover:bg-stone-200 hover:text-stone-700"
                aria-label="Close expanded view"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="min-h-[70vh]">
                {children}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
