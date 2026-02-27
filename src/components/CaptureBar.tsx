"use client";

import { useState, useCallback, useRef } from "react";
import type { MemoryUnit } from "@/lib/db/schema";
import { createMemoryUnit } from "@/engine/memoryEngine";
import { createMemory, updateMemory } from "@/storage/indexedDbAdapter";
import { cn } from "@/lib/cn";

interface CaptureBarProps {
  onCreated?: (id: string) => void;
  placeholder?: string;
  className?: string;
}

const URL_REGEX = /https?:\/\/[^\s]+/gi;
const IMAGE_URL_REGEX = /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i;

function isImageUrl(url: string): boolean {
  return IMAGE_URL_REGEX.test(url);
}

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
  placeholder = "Drop a thought into the arc…",
  className,
}: CaptureBarProps) {
  const [value, setValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const submit = useCallback(
    async (content: string, type?: "link" | "image" | "idea" | "note") => {
      const trimmed = content.trim();
      if (!trimmed || isSubmitting) return;

      setIsSubmitting(true);
      try {
        let memory: MemoryUnit;

        if (type === "link") {
          const url = extractUrl(trimmed);
          if (url) {
            if (isImageUrl(url)) {
              memory = await createMemory(url, "image");
            } else {
              memory = await createMemory(trimmed, "link");
              setValue("");
              onCreated?.(memory.id);
              setIsSubmitting(false);
              fetchOG(url).then((meta) => {
                if (meta) {
                  updateMemory(memory.id, { metadata: meta }).then(() => {
                    onCreated?.(memory.id);
                  });
                }
              });
              return;
            }
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
      } finally {
        setIsSubmitting(false);
      }
    },
    [isSubmitting, onCreated]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file" && item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              submit(dataUrl, "image");
            };
            reader.readAsDataURL(file);
          }
          return;
        }
      }

      const text = e.clipboardData?.getData("text");
      if (text && URL_REGEX.test(text)) {
        const url = extractUrl(text);
        if (url && text.trim() === url && isImageUrl(url)) {
          e.preventDefault();
          submit(url, "image");
          return;
        }
      }
    },
    [submit]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (!files?.length) return;
      const file = files[0];
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        submit(dataUrl, "image");
      };
      reader.readAsDataURL(file);
    },
    [submit]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer!.dropEffect = "copy";
  }, []);

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
      <div
        className={cn(
          "rounded-2xl p-1 -m-1 transition-all duration-[260ms] ease-out",
          isFocused && "bg-[var(--capture-glow)] rounded-2xl"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={isSubmitting}
          rows={1}
          className={cn(
            "w-full resize-none rounded-2xl bg-[var(--bg-elevated)] backdrop-blur-[8px]",
            "border border-[var(--border)]",
            "px-6 py-6 text-2xl text-[var(--fg)] placeholder:text-[var(--fg-muted)]",
            "focus:border-[var(--border-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]",
            "min-h-[80px] max-h-[200px]",
            "tracking-tight"
          )}
          aria-label="Capture"
        />
      </div>
      {isSubmitting && (
        <p className="text-xs text-[var(--fg-muted)] mt-2 ml-1">Saving…</p>
      )}
    </div>
  );
}
