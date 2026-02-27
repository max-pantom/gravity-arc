"use client";

import type { MemoryUnit } from "@/lib/db/schema";
import { MemoryGrid } from "./MemoryGrid";
import { cn } from "@/lib/cn";

interface RecallSectionProps {
  memories: MemoryUnit[];
  recallScores?: Map<string, number>;
  emptyMessage?: string;
  className?: string;
}

export function RecallSection({
  memories,
  recallScores = new Map(),
  emptyMessage = "Nothing here yet.",
  className,
}: RecallSectionProps) {
  if (memories.length === 0) {
    return (
      <p className={cn("text-sm text-[var(--fg-muted)]", className)}>
        {emptyMessage}
      </p>
    );
  }

  return (
    <MemoryGrid
      memories={memories}
      recallScores={recallScores}
      className={className}
    />
  );
}
