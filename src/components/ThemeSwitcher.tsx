"use client";

import { useTheme } from "./ThemeProvider";
import { cn } from "@/lib/cn";

const themes = [
  { id: "ghost" as const, label: "Ghost" },
  { id: "vine" as const, label: "Vine" },
  { id: "light" as const, label: "Light" },
  { id: "dark" as const, label: "Dark" },
  { id: "void" as const, label: "Void" },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-1 rounded-md p-1 bg-[var(--bg-elevated)] border border-[var(--border)]">
      {themes.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTheme(t.id)}
          className={cn(
            "px-2 py-1 text-xs rounded transition-colors",
            theme === t.id
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
          )}
          aria-label={`Switch to ${t.label} theme`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
