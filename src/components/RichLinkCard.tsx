"use client";

import Link from "next/link";
import type { MemoryUnit, MemoryMetadata } from "@/lib/db/schema";
import { extractTitle } from "@/storage/indexedDbAdapter";
import { cn } from "@/lib/cn";

const TYPE_LABELS: Record<string, string> = {
  idea: "Idea",
  project: "Project",
  note: "Note",
  design: "Design",
  experiment: "Experiment",
  link: "Link",
  image: "Image",
};

interface RichLinkCardProps {
  memory: MemoryUnit;
  recallScore?: number;
  density?: "sparse" | "medium" | "dense";
  className?: string;
}

export function RichLinkCard({
  memory,
  recallScore = 0,
  density = "medium",
  className,
}: RichLinkCardProps) {
  const meta = memory.metadata;
  const imageSrc =
    memory.type === "image"
      ? memory.content
      : meta?.image;
  const title = meta?.title ?? extractTitle(memory.content);
  const domain = meta?.domain;

  const densityClasses = {
    sparse: "p-5 min-h-[140px]",
    medium: "p-4 min-h-[120px]",
    dense: "p-3 min-h-[100px]",
  };

  return (
    <Link
      href={`/memory/${memory.id}`}
      className={cn(
        "block rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden",
        "hover:border-[var(--accent-muted)] transition-colors flex flex-col",
        densityClasses[density],
        className
      )}
    >
      {imageSrc && (
        <div
          className={cn(
            "w-full -mx-4 -mt-4 mb-3 rounded-t-xl overflow-hidden bg-[var(--bg)]",
            density === "dense" ? "h-28" : density === "medium" ? "h-36" : "h-44"
          )}
        >
          <img
            src={imageSrc}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="flex items-start justify-between gap-2 flex-1 min-w-0">
        <div className="min-w-0 flex-1">
          {domain && (
            <div className="flex items-center gap-1.5 mb-1">
              {meta?.favicon && (
                <img
                  src={meta.favicon}
                  alt=""
                  className="size-4 rounded-sm shrink-0"
                />
              )}
              <span className="text-xs text-[var(--fg-muted)] truncate">
                {domain}
              </span>
            </div>
          )}
          <p className="text-[var(--fg)] text-pretty line-clamp-2 font-medium">
            {title}
          </p>
          {meta?.description && density !== "dense" && (
            <p className="text-xs text-[var(--fg-muted)] line-clamp-2 mt-0.5">
              {meta.description}
            </p>
          )}
        </div>
        {recallScore > 0 && (
          <span
            className="size-2 rounded-full bg-[var(--accent)] shrink-0 mt-1"
            style={{ opacity: 0.3 + recallScore * 0.5 }}
            aria-hidden
          />
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wide">
          {TYPE_LABELS[memory.type ?? "note"] ?? "Note"}
        </span>
        <span className="text-xs text-[var(--fg-muted)] tabular-nums">
          {new Date(memory.updated_at).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );
}
