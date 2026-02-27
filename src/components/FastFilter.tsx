"use client";

import { cn } from "@/lib/cn";

export type FilterState = {
  query: string;
  type: string;
  domain: string;
  status: string;
};

const TYPES = [
  { value: "", label: "All" },
  { value: "idea", label: "Idea" },
  { value: "project", label: "Project" },
  { value: "note", label: "Note" },
  { value: "design", label: "Design" },
  { value: "link", label: "Link" },
  { value: "image", label: "Image" },
];

interface FastFilterProps {
  filter: FilterState;
  onChange: (filter: FilterState) => void;
  domains: string[];
  className?: string;
}

export function FastFilter({
  filter,
  onChange,
  domains,
  className,
}: FastFilterProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <input
        type="search"
        value={filter.query}
        onChange={(e) => onChange({ ...filter, query: e.target.value })}
        placeholder="Filter..."
        className={cn(
          "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm",
          "text-[var(--fg)] placeholder:text-[var(--fg-muted)]",
          "focus:border-[var(--border-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--border-focus)]"
        )}
        aria-label="Filter memories"
      />
      <div className="flex flex-wrap gap-1">
        <select
          value={filter.type}
          onChange={(e) => onChange({ ...filter, type: e.target.value })}
          className={cn(
            "rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--fg)]"
          )}
          aria-label="Filter by type"
        >
          {TYPES.map((t) => (
            <option key={t.value || "_"} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {domains.length > 0 && (
          <select
            value={filter.domain}
            onChange={(e) => onChange({ ...filter, domain: e.target.value })}
            className={cn(
              "rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--fg)]"
            )}
            aria-label="Filter by domain"
          >
            <option value="">All domains</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        )}
        <select
          value={filter.status}
          onChange={(e) => onChange({ ...filter, status: e.target.value })}
          className={cn(
            "rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-xs text-[var(--fg)]"
          )}
          aria-label="Filter by status"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="dormant">Dormant</option>
          <option value="archived">Archived</option>
          <option value="resurfacing">Resurfacing</option>
        </select>
      </div>
    </div>
  );
}

export function applyFilter<T extends { type?: string; status?: string; metadata?: { domain?: string }; content: string }>(
  items: T[],
  filter: FilterState
): T[] {
  let result = items;

  if (filter.query.trim()) {
    const q = filter.query.toLowerCase().trim();
    result = result.filter(
      (m) =>
        m.content.toLowerCase().includes(q) ||
        m.metadata?.title?.toLowerCase().includes(q) ||
        m.metadata?.description?.toLowerCase().includes(q) ||
        m.metadata?.domain?.toLowerCase().includes(q)
    );
  }

  if (filter.type) {
    result = result.filter((m) => m.type === filter.type);
  }

  if (filter.domain) {
    result = result.filter((m) => m.metadata?.domain === filter.domain);
  }

  if (filter.status) {
    result = result.filter((m) => m.status === filter.status);
  }

  return result;
}
