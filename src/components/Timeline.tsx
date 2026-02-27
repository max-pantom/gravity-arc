"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listCardsByCreated, extractTitle } from "@/lib/db";
import type { Card } from "@/lib/db/schema";
import { cn } from "@/lib/cn";

export type ViewMode = "linear" | "cards";

const TYPE_LABELS: Record<string, string> = {
  idea: "Idea",
  project: "Project",
  note: "Note",
  design: "Design",
  experiment: "Experiment",
  link: "Link",
};

interface TimelineProps {
  viewMode: ViewMode;
}

export function Timeline({ viewMode }: TimelineProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const list = await listCardsByCreated();
    setCards(list);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  if (loading) {
    return (
      <div
        className={cn(
          "py-8",
          viewMode === "cards" && "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        )}
      >
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] animate-pulse",
              viewMode === "linear" ? "h-16 mb-2" : "h-40"
            )}
            aria-hidden
          />
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-[var(--fg-muted)] text-pretty mb-2">
          No cards yet. Pick a type above, type something, and press Enter.
        </p>
        <p className="text-sm text-[var(--fg-muted)]">
          This is not a notes app. It&apos;s memory.
        </p>
      </div>
    );
  }

  if (viewMode === "cards") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link
            key={card.id}
            href={`/card/${card.id}`}
            className={cn(
              "block rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4",
              "hover:border-[var(--accent-muted)] transition-colors",
              "min-h-[140px] flex flex-col"
            )}
          >
            <span className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wide">
              {TYPE_LABELS[card.type ?? "note"] ?? "Note"}
            </span>
            <p className="text-[var(--fg)] text-pretty line-clamp-3 mt-2 flex-1">
              {extractTitle(card.content)}
            </p>
            <p className="text-xs text-[var(--fg-muted)] mt-2 tabular-nums">
              {new Date(card.updated_at).toLocaleDateString()}
            </p>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {cards.map((card) => (
        <Link
          key={card.id}
          href={`/card/${card.id}`}
          className={cn(
            "block rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3",
            "hover:border-[var(--accent-muted)] transition-colors"
          )}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[var(--fg-muted)]">
              {TYPE_LABELS[card.type ?? "note"] ?? "Note"}
            </span>
          </div>
          <p className="text-[var(--fg)] text-pretty line-clamp-2 mt-0.5">
            {extractTitle(card.content)}
          </p>
          <p className="text-xs text-[var(--fg-muted)] mt-1 tabular-nums">
            {new Date(card.updated_at).toLocaleDateString()}
          </p>
        </Link>
      ))}
    </div>
  );
}
