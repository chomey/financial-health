"use client";

import { useState, useEffect, useRef } from "react";
import type { Region } from "@/lib/financial-state";

interface RegionToggleProps {
  region: Region;
  onChange: (region: Region) => void;
}

const REGION_OPTIONS: { value: Region; label: string; flag: string }[] = [
  { value: "CA", label: "CA", flag: "🇨🇦" },
  { value: "US", label: "US", flag: "🇺🇸" },
  { value: "both", label: "Both", flag: "🌐" },
];

const REGION_DESCRIPTIONS: Record<Region, string> = {
  CA: "Showing Canadian account types",
  US: "Showing US account types",
  both: "Showing all account types",
};

export default function RegionToggle({ region, onChange }: RegionToggleProps) {
  const [toast, setToast] = useState<string | null>(null);
  const initialized = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show toast on region change (not on initial mount) — intentional effect-driven state
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }
    const message = REGION_DESCRIPTIONS[region];
    setToast(message);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setToast(null), 2000);
  }, [region]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <div className="relative">
      <div
        className="inline-flex items-center rounded-lg border border-stone-200 bg-stone-50 p-0.5 shadow-sm"
        role="radiogroup"
        aria-label="Filter account types by region"
        title="Filter account types by region"
      >
        {REGION_OPTIONS.map((option) => {
          const isSelected = region === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(option.value)}
              className={`inline-flex min-h-[44px] items-center gap-1 rounded-md px-2.5 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 active:scale-95 sm:min-h-0 sm:py-1 ${
                isSelected
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-500 hover:text-stone-700 hover:bg-white/50"
              }`}
            >
              <span aria-hidden="true">{option.flag}</span>
              {option.label}
            </button>
          );
        })}
      </div>
      {/* Toast message on region change */}
      {toast && (
        <div
          className="absolute left-1/2 top-full z-20 mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-800 px-3 py-1.5 text-xs font-medium text-white shadow-lg animate-fade-in"
          role="status"
          aria-live="polite"
          data-testid="region-toast"
        >
          {toast}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-stone-800" />
        </div>
      )}
    </div>
  );
}
