"use client";

import { useEffect, useRef } from "react";
import {
  FastFilter,
  applyFilter,
  type FilterState,
} from "./FastFilter";
import { cn } from "@/lib/cn";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  filter: FilterState;
  onChange: (filter: FilterState) => void;
  domains: string[];
}

export function SearchOverlay({
  open,
  onClose,
  filter,
  onChange,
  domains,
}: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-32 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)] shadow-[var(--card-shadow)] p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <FastFilter
          filter={filter}
          onChange={onChange}
          domains={domains}
        />
      </div>
    </div>
  );
}

export { applyFilter };
