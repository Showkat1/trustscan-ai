"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10 hero-aurora" />
      <span className="flex size-14 items-center justify-center rounded-full border border-rose-400/30 bg-rose-400/10 text-rose-300">
        <AlertTriangle className="size-6" />
      </span>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">
          TrustScan hit an unexpected error. You can retry, or return to the dashboard.
        </p>
        {error.digest ? (
          <p className="font-mono text-[11px] text-faint">Reference: {error.digest}</p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button onClick={reset}>
          <RefreshCw className="size-4" />
          Try again
        </Button>
        <Button asChild variant="secondary">
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
