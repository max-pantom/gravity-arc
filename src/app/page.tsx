"use client";

import { useState, useMemo } from "react";
import { CaptureBar } from "@/components/CaptureBar";
import { RecallSection } from "@/components/RecallSection";
import { ClusterView } from "@/components/ClusterView";
import { SearchOverlay } from "@/components/SearchOverlay";
import {
  applyFilter,
  type FilterState,
} from "@/components/FastFilter";
import { useMemoryEngine } from "@/hooks/useMemoryEngine";
import { cn } from "@/lib/cn";

const DEFAULT_FILTER: FilterState = {
  query: "",
  type: "",
  domain: "",
  status: "",
};

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
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
  const clusters = state?.clusters.clusters ?? [];
  const recallScores = state?.recallScores ?? new Map();
  const memoriesById = state?.memoriesById ?? new Map();

  const allMemories = useMemo(
    () => [...nowMemories, ...resurfacingMemories],
    [nowMemories, resurfacingMemories]
  );

  const domains = useMemo(() => {
    const set = new Set<string>();
    for (const m of allMemories) {
      if (m.metadata?.domain) set.add(m.metadata.domain);
    }
    return Array.from(set).sort();
  }, [allMemories]);

  const filteredNow = useMemo(
    () => applyFilter(nowMemories, filter),
    [nowMemories, filter]
  );
  const filteredResurfacing = useMemo(
    () => applyFilter(resurfacingMemories, filter),
    [resurfacingMemories, filter]
  );

  const isEmpty =
    nowMemories.length === 0 &&
    resurfacingMemories.length === 0 &&
    clusters.length === 0;

  if (loading) {
    return (
      <main className="pt-16 px-10">
          <div className="max-w-[1600px]">
            <div className="space-y-6 py-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] animate-pulse h-32"
                  aria-hidden
                />
              ))}
            </div>
          </div>
      </main>
    );
  }

  return (
    <main className="pt-16 px-10">
        <div className="max-w-[1600px]">
          <header className="flex items-center gap-6 mb-12">
            <div className="flex-1 max-w-2xl">
              <CaptureBar onCreated={refresh} />
            </div>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="p-2.5 rounded-xl text-[var(--fg-muted)] hover:text-[var(--fg)] hover:bg-[var(--bg-elevated)] transition-colors"
              aria-label="Search"
            >
              <SearchIcon className="size-5" />
            </button>
          </header>

          {isEmpty ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-[var(--fg-muted)] text-pretty text-lg tracking-tight mb-2">
                Paste a link, image, or type a thought.
              </p>
              <p className="text-sm text-[var(--fg-muted)]">
                Archive surfaces what you forgot but needed.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-12">
              <RecallSection
                memories={filteredNow}
                recallScores={recallScores}
                emptyMessage="Nothing recent."
              />
              <RecallSection
                memories={filteredResurfacing}
                recallScores={recallScores}
                emptyMessage=""
              />
              {clusters.map((cluster) => (
                <ClusterView
                  key={cluster.id}
                  cluster={cluster}
                  memoriesById={memoriesById}
                />
              ))}
            </div>
          )}
      </div>

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
