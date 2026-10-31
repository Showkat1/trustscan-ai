import { ArrowLeft, BookOpenCheck, ScanText, ShieldCheck, Waypoints } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";

const HIGHLIGHTS = [
  {
    icon: ScanText,
    title: "Message, URL, screenshot, document",
    copy: "One pipeline for every kind of suspicious evidence.",
  },
  {
    icon: BookOpenCheck,
    title: "Grounded in trusted guidance",
    copy: "Retrieval over a curated cybersecurity knowledge base.",
  },
  {
    icon: Waypoints,
    title: "Correlated, explainable risk",
    copy: "See which independent signals produced the score.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      <div className="pointer-events-none absolute inset-0 -z-10 hero-aurora" />

      <aside className="relative hidden flex-col justify-between border-r border-white/5 bg-surface/40 p-10 lg:flex">
        <div className="space-y-10">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-muted hover:text-foreground">
            <ArrowLeft className="size-3.5" />
            Back to home
          </Link>
          <Logo size="lg" />
          <div className="max-w-md space-y-4">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight">
              Verify before
              <br />
              <span className="text-gradient">you trust.</span>
            </h1>
            <p className="text-sm leading-relaxed text-muted">
              Sign in to investigate suspicious communication with an evidence-grounded
              Generative AI pipeline.
            </p>
          </div>
          <ul className="max-w-md space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-teal-400/20 bg-teal-400/10 text-teal-300">
                  <item.icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.copy}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-faint">
          <ShieldCheck className="size-3.5 text-teal-400/70" />
          Evidence-based risk intelligence — not a criminal determination.
        </div>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link href="/">
              <Logo size="sm" />
            </Link>
            <Link href="/" className="text-xs text-muted hover:text-foreground">
              Home
            </Link>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
