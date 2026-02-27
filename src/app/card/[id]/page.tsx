"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function CardRedirect() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  useEffect(() => {
    router.replace(`/memory/${id}`);
  }, [id, router]);

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <p className="text-[var(--fg-muted)]">Redirecting...</p>
    </div>
  );
}
