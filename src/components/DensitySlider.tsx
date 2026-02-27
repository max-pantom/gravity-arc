"use client";

import { cn } from "@/lib/cn";
import type { Density } from "./MemoryGrid";

interface DensitySliderProps {
  value: Density;
  onChange: (value: Density) => void;
  className?: string;
}

const OPTIONS: { value: Density; label: string }[] = [
  { value: "sparse", label: "Sparse" },
  { value: "medium", label: "Medium" },
  { value: "dense", label: "Dense" },
];

export function DensitySlider({ value, onChange, className }: DensitySliderProps) {
  return (
    <div
      className={cn(
        "flex rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-0.5",
        className
      )}
      role="group"
      aria-label="Visual density"
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "px-3 py-1.5 text-xs rounded-md transition-colors",
            value === opt.value
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
          )}
          aria-pressed={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
