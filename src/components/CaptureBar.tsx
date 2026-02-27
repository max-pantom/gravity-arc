"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createMemoryUnit } from "@/engine/memoryEngine";
import { createMemory } from "@/storage/indexedDbAdapter";
import { cn } from "@/lib/cn";

interface CaptureBarProps {
  onCreated?: (id: string) => void;
  placeholder?: string;
  className?: string;
}

const URL_REGEX = /https?:\/\/[^\s]+/gi;

async function fetchOG(url: string): Promise<{
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  domain?: string;
} | null> {
  try {
    const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function extractUrl(text: string): string | null {
  const m = text.match(URL_REGEX);
  return m?.[0]?.trim() ?? null;
}

export function CaptureBar({
  onCreated,
  placeholder = "Paste link, image, or type a thought...",
  className,
}: CaptureBarProps) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingOG, setIsFetchingOG] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(
    async (content: string, type?: "link" | "image" | "idea" | "note") => {
      const trimmed = content.trim();
      if (!trimmed || isSubmitting) return;

      setIsSubmitting(true);
      try {
        let memory;

        if (type === "link") {
          const url = extractUrl(trimmed);
          if (url) {
            setIsFetchingOG(true);
            const meta = await fetchOG(url);
            setIsFetchingOG(false);
            memory = await createMemory(trimmed, "link", undefined, meta ?? undefined);
          } else {
            memory = await createMemoryUnit(trimmed);
          }
        } else if (type === "image") {
          memory = await createMemory(trimmed, "image");
        } else {
          memory = await createMemoryUnit(trimmed, type);
        }

        setValue("");
        onCreated?.(memory.id);
        router.push(`/memory/${memory.id}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, onCreated, router]
  );

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = async () => {
              const dataUrl = reader.result as string;
              await submit(dataUrl, "image");
            };
            reader.readAsDataURL(file);
          }
          return;
        }
      }

      const text = e.clipboardData?.getData("text");
      if (text && URL_REGEX.test(text)) {
        const url = extractUrl(text);
        if (url && text.trim() === url) {
          e.preventDefault();
          await submit(url, "link");
          return;
        }
      }
    },
    [submit]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;

      if (URL_REGEX.test(trimmed) && trimmed.split(/\s/).length <= 1) {
        submit(trimmed, "link");
      } else if (trimmed.length < 140) {
        submit(trimmed, "idea");
      } else {
        submit(trimmed, "note");
      }
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isSubmitting}
        rows={1}
        className={cn(
          "w-full resize-none rounded-lg border bg-[var(--bg-elevated)] px-4 py-3 text-[var(--fg)] placeholder:text-[var(--fg-muted)]",
          "border-[var(--border)] focus:border-[var(--border-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]",
          "min-h-[48px] max-h-[120px]"
        )}
        aria-label="Capture anything"
      />
      {(isSubmitting || isFetchingOG) && (
        <p className="text-xs text-[var(--fg-muted)] mt-1">
          {isFetchingOG ? "Fetching preview…" : "Saving…"}
        </p>
      )}
    </div>
  );
}
