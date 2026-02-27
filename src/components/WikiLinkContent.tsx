"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { parseWikiLinks } from "@/lib/parseLinks";
import { getCard } from "@/lib/db";
import { cn } from "@/lib/cn";

interface WikiLinkContentProps {
  content: string;
  onLinkClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export function WikiLinkContent({
  content,
  onLinkClick,
  className,
}: WikiLinkContentProps) {
  const parts = parseWikiLinks(content);
  const [linkTitles, setLinkTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    const ids = parts
      .filter(
        (p): p is { type: "link"; content: string; cardId?: string } =>
          p.type === "link" && p.cardId != null
      )
      .map((p) => p.cardId!);

    if (ids.length === 0) return;

    Promise.all(ids.map((id) => getCard(id))).then((cards) => {
      const map: Record<string, string> = {};
      cards.forEach((card, i) => {
        if (card && ids[i]) {
          map[ids[i]] = card.content.split("\n")[0]?.slice(0, 80) || "Untitled";
        }
      });
      setLinkTitles(map);
    });
  }, [content]);

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {parts.map((part, i) =>
        part.type === "link" && part.cardId ? (
          <Link
            key={i}
            href={`/card/${part.cardId}`}
            onClick={onLinkClick}
            className="text-[var(--accent)] hover:underline"
          >
            {linkTitles[part.cardId] ?? part.cardId.slice(0, 8) + "…"}
          </Link>
        ) : (
          <span key={i}>{part.content}</span>
        )
      )}
    </span>
  );
}
