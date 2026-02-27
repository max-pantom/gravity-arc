"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  searchCards,
  createCard,
  createConnection,
  extractTitle,
} from "@/lib/db";
import type { Card } from "@/lib/db/schema";
import { cn } from "@/lib/cn";

export interface CardEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: (content: string) => void;
  sourceCardId: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CardEditor({
  value,
  onChange,
  onSave,
  sourceCardId,
  placeholder,
  className,
  disabled,
}: CardEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Card[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSuggestions([]);
      return;
    }
    const results = await searchCards(q, 10);
    setSuggestions(results);
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 150);
    return () => clearTimeout(timer);
  }, [query, search]);

  const { triggerStart, triggerEnd } = useMemo(() => {
    const match = value.match(/\[\[([^\]]*)$/);
    if (match) {
      return {
        triggerStart: value.length - match[0].length,
        triggerEnd: value.length,
      };
    }
    return { triggerStart: -1, triggerEnd: -1 };
  }, [value]);

  useEffect(() => {
    if (triggerStart >= 0) {
      const q = value.slice(triggerStart + 2, triggerEnd);
      setQuery(q);
      setShowAutocomplete(true);
    } else {
      setShowAutocomplete(false);
      setQuery("");
    }
  }, [triggerStart, triggerEnd, value]);

  const insertLink = useCallback(
    async (title: string, cardId?: string) => {
      if (!textareaRef.current) return;

      let targetId = cardId;
      if (!targetId) {
        const newCard = await createCard(title, "note");
        targetId = newCard.id;
      }
      await createConnection(sourceCardId, targetId);

      const before = value.slice(0, triggerStart);
      const after = value.slice(triggerEnd);
      const linkText = `[[${targetId}]]`;
      const newValue = before + linkText + after;
      onChange(newValue);
      setShowAutocomplete(false);
      onSave?.(newValue);

      setTimeout(() => {
        textareaRef.current?.focus();
        const pos = before.length + linkText.length;
        textareaRef.current?.setSelectionRange(pos, pos);
      }, 0);
    },
    [value, triggerStart, triggerEnd, sourceCardId, onChange, onSave]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showAutocomplete) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) =>
        i < suggestions.length ? i + 1 : suggestions.length
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => (i > 0 ? i - 1 : 0));
      return;
    }
    if (e.key === "Enter" && suggestions.length > 0) {
      e.preventDefault();
      const selected = suggestions[selectedIndex];
      if (selected) {
        insertLink(extractTitle(selected.content), selected.id);
      }
      return;
    }
    if (e.key === "Enter" && query.trim() && suggestions.length === 0) {
      e.preventDefault();
      setIsCreating(true);
      insertLink(query.trim()).finally(() => setIsCreating(false));
      return;
    }
    if (e.key === "Escape") {
      setShowAutocomplete(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave?.(value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full min-h-[200px] resize-none rounded-lg bg-transparent px-4 py-3 text-[var(--fg)]",
          "border border-[var(--border)] focus:border-[var(--border-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]"
        )}
        aria-label="Edit card content"
      />

      {showAutocomplete && (
        <div
          className={cn(
            "absolute left-0 right-0 top-full mt-1 z-[var(--z-dropdown)]",
            "w-full max-w-md max-h-60 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] shadow-lg",
            "p-1"
          )}
        >
          {suggestions.map((card, i) => (
            <button
              key={card.id}
              type="button"
              onClick={() =>
                insertLink(extractTitle(card.content), card.id)
              }
              className={cn(
                "w-full text-left px-3 py-2 rounded-md cursor-pointer text-sm block",
                "hover:bg-[var(--accent-muted)] focus:bg-[var(--accent-muted)] focus:outline-none",
                i === selectedIndex && "bg-[var(--accent-muted)]"
              )}
            >
              {extractTitle(card.content)}
            </button>
          ))}
          {query.trim() && (
            <button
              type="button"
              onClick={() => {
                setIsCreating(true);
                insertLink(query.trim()).finally(() => setIsCreating(false));
              }}
              className={cn(
                "w-full text-left px-3 py-2 rounded-md cursor-pointer text-sm block text-[var(--fg-muted)]",
                "hover:bg-[var(--accent-muted)] hover:text-[var(--fg)] focus:bg-[var(--accent-muted)] focus:text-[var(--fg)] focus:outline-none"
              )}
            >
              {isCreating ? "Creating..." : `Create "${query.trim()}"`}
            </button>
          )}
          {suggestions.length === 0 && !query.trim() && (
            <div className="px-3 py-2 text-sm text-[var(--fg-muted)]">
              Type to search or create
            </div>
          )}
        </div>
      )}
    </div>
  );
}
