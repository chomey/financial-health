"use client";

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

export default function RegionToggle({ region, onChange }: RegionToggleProps) {
  return (
    <div
      className="inline-flex items-center rounded-lg border border-stone-200 bg-stone-50 p-0.5 shadow-sm"
      role="radiogroup"
      aria-label="Select financial region"
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
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${
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
  );
}
