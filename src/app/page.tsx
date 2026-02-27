"use client";

import { useState, useMemo } from "react";
import { CaptureBar } from "@/components/CaptureBar";
import { MemoryGrid } from "@/components/MemoryGrid";
import { SearchOverlay } from "@/components/SearchOverlay";
import {
  applyFilter,
  type FilterState,
} from "@/components/FastFilter";
import { useMemoryEngine } from "@/hooks/useMemoryEngine";

const DEFAULT_FILTER: FilterState = {
  query: "",
  type: "",
  domain: "",
  status: "",
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export default function Home() {
  const { state, loading, refresh } = useMemoryEngine();
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);
  const [searchOpen, setSearchOpen] = useState(false);

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

  const domains = useMemo(() => {
    const set = new Set<string>();
    for (const m of allMemories) {
      if (m.metadata?.domain) set.add(m.metadata.domain);
    }
    return Array.from(set).sort();
  }, [allMemories]);

  const filteredMemories = useMemo(
    () => applyFilter(allMemories, filter),
    [allMemories, filter]
  );

  const isEmpty = allMemories.length === 0;

  if (loading) {
    return (
      <main className="pt-12 pl-[72px] pr-[72px]">
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
              className="break-inside-avoid mb-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] animate-pulse h-32 max-w-[360px]"
              aria-hidden
            />
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="pt-12 pl-[72px] pr-[72px] max-w-none">
      <header className="flex items-start gap-3 mb-20">
        <div className="flex-1 min-w-0">
          <CaptureBar onCreated={() => refresh(true)} />
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="p-2.5 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-elevated)] transition-all duration-[220ms] ease-out shrink-0"
          aria-label="Search"
        >
          <SearchIcon className="size-[18px]" />
        </button>
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

      <SearchOverlay
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        filter={filter}
        onChange={setFilter}
        domains={domains}
      />
    </main>
  );
}
