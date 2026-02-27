"use client";

import { useState, useMemo } from "react";
import { CaptureBar } from "@/components/CaptureBar";
import { RecallSection } from "@/components/RecallSection";
import { ClusterView } from "@/components/ClusterView";
import { MemoryGrid, type Density } from "@/components/MemoryGrid";
import { DensitySlider } from "@/components/DensitySlider";
import {
  FastFilter,
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

export default function Home() {
  const { state, loading, refresh } = useMemoryEngine();
  const [density, setDensity] = useState<Density>("medium");
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);

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
      <div className="min-h-dvh flex flex-col">
        <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3">
          <h1 className="text-lg font-medium text-[var(--fg)]">Archive</h1>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
          <div className="space-y-6 py-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] animate-pulse h-24"
                aria-hidden
              />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-lg font-medium text-[var(--fg)]">Archive</h1>
          <DensitySlider value={density} onChange={setDensity} />
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        <CaptureBar onCreated={refresh} />

        {!isEmpty && (
          <FastFilter
            filter={filter}
            onChange={setFilter}
            domains={domains}
          />
        )}

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[var(--fg-muted)] text-pretty mb-2">
              Paste a link, image, or type a thought.
            </p>
            <p className="text-sm text-[var(--fg-muted)]">
              Archive surfaces what you forgot but needed.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {filteredNow.length > 0 && (
              <RecallSection
                title="Now"
                memories={filteredNow}
                recallScores={recallScores}
                density={density}
                emptyMessage="Nothing recent."
              />
            )}

            {filteredResurfacing.length > 0 && (
              <RecallSection
                title="Resurfacing"
                memories={filteredResurfacing}
                recallScores={recallScores}
                density={density}
                emptyMessage="Dormant ideas gaining weight."
              />
            )}

            {clusters.map((cluster) => (
              <ClusterView
                key={cluster.id}
                cluster={cluster}
                memoriesById={memoriesById}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
