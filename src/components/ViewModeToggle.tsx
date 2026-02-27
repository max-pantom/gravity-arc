"use client";

import { cn } from "@/lib/cn";

export type ViewMode = "linear" | "cards";

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-0.5">
      <button
        type="button"
        onClick={() => onChange("linear")}
        className={cn(
          "px-2 py-1 text-xs rounded transition-colors",
          mode === "linear"
            ? "bg-[var(--accent)] text-white"
            : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
        )}
        aria-label="Linear view"
      >
        Linear
      </button>
      <button
        type="button"
        onClick={() => onChange("cards")}
        className={cn(
          "px-2 py-1 text-xs rounded transition-colors",
          mode === "cards"
            ? "bg-[var(--accent)] text-white"
            : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
        )}
        aria-label="Card grid view"
      >
        Cards
      </button>
    </div>
  );
}
