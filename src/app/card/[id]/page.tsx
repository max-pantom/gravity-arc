"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getCard,
  updateCard,
  recordVisit,
  getRelatedCards,
  extractTitle,
} from "@/lib/db";
import type { Card, CardType } from "@/lib/db/schema";
import { CardEditor } from "@/components/CardEditor";
import { WikiLinkContent } from "@/components/WikiLinkContent";
import { cn } from "@/lib/cn";

const TYPE_LABELS: Record<string, string> = {
  idea: "Idea",
  project: "Project",
  note: "Note",
  design: "Design",
  experiment: "Experiment",
  link: "Link",
};

const CARD_TYPES: CardType[] = [
  "idea",
  "project",
  "note",
  "design",
  "experiment",
  "link",
];

export default function CardPage() {
  const params = useParams();
  const id = params.id as string;
  const [card, setCard] = useState<Card | null>(null);
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [related, setRelated] = useState<Card[]>([]);

  const loadCard = useCallback(async () => {
    const c = await getCard(id);
    if (c) {
      setCard(c);
      setContent(c.content);
      await recordVisit(id);
    }
  }, [id]);

  const loadRelated = useCallback(async () => {
    const r = await getRelatedCards(id);
    setRelated(r);
  }, [id]);

  useEffect(() => {
    loadCard();
  }, [loadCard]);

  useEffect(() => {
    if (card) loadRelated();
  }, [card, loadRelated]);

  const handleSave = useCallback(
    async (updates?: { content?: string; type?: CardType }) => {
      if (!card || isSaving) return;
      setIsSaving(true);
      try {
        const updated = await updateCard(id, {
          content: updates?.content ?? content,
          type: updates?.type,
        });
        if (updated) {
          setCard(updated);
          setContent(updated.content);
          loadRelated();
        }
      } finally {
        setIsSaving(false);
      }
    },
    [card, content, id, isSaving, loadRelated]
  );

  if (!card) {
    return (
      <div className="min-h-dvh flex flex-col">
        <header className="border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3">
          <Link
            href="/"
            className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-sm"
          >
            ← Archive
          </Link>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <p className="text-[var(--fg-muted)]">Loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-sm"
          aria-label="Back to Archive"
        >
          ← Archive
        </Link>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        <div className="flex flex-col gap-6">
          <div
            className={cn(
              "rounded-lg bg-[var(--bg-elevated)]",
              "focus-within:ring-1 focus-within:ring-[var(--border-focus)]"
            )}
          >
            <div className="px-4 pt-3 pb-1 flex items-center gap-2">
              {isEditing ? (
                <div className="flex gap-1">
                  {CARD_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleSave({ type: t })}
                      className={cn(
                        "px-2 py-0.5 text-xs rounded",
                        card.type === t
                          ? "bg-[var(--accent)] text-white"
                          : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                      )}
                    >
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wide">
                  {TYPE_LABELS[card.type ?? "note"] ?? "Note"}
                </span>
              )}
            </div>
            {isEditing ? (
              <CardEditor
                value={content}
                onChange={setContent}
                onSave={(c) => handleSave({ content: c })}
                sourceCardId={id}
                disabled={isSaving}
              />
            ) : (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsEditing(true)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditing(true)}
                className="px-4 py-3 min-h-[200px] cursor-text text-[var(--fg)] text-pretty whitespace-pre-wrap"
              >
                {content ? (
                  <WikiLinkContent
                    content={content}
                    onLinkClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="text-[var(--fg-muted)]">Click to edit</span>
                )}
              </div>
            )}
          </div>

          {related.length > 0 && (
            <section className="border-t border-[var(--border)] pt-6">
              <h2 className="text-sm font-medium text-[var(--fg-muted)] mb-3">
                Related
              </h2>
              <div className="flex flex-col gap-2">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/card/${r.id}`}
                    className={cn(
                      "block rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3",
                      "hover:border-[var(--accent-muted)] transition-colors"
                    )}
                  >
                    <p className="text-[var(--fg)] text-pretty line-clamp-2">
                      {extractTitle(r.content)}
                    </p>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
