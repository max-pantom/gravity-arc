"use client";

import { CaptureBar } from "@/components/CaptureBar";
import { RecallSection } from "@/components/RecallSection";
import { ClusterView } from "@/components/ClusterView";
import { useMemoryEngine } from "@/hooks/useMemoryEngine";
import { cn } from "@/lib/cn";

export default function Home() {
  const { state, loading, refresh } = useMemoryEngine();

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col">
        <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3">
          <h1 className="text-lg font-medium text-[var(--fg)]">Archive</h1>
        </header>
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
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

  const nowMemories = state?.now.memories ?? [];
  const resurfacingMemories = state?.resurfacing.memories ?? [];
  const clusters = state?.clusters.clusters ?? [];
  const recallScores = state?.recallScores ?? new Map();
  const memoriesById = state?.memoriesById ?? new Map();

  const isEmpty = nowMemories.length === 0 && resurfacingMemories.length === 0 && clusters.length === 0;

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3">
        <h1 className="text-lg font-medium text-[var(--fg)]">Archive</h1>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-8">
        <CaptureBar onCreated={refresh} />

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-[var(--fg-muted)] text-pretty mb-2">
              Type a thought and press Enter.
            </p>
            <p className="text-sm text-[var(--fg-muted)]">
              Archive surfaces what you forgot but needed.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {nowMemories.length > 0 && (
              <RecallSection
                title="Now"
                memories={nowMemories}
                recallScores={recallScores}
                emptyMessage="Nothing recent."
              />
            )}

            {resurfacingMemories.length > 0 && (
              <RecallSection
                title="Resurfacing"
                memories={resurfacingMemories}
                recallScores={recallScores}
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
