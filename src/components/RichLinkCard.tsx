"use client";

import Link from "next/link";
import type { MemoryUnit } from "@/lib/db/schema";
import { extractTitle } from "@/storage/indexedDbAdapter";
import { cn } from "@/lib/cn";

interface RichLinkCardProps {
  memory: MemoryUnit;
  recallScore?: number;
  className?: string;
}

function getCardWeight(recallScore: number, hasImage: boolean): "light" | "medium" | "heavy" {
  if (hasImage && recallScore > 0.4) return "heavy";
  if (recallScore > 0.25 || hasImage) return "medium";
  return "light";
}

function extractDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
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
  const domain = meta?.domain ?? (memory.type === "link" ? extractDomain(memory.content) : undefined);
  const weight = getCardWeight(recallScore, !!imageSrc);

  const shadowClass = {
    light: "shadow-[var(--card-shadow-light)]",
    medium: "shadow-[var(--card-shadow)]",
    heavy: "shadow-[var(--card-shadow-heavy)]",
  }[weight];

  const paddingClass = {
    light: "p-3",
    medium: "p-3",
    heavy: "p-4",
  }[weight];

  const isImageOnly = memory.type === "image";

  return (
    <Link
      href={`/memory/${memory.id}`}
      className={cn(
        "w-full max-w-full rounded-2xl overflow-hidden flex flex-col",
        "bg-[rgba(255,255,255,0.025)] backdrop-blur-[8px]",
        "border border-[rgba(255,255,255,0.05)]",
        shadowClass,
        "transition-all duration-[260ms] ease-out",
        "hover:shadow-[var(--card-shadow-hover)] hover:-translate-y-0.5 hover:scale-[1.01]",
        !isImageOnly && paddingClass,
        isImageOnly ? "min-h-0 p-0" : "min-h-[80px]",
        className
      )}
    >
      {imageSrc && (
        <div
          className={cn(
            "overflow-hidden bg-black/10 shrink-0",
            isImageOnly
              ? "w-full rounded-2xl"
              : "w-[calc(100%+1.5rem)] -mx-3 -mt-3 mb-2 aspect-[1.91/1] rounded-t-2xl"
          )}
        >
          <img
            src={imageSrc}
            alt=""
            className={cn(
              "block w-full",
              isImageOnly
                ? "h-auto max-h-[400px] object-contain"
                : "h-full object-cover"
            )}
            loading="lazy"
          />
        </div>
      )}

      {!isImageOnly && (
      <div className="flex items-start justify-between gap-2 flex-1 min-w-0">
        <div className="min-w-0 flex-1">
          {domain && (
            <div className="flex items-center gap-1.5 mb-1">
              {meta?.favicon && (
                <img
                  src={meta.favicon}
                  alt=""
                  className="size-4 rounded-sm shrink-0 opacity-70"
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
      </div>
      )}
    </Link>
  );
}
