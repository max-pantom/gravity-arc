"use client";

import type { MemoryUnit } from "@/lib/db/schema";
import { RichLinkCard } from "./RichLinkCard";
import { cn } from "@/lib/cn";

interface MemoryGridProps {
  memories: MemoryUnit[];
  recallScores?: Map<string, number>;
  className?: string;
}

export function MemoryGrid({
  memories,
  recallScores = new Map(),
  className,
}: MemoryGridProps) {
  return (
    <div
      className={cn("", className)}
      style={{
        columns: "320px",
        columnGap: "20px",
        columnFill: "balance" as const,
      }}
    >
      {memories.map((memory) => (
        <div key={memory.id} className="break-inside-avoid mb-5">
          <RichLinkCard
            memory={memory}
            recallScore={recallScores.get(memory.id)}
          />
        </div>
      ))}
    </div>
  );
}
