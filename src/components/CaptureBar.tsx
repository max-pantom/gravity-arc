"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createMemoryUnit } from "@/engine/memoryEngine";
import { cn } from "@/lib/cn";

interface CaptureBarProps {
  onCreated?: (id: string) => void;
  placeholder?: string;
  className?: string;
}

export function CaptureBar({
  onCreated,
  placeholder = "Capture a thought...",
  className,
}: CaptureBarProps) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const submit = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const memory = await createMemoryUnit(trimmed);
      setValue("");
      onCreated?.(memory.id);
      router.push(`/memory/${memory.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [value, isSubmitting, onCreated, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className={cn("w-full", className)}>
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
        aria-label="Capture new thought"
      />
    </div>
  );
}
