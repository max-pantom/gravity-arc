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
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);

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

  if (loading) {
    return (
      <main className="pt-4 pl-[48px] pr-[48px]">
        <div
          className="py-6"
          style={{
            columns: "320px",
            columnGap: "12px",
            columnFill: "balance",
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="break-inside-avoid mb-3 w-full rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] animate-pulse h-32"
              aria-hidden
            />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="pt-4 pl-[48px] pr-[48px] max-w-none">
      <header className="flex items-start gap-2 mb-6">
        <div className="flex-1 min-w-0">
          <label className="sr-only" htmlFor="memory-search">
            Search memories
          </label>
          <input
            id="memory-search"
            type="search"
            value={filter.query}
            onChange={(e) =>
              setFilter((prev) => ({ ...prev, query: e.target.value }))
            }
            placeholder="Search your archive..."
            className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-5 text-2xl font-serif text-[var(--fg)] placeholder:text-[var(--fg-muted)] focus:border-[var(--border-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]"
            aria-label="Search memories"
          />
        </div>
      </header>

      <MemoryGrid
        memories={filteredMemories}
        recallScores={recallScores}
        leadingCard={
          <CaptureBar
            onCreated={() => refresh(true)}
            placeholder="Write a note, paste a link, or drop an image..."
            className="[&_textarea]:min-h-[180px] [&_textarea]:max-h-[280px]"
          />
        }
      />
    </main>
  );
}
