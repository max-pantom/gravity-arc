"use client";

import Link from "next/link";
import type { Cluster } from "@/engine/clustering";
import type { MemoryUnit } from "@/lib/db/schema";
import { extractTitle } from "@/storage/indexedDbAdapter";
import { cn } from "@/lib/cn";

interface ClusterViewProps {
  cluster: Cluster;
  memoriesById: Map<string, MemoryUnit>;
  className?: string;
}

export function ClusterView({ cluster, memoriesById, className }: ClusterViewProps) {
  const items = cluster.memoryIds
    .map((id) => memoriesById.get(id))
    .filter((m): m is MemoryUnit => m != null);

  if (items.length === 0) return null;

  return (
    <section className={cn("", className)}>
      <h2 className="text-sm font-medium text-[var(--fg-muted)] mb-3">
        {cluster.label}
      </h2>
      <div className="flex flex-wrap gap-2">
        {items.map((memory) => (
          <Link
            key={memory.id}
            href={`/memory/${memory.id}`}
            className={cn(
              "inline-flex items-center rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] backdrop-blur-sm px-3 py-2 text-sm",
              "hover:-translate-y-0.5 transition-all duration-150"
            )}
          >
            {extractTitle(memory.content)}
          </Link>
        ))}
      </div>
    </section>
  );
}
