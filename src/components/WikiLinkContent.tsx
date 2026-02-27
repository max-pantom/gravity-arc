"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { parseWikiLinks } from "@/lib/parseLinks";
import { getMemory } from "@/storage/indexedDbAdapter";
import { extractTitle } from "@/storage/indexedDbAdapter";
import { cn } from "@/lib/cn";

interface WikiLinkContentProps {
  content: string;
  onLinkClick?: (e: React.MouseEvent) => void;
  showHoverPreview?: boolean;
  className?: string;
}

export function WikiLinkContent({
  content,
  onLinkClick,
  showHoverPreview = true,
  className,
}: WikiLinkContentProps) {
  const parts = parseWikiLinks(content);
  const [linkTitles, setLinkTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    const ids = parts
      .filter(
        (p): p is { type: "link"; content: string; memoryId?: string } =>
          p.type === "link" && p.memoryId != null
      )
      .map((p) => p.memoryId!);

    if (ids.length === 0) return;

    Promise.all(ids.map((id) => getMemory(id))).then((memories) => {
      const map: Record<string, string> = {};
      memories.forEach((mem, i) => {
        if (mem && ids[i]) {
          map[ids[i]] = extractTitle(mem.content);
        }
      });
      setLinkTitles(map);
    });
  }, [content]);

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {parts.map((part, i) =>
        part.type === "link" && part.memoryId ? (
          <LinkWithPreview
            key={i}
            memoryId={part.memoryId}
            displayText={linkTitles[part.memoryId] ?? part.memoryId.slice(0, 8) + "…"}
            onLinkClick={onLinkClick}
            showHoverPreview={showHoverPreview}
          />
        ) : (
          <span key={i}>{part.content}</span>
        )
      )}
    </span>
  );
}

export function LinkWithPreview({
  memoryId,
  displayText,
  onLinkClick,
  showHoverPreview,
}: {
  memoryId: string;
  displayText: string;
  onLinkClick?: (e: React.MouseEvent) => void;
  showHoverPreview?: boolean;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    if (!showHoverPreview || !hovering) return;
    getMemory(memoryId).then((mem) => {
      if (mem) setPreview(extractTitle(mem.content));
    });
  }, [memoryId, hovering, showHoverPreview]);

  return (
    <span className="relative inline">
      <Link
        href={`/memory/${memoryId}`}
        onClick={onLinkClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => {
          setHovering(false);
          setPreview(null);
        }}
        className="text-[var(--accent)] hover:underline"
      >
        {displayText}
      </Link>
      {hovering && preview && (
        <span
          className={cn(
            "absolute left-0 top-full mt-1 z-[var(--z-dropdown)]",
            "px-2 py-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] shadow-lg",
            "text-xs text-[var(--fg)] max-w-[200px] line-clamp-2"
          )}
        >
          {preview}
        </span>
      )}
    </span>
  );
}
