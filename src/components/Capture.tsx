"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createCard } from "@/lib/db";
import type { CardType } from "@/lib/db/schema";
import { cn } from "@/lib/cn";

const CARD_TYPES: { id: CardType; label: string }[] = [
  { id: "idea", label: "Idea" },
  { id: "project", label: "Project" },
  { id: "note", label: "Note" },
  { id: "design", label: "Design" },
  { id: "experiment", label: "Experiment" },
  { id: "link", label: "Link" },
];

interface CaptureProps {
  onCardCreated?: (id: string) => void;
  placeholder?: string;
  className?: string;
}

export function Capture({
  onCardCreated,
  placeholder = "Capture an idea...",
  className,
}: CaptureProps) {
  const [value, setValue] = useState("");
  const [type, setType] = useState<CardType>("idea");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const submit = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const card = await createCard(trimmed, type);
      setValue("");
      onCardCreated?.(card.id);
      router.push(`/card/${card.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [value, type, isSubmitting, onCardCreated, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className={cn("w-full space-y-2", className)}>
      <div className="flex flex-wrap gap-1">
        {CARD_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={cn(
              "px-2 py-1 text-xs rounded-md transition-colors",
              type === t.id
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)]"
            )}
            aria-label={`Select ${t.label} type`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isSubmitting}
        rows={1}
        className={cn(
          "w-full resize-none rounded-lg border bg-[var(--bg-elevated)] px-4 py-3 text-[var(--fg)] placeholder:text-[var(--fg-muted)]",
          "border-[var(--border)] focus:border-[var(--border-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]",
          "min-h-[48px] max-h-[120px]"
        )}
        aria-label="Capture new idea"
      />
    </div>
  );
}
