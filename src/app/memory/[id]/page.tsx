"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getMemory,
  updateMemory,
  recordEvent,
  getConnectionsForMemory,
  extractTitle,
} from "@/storage/indexedDbAdapter";
import type { MemoryUnit, MemoryType } from "@/lib/db/schema";
import { MemoryEditor } from "@/components/MemoryEditor";
import { WikiLinkContent } from "@/components/WikiLinkContent";
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

const MEMORY_TYPES: MemoryType[] = [
  "idea",
  "project",
  "note",
  "design",
  "experiment",
  "link",
  "image",
];

export default function MemoryPage() {
  const params = useParams();
  const id = params.id as string;
  const [memory, setMemory] = useState<MemoryUnit | null>(null);
  const [content, setContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [related, setRelated] = useState<MemoryUnit[]>([]);

  const loadMemory = useCallback(async () => {
    const m = await getMemory(id);
    if (m) {
      setMemory(m);
      setContent(m.content);
      await recordEvent(id, "view");
    }
  }, [id]);

  const loadRelated = useCallback(async () => {
    const conns = await getConnectionsForMemory(id);
    const relatedIds = new Set<string>();
    for (const c of conns) {
      relatedIds.add(c.from === id ? c.to : c.from);
    }
    if (relatedIds.size === 0) {
      setRelated([]);
      return;
    }
    const mems = await Promise.all(
      Array.from(relatedIds).map((rid) => getMemory(rid))
    );
    setRelated(mems.filter((m): m is MemoryUnit => m != null));
  }, [id]);

  useEffect(() => {
    loadMemory();
  }, [loadMemory]);

  useEffect(() => {
    if (memory) loadRelated();
  }, [memory, loadRelated]);

  const handleSave = useCallback(
    async (updates?: { content?: string; type?: MemoryType }) => {
      if (!memory || isSaving) return;
      setIsSaving(true);
      try {
        const updated = await updateMemory(id, {
          content: updates?.content ?? content,
          type: updates?.type,
        });
        if (updated) {
          setMemory(updated);
          setContent(updated.content);
          await recordEvent(id, "edit");
          loadRelated();
        }
      } finally {
        setIsSaving(false);
      }
    },
    [memory, content, id, isSaving, loadRelated]
  );

  if (!memory) {
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
                  {MEMORY_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => handleSave({ type: t })}
                      className={cn(
                        "px-2 py-0.5 text-xs rounded",
                        memory.type === t
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
                  {TYPE_LABELS[memory.type ?? "note"] ?? "Note"}
                </span>
              )}
            </div>
            {!isEditing && memory.type === "link" && memory.metadata?.image && (
              <div className="px-4 pb-3">
                <a
                  href={content.startsWith("http") ? content : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg overflow-hidden border border-[var(--border)]"
                >
                  <img
                    src={memory.metadata.image}
                    alt=""
                    className="w-full max-h-64 object-cover"
                  />
                </a>
              </div>
            )}
            {!isEditing && memory.type === "image" && content.startsWith("data:image") && (
              <div className="px-4 pb-3">
                <img
                  src={content}
                  alt=""
                  className="max-w-full max-h-[60dvh] object-contain rounded-lg"
                />
              </div>
            )}
            {isEditing ? (
              <MemoryEditor
                value={content}
                onChange={setContent}
                onSave={(c) => handleSave({ content: c })}
                sourceMemoryId={id}
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
                    href={`/memory/${r.id}`}
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
