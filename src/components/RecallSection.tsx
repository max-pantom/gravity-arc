"use client";

import type { MemoryUnit } from "@/lib/db/schema";
import { MemoryGrid, type Density } from "./MemoryGrid";
import { cn } from "@/lib/cn";

interface RecallSectionProps {
  title: string;
  memories: MemoryUnit[];
  recallScores?: Map<string, number>;
  density?: Density;
  emptyMessage?: string;
  className?: string;
}

export function RecallSection({
  title,
  memories,
  recallScores = new Map(),
  density = "medium",
  emptyMessage = "Nothing here yet.",
  className,
}: RecallSectionProps) {
  if (memories.length === 0) {
    return (
      <section className={cn("", className)}>
        <h2 className="text-sm font-medium text-[var(--fg-muted)] mb-3">{title}</h2>
        <p className="text-sm text-[var(--fg-muted)]">{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className={cn("", className)}>
      <h2 className="text-sm font-medium text-[var(--fg-muted)] mb-3">{title}</h2>
      <MemoryGrid
        memories={memories}
        recallScores={recallScores}
        density={density}
      />
    </section>
  );
}
