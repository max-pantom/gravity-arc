"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getAllCards,
  getAllConnections,
  deleteCard,
  extractTitle,
} from "@/lib/db";
import type { Card, Connection } from "@/lib/db/schema";
import { cn } from "@/lib/cn";

const TYPE_LABELS: Record<string, string> = {
  idea: "Idea",
  project: "Project",
  note: "Note",
  design: "Design",
  experiment: "Experiment",
  link: "Link",
};

export default function DataPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"cards" | "connections" | "json">("cards");

  const refresh = async () => {
    setLoading(true);
    const [c, conn] = await Promise.all([getAllCards(), getAllConnections()]);
    setCards(c);
    setConnections(conn);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this card?")) return;
    await deleteCard(id);
    refresh();
  };

  const exportJson = () => {
    const data = { cards, connections, exported: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `archive-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col">
        <header className="border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3">
          <Link href="/" className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-sm">
            ← Archive
          </Link>
        </header>
        <main className="flex-1 p-4">
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
        >
          ← Archive
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportJson}
            className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--bg-elevated)]"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={refresh}
            className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--bg-elevated)]"
          >
            Refresh
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4">
        <div className="flex gap-2 mb-4">
          {(["cards", "connections", "json"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "px-3 py-1.5 text-sm rounded",
                tab === t
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:text-[var(--fg)] border border-[var(--border)]"
              )}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "cards" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 pr-4">Type</th>
                  <th className="text-left py-2 pr-4">Title</th>
                  <th className="text-left py-2 pr-4">ID</th>
                  <th className="text-left py-2 pr-4">Updated</th>
                  <th className="text-left py-2"></th>
                </tr>
              </thead>
              <tbody>
                {cards.map((card) => (
                  <tr
                    key={card.id}
                    className="border-b border-[var(--border)] hover:bg-[var(--bg-elevated)]"
                  >
                    <td className="py-2 pr-4 text-[var(--fg-muted)]">
                      {TYPE_LABELS[card.type ?? "note"] ?? "Note"}
                    </td>
                    <td className="py-2 pr-4">
                      <Link
                        href={`/card/${card.id}`}
                        className="text-[var(--accent)] hover:underline"
                      >
                        {extractTitle(card.content)}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs text-[var(--fg-muted)]">
                      {card.id.slice(0, 8)}…
                    </td>
                    <td className="py-2 pr-4 text-[var(--fg-muted)] tabular-nums">
                      {new Date(card.updated_at).toLocaleString()}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => handleDelete(card.id)}
                        className="text-red-500 hover:text-red-600 text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "connections" && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left py-2 pr-4">Source</th>
                  <th className="text-left py-2 pr-4">Target</th>
                </tr>
              </thead>
              <tbody>
                {connections.map((conn) => {
                  const src = cards.find((c) => c.id === conn.source_id);
                  const tgt = cards.find((c) => c.id === conn.target_id);
                  return (
                    <tr
                      key={conn.id}
                      className="border-b border-[var(--border)] hover:bg-[var(--bg-elevated)]"
                    >
                      <td className="py-2 pr-4">
                        <Link
                          href={`/card/${conn.source_id}`}
                          className="text-[var(--accent)] hover:underline"
                        >
                          {src ? extractTitle(src.content) : conn.source_id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">
                        <Link
                          href={`/card/${conn.target_id}`}
                          className="text-[var(--accent)] hover:underline"
                        >
                          {tgt ? extractTitle(tgt.content) : conn.target_id.slice(0, 8)}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {tab === "json" && (
          <pre className="p-4 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] overflow-auto text-xs font-mono text-[var(--fg)] max-h-[60dvh]">
            {JSON.stringify({ cards, connections }, null, 2)}
          </pre>
        )}

        <p className="text-xs text-[var(--fg-muted)] mt-4">
          IndexedDB (browser storage). No SQL — data is stored as key-value. Use
          Export JSON to backup.
        </p>
      </main>
    </div>
  );
}
