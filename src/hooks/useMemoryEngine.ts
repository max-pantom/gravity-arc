"use client";

import { useState, useEffect, useCallback } from "react";
import type { HomeState } from "@/engine/memoryEngine";
import { getHomeState } from "@/engine/memoryEngine";

export function useMemoryEngine() {
  const [state, setState] = useState<HomeState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const homeState = await getHomeState();
      setState(homeState);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return { state, loading, refresh };
}
