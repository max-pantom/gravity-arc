"use client";

import Link from "next/link";
import type { MemoryUnit } from "@/lib/db/schema";
import { extractTitle } from "@/storage/indexedDbAdapter";
import { cn } from "@/lib/cn";

const TYPE_DOT: Record<string, string> = {
  idea: "bg-amber-500/60",
  project: "bg-emerald-500/60",
  note: "bg-slate-400/50",
  design: "bg-violet-500/60",
  link: "bg-blue-500/60",
  image: "bg-rose-500/60",
  experiment: "bg-cyan-500/60",
};

interface RichLinkCardProps {
  memory: MemoryUnit;
  recallScore?: number;
  className?: string;
}

export function RichLinkCard({
  memory,
  recallScore = 0,
  className,
}: RichLinkCardProps) {
  const meta = memory.metadata;
  const imageSrc =
    memory.type === "image"
      ? memory.content
      : meta?.image;
  const title = meta?.title ?? extractTitle(memory.content);
  const domain = meta?.domain;
  const dotColor = TYPE_DOT[memory.type ?? "note"] ?? "bg-slate-400/40";

  return (
    <Link
      href={`/memory/${memory.id}`}
      className={cn(
        "block rounded-2xl overflow-hidden flex flex-col",
        "bg-[var(--bg-elevated)] backdrop-blur-sm",
        "border border-[var(--border)]",
        "shadow-[var(--card-shadow)]",
        "transition-all duration-150 ease-out",
        "hover:shadow-[var(--card-shadow-hover)] hover:-translate-y-0.5 hover:scale-[1.01]",
        "p-4 min-h-[120px]",
        className
      )}
    >
      {imageSrc && (
        <div className="w-full -mx-4 -mt-4 mb-3 rounded-t-2xl overflow-hidden bg-black/20">
          <img
            src={imageSrc}
            alt=""
            className="w-full h-36 object-cover"
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
                  className="size-4 rounded-sm shrink-0 opacity-80"
                />
              )}
              <span className="text-xs text-[var(--fg-muted)] truncate">
                {domain}
              </span>
            </div>
          )}
          <p className="text-[var(--fg)] text-pretty line-clamp-2 font-medium tracking-tight">
            {title}
          </p>
          {meta?.description && (
            <p className="text-xs text-[var(--fg-muted)] line-clamp-2 mt-0.5 leading-relaxed">
              {meta.description}
            </p>
          )}
        </div>
        <span
          className={cn("size-1.5 rounded-full shrink-0 mt-1.5", dotColor)}
          aria-hidden
        />
      </div>

      <div className="flex items-center justify-end mt-3">
        <span className="text-xs text-[var(--fg-muted)] tabular-nums">
          {new Date(memory.updated_at).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );
}
