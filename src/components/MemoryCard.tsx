"use client";

import Link from "next/link";
import type { MemoryUnit } from "@/lib/db/schema";
import { extractTitle } from "@/storage/indexedDbAdapter";
import { cn } from "@/lib/cn";

const TYPE_LABELS: Record<string, string> = {
  idea: "Idea",
  project: "Project",
  note: "Note",
  design: "Design",
  experiment: "Experiment",
  link: "Link",
};

interface MemoryCardProps {
  memory: MemoryUnit;
  recallScore?: number;
  className?: string;
}

export function MemoryCard({ memory, recallScore = 0, className }: MemoryCardProps) {
  const glow = recallScore > 0.3 ? "opacity-100" : recallScore > 0.15 ? "opacity-60" : "opacity-30";

  return (
    <Link
      href={`/memory/${memory.id}`}
      className={cn(
        "block rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4",
        "hover:border-[var(--accent-muted)] transition-colors",
        "min-h-[100px] flex flex-col",
        className
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wide">
          {TYPE_LABELS[memory.type ?? "note"] ?? "Note"}
        </span>
        {recallScore > 0 && (
          <span
            className={cn("size-2 rounded-full bg-[var(--accent)]", glow)}
            style={{ opacity: 0.3 + recallScore * 0.5 }}
            aria-hidden
          />
        )}
      </div>
      <p className="text-[var(--fg)] text-pretty line-clamp-3 mt-2 flex-1">
        {extractTitle(memory.content)}
      </p>
      <p className="text-xs text-[var(--fg-muted)] mt-2 tabular-nums">
        {new Date(memory.updated_at).toLocaleDateString()}
      </p>
    </Link>
  );
}
