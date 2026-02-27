"use client";

import type { MemoryUnit } from "@/lib/db/schema";
import { MemoryCard } from "./MemoryCard";
import { cn } from "@/lib/cn";

interface RecallSectionProps {
  title: string;
  memories: MemoryUnit[];
  recallScores?: Map<string, number>;
  emptyMessage?: string;
  className?: string;
}

export function RecallSection({
  title,
  memories,
  recallScores = new Map(),
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {memories.map((memory) => (
          <MemoryCard
            key={memory.id}
            memory={memory}
            recallScore={recallScores.get(memory.id)}
          />
        ))}
      </div>
    </section>
  );
}
