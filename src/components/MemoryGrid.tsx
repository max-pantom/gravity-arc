"use client";

import type { MemoryUnit } from "@/lib/db/schema";
import { RichLinkCard } from "./RichLinkCard";
import { cn } from "@/lib/cn";

export type Density = "sparse" | "medium" | "dense";

interface MemoryGridProps {
  memories: MemoryUnit[];
  recallScores?: Map<string, number>;
  density?: Density;
  className?: string;
}

export function MemoryGrid({
  memories,
  recallScores = new Map(),
  density = "medium",
  className,
}: MemoryGridProps) {
  const columns = { sparse: 2, medium: 3, dense: 4 }[density];

  return (
    <div
      className={cn("gap-4", className)}
      style={{
        columnCount: columns,
        columnFill: "balance" as const,
      }}
    >
      {memories.map((memory) => (
        <div key={memory.id} className="break-inside-avoid mb-4">
          <RichLinkCard
            memory={memory}
            recallScore={recallScores.get(memory.id)}
            density={density}
          />
        </div>
      ))}
    </div>
  );
}
