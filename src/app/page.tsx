"use client";

import { useState, useMemo } from "react";
import { CaptureBar } from "@/components/CaptureBar";
import { MemoryGrid } from "@/components/MemoryGrid";
import { applyFilter, type FilterState } from "@/components/FastFilter";
import { useMemoryEngine } from "@/hooks/useMemoryEngine";

const DEFAULT_FILTER: FilterState = {
  query: "",
  type: "",
  domain: "",
  status: "",
};

export default function Home() {
  const { state, loading, refresh } = useMemoryEngine();
  const [filter] = useState<FilterState>(DEFAULT_FILTER);

  const nowMemories = state?.now.memories ?? [];
  const resurfacingMemories = state?.resurfacing.memories ?? [];
  const recallScores = state?.recallScores ?? new Map();

  const allMemories = useMemo(() => {
    const seen = new Set<string>();
    const out: typeof nowMemories = [];
    for (const m of [...nowMemories, ...resurfacingMemories]) {
      if (!seen.has(m.id)) {
        seen.add(m.id);
        out.push(m);
      }
    }
    return out;
  }, [nowMemories, resurfacingMemories]);

  const filteredMemories = useMemo(
    () => applyFilter(allMemories, filter),
    [allMemories, filter]
  );

  const isEmpty = allMemories.length === 0;

  if (loading) {
    return (
      <main className="pt-6 pl-[72px] pr-[72px]">
        <div
          className="py-12"
          style={{
            columns: "320px",
            columnGap: "20px",
            columnFill: "balance",
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="break-inside-avoid mb-4 w-full rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] animate-pulse h-32"
              aria-hidden
            />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="pt-6 pl-[72px] pr-[72px] max-w-none">
      <header className="flex items-start gap-3 mb-12">
        <div className="flex-1 min-w-0">
          <CaptureBar onCreated={() => refresh(true)} />
        </div>
      </header>

      {isEmpty ? (
        <div className="flex flex-col items-start justify-center py-40">
          <p className="text-[var(--fg-muted)] text-pretty text-lg tracking-tight mb-2">
            Drop a thought into the arc.
          </p>
          <p className="text-sm text-[var(--fg-muted)]">
            Paste a link, image, or type. Thoughts drift downward.
          </p>
        </div>
      ) : (
        <MemoryGrid
          memories={filteredMemories}
          recallScores={recallScores}
        />
      )}
    </main>
  );
}
