"use client";

import { Sidebar } from "./Sidebar";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <Sidebar />
      <div className="pl-12 min-w-0">{children}</div>
    </div>
  );
}
