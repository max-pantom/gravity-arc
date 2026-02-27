"use client";

import { useState } from "react";
import { Capture } from "@/components/Capture";
import { Timeline } from "@/components/Timeline";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { ViewModeToggle } from "@/components/ViewModeToggle";
import type { ViewMode } from "@/components/ViewModeToggle";
import Link from "next/link";

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>("linear");

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-[var(--border)] bg-[var(--bg)] px-4 py-3 flex items-center justify-between gap-4">
        <h1 className="text-lg font-medium text-[var(--fg)]">Archive</h1>
        <div className="flex items-center gap-2">
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          <Link
            href="/data"
            className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            Data
          </Link>
          <ThemeSwitcher />
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-6">
        <Capture />
        <Timeline viewMode={viewMode} />
      </main>
    </div>
  );
}
