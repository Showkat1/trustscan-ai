import { Compass } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10 hero-aurora" />
      <Logo size="lg" />
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-teal-300">404</p>
        <h1 className="text-3xl font-semibold tracking-tight">This page is unverified</h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted">
          The page you are looking for does not exist or has moved.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/dashboard">
            <Compass className="size-4" />
            Go to dashboard
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </div>
  );
}
