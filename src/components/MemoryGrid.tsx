"use client";

import type { MemoryUnit } from "@/lib/db/schema";
import type { ReactNode } from "react";
import { RichLinkCard } from "./RichLinkCard";
import { cn } from "@/lib/cn";

interface MemoryGridProps {
  memories: MemoryUnit[];
  recallScores?: Map<string, number>;
  className?: string;
  leadingCard?: ReactNode;
}

export function MemoryGrid({
  memories,
  recallScores = new Map(),
  className,
  leadingCard,
}: MemoryGridProps) {
  return (
    <div
      className={cn("group/cards", className)}
      style={{
        columns: "320px",
        columnGap: "12px",
        columnFill: "balance" as const,
      }}
    >
      {leadingCard ? (
        <div className="break-inside-avoid mb-3 w-full">
          {leadingCard}
        </div>
      ) : null}
      {memories.map((memory) => (
        <div
          key={memory.id}
          className="break-inside-avoid mb-3 w-full"
        >
          <RichLinkCard
            memory={memory}
            recallScore={recallScores.get(memory.id)}
          />
        </div>
      ))}
    </div>
  );
}
