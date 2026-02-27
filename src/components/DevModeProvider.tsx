"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getAllMemories, getAllConnections } from "@/storage/indexedDbAdapter";

type DevModeContextValue = {
  devMode: boolean;
  toggleDevMode: () => void;
  devData: { memories: unknown[]; connections: unknown[] } | null;
  refreshDevData: () => Promise<void>;
};

const DevModeContext = createContext<DevModeContextValue | null>(null);

export function DevModeProvider({ children }: { children: React.ReactNode }) {
  const [devMode, setDevMode] = useState(false);
  const [devData, setDevData] = useState<{ memories: unknown[]; connections: unknown[] } | null>(null);

  const refreshDevData = useCallback(async () => {
    const [memories, connections] = await Promise.all([
      getAllMemories(),
      getAllConnections(),
    ]);
    setDevData({ memories, connections });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "d" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        setDevMode((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (devMode) {
      refreshDevData();
    } else {
      setDevData(null);
    }
  }, [devMode, refreshDevData]);

  const toggleDevMode = () => setDevMode((prev) => !prev);

  return (
    <DevModeContext.Provider
      value={{ devMode, toggleDevMode, devData, refreshDevData }}
    >
      {children}
      {devMode && <DevModePanel />}
    </DevModeContext.Provider>
  );
}

function DevModePanel() {
  const { devMode, toggleDevMode, devData, refreshDevData } = useContext(DevModeContext)!;

  if (!devMode) return null;

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] bg-black/80 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && toggleDevMode()}
    >
      <div
        className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl max-w-2xl w-full max-h-[80dvh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-medium text-[var(--fg)]">Dev Mode</h2>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={refreshDevData}
              className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--bg)]"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={toggleDevMode}
              className="text-xs px-2 py-1 rounded border border-[var(--border)] hover:bg-[var(--bg)]"
            >
              Close
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <pre className="text-xs font-mono text-[var(--fg)] whitespace-pre-wrap">
            {devData
              ? JSON.stringify(
                  { memories: devData.memories, connections: devData.connections },
                  null,
                  2
                )
              : "Loading..."}
          </pre>
        </div>
        <p className="text-xs text-[var(--fg-muted)] px-4 py-2 border-t border-[var(--border)]">
          Cmd+Shift+D to toggle
        </p>
      </div>
    </div>
  );
}

export function useDevMode() {
  const ctx = useContext(DevModeContext);
  if (!ctx) throw new Error("useDevMode must be used within DevModeProvider");
  return ctx;
}
