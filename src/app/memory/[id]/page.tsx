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
      <main className="pt-16 px-10 flex items-center justify-center min-h-[60dvh]">
        <p className="text-[var(--fg-muted)]">Loading...</p>
      </main>
    );
  }

  return (
    <main className="pt-16 px-10">
      <div className="max-w-[1600px]">
        <Link
          href="/"
          className="inline-block text-[var(--fg-muted)] hover:text-[var(--fg)] text-sm mb-8 transition-colors"
          aria-label="Back to Archive"
        >
          ← Back
        </Link>

        <div className="max-w-2xl">
          <div className="flex flex-col gap-8">
          <div
            className={cn(
              "rounded-2xl bg-[var(--bg-elevated)] backdrop-blur-sm border border-[var(--border)]",
              "focus-within:ring-1 focus-within:ring-[var(--border-focus)]"
            )}
          >
            {isEditing && (
              <div className="px-5 pt-4 pb-2 flex flex-wrap gap-1">
                {MEMORY_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleSave({ type: t })}
                    className={cn(
                      "px-2.5 py-1 text-xs rounded-lg transition-colors",
                      memory.type === t
                        ? "bg-[var(--accent)] text-white"
                        : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
                    )}
                  >
                    {TYPE_LABELS[t]}
                  </button>
                ))}
              </div>
            )}
            {!isEditing && memory.type === "link" && memory.metadata?.image && (
              <div className="px-5 pb-4">
                <a
                  href={content.startsWith("http") ? content : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-xl overflow-hidden border border-[var(--border)]"
                >
                  <img
                    src={memory.metadata.image}
                    alt=""
                    className="w-full max-h-72 object-cover"
                  />
                </a>
              </div>
            )}
            {!isEditing && memory.type === "image" && (content.startsWith("data:image") || content.startsWith("http")) && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsEditing(true)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditing(true)}
                className="px-5 pb-4 cursor-text"
              >
                <img
                  src={content}
                  alt=""
                  className="max-w-full max-h-[60dvh] object-contain rounded-xl"
                />
              </div>
            )}
            {isEditing ? (
              <div className="px-5 pb-4">
                <MemoryEditor
                  value={content}
                  onChange={setContent}
                  onSave={(c) => handleSave({ content: c })}
                  sourceMemoryId={id}
                  disabled={isSaving}
                />
              </div>
            ) : memory.type !== "image" && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setIsEditing(true)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditing(true)}
                className="px-5 py-4 min-h-[200px] cursor-text text-[var(--fg)] text-pretty whitespace-pre-wrap leading-relaxed"
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
            <section className="pt-8">
              <h2 className="text-xs font-medium text-[var(--fg-muted)] uppercase tracking-wide mb-3">
                Related
              </h2>
              <div className="flex flex-col gap-2">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/memory/${r.id}`}
                    className={cn(
                      "block rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] backdrop-blur-sm px-4 py-3",
                      "hover:-translate-y-0.5 transition-all duration-150"
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
        </div>
      </div>
    </main>
  );
}
