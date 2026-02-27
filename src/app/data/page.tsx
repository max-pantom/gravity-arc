"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DataRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <p className="text-[var(--fg-muted)]">Use Cmd+Shift+D for dev mode.</p>
    </div>
  );
}
