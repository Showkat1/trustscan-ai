import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  FileSearch,
  Fingerprint,
  Link2,
  ScanText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Waypoints,
} from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { RiskGauge } from "@/components/risk-gauge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const PIPELINE = [
  { icon: FileSearch, title: "Evidence intake", copy: "Message, URL, screenshot or document." },
  { icon: ScanText, title: "Evidence extraction", copy: "URLs, amounts, requests, indicators." },
  { icon: Link2, title: "URL intelligence", copy: "Look-alikes, shorteners, obfuscation." },
  { icon: BookOpenCheck, title: "Trusted retrieval", copy: "RAG over curated guidance." },
  { icon: BrainCircuit, title: "Generative analysis", copy: "Claims, intent and risk signals." },
  { icon: Waypoints, title: "Correlation", copy: "Independent signals linked together." },
  { icon: ShieldAlert, title: "Risk assessment", copy: "Explainable 0–100 score." },
  { icon: ShieldCheck, title: "Protection guidance", copy: "Concrete next steps, not just a label." },
];

const CAPABILITIES = [
  {
    icon: Fingerprint,
    title: "Impersonation detection",
    copy: "Spots bank, government and brand impersonation using look-alike domain analysis and behavioural cues.",
  },
  {
    icon: ScanText,
    title: "Multimodal intake",
    copy: "OCR for screenshots and PDF/TXT extraction feed the same investigation pipeline as raw text.",
  },
  {
    icon: BookOpenCheck,
    title: "Trusted-source RAG",
    copy: "Retrieval over a curated cybersecurity knowledge base keeps conclusions grounded in real guidance.",
  },
  {
    icon: Waypoints,
    title: "Evidence correlation",
    copy: "Credential requests, payment pressure and suspicious links are correlated into explainable patterns.",
  },
  {
    icon: ShieldAlert,
    title: "Explainable scoring",
    copy: "A deterministic risk engine shows exactly which independent evidence produced the score.",
  },
  {
    icon: Sparkles,
    title: "Works without an API key",
    copy: "A transparent deterministic fallback keeps every feature functional for demos and offline testing.",
  },
];

const BANDS = [
  { level: "Low", range: "0–24", tone: "emerald" as const },
  { level: "Medium", range: "25–49", tone: "amber" as const },
  { level: "High", range: "50–79", tone: "orange" as const },
  { level: "Critical", range: "80–100", tone: "rose" as const },
];

export default function LandingPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 hero-aurora" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[720px] app-grid" />

      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5">
          <Link href="/" aria-label="TrustScan AI home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
            <a href="#how" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#capabilities" className="transition-colors hover:text-foreground">
              Capabilities
            </a>
            <a href="#risk" className="transition-colors hover:text-foreground">
              Risk engine
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/register">
                Get started
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-full max-w-7xl gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-24">
          <div className="animate-rise">
            <Badge tone="teal" className="mb-6">
              <Sparkles className="size-3" />
              Generative AI · Digital Trust & Fraud Intelligence
            </Badge>
            <h1 className="text-balance text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl">
              Verify before
              <br />
              <span className="text-gradient">you trust.</span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
              TrustScan AI investigates suspicious messages, links, screenshots and documents.
              It verifies claims, correlates evidence, explains the risk, and tells you exactly
              what to do next.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg">
                <Link href="/register">
                  Start an investigation
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/login">Sign in to dashboard</Link>
              </Button>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/5 pt-6">
              {[
                ["4", "evidence types"],
                ["8", "pipeline stages"],
                ["0–100", "explainable score"],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt className="font-mono text-xl font-semibold text-foreground">{value}</dt>
                  <dd className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-faint">
                    {label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="animate-rise [animation-delay:120ms]">
            <div className="panel ring-glow relative rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-rose-400" />
                  <span className="size-2 rounded-full bg-amber-400" />
                  <span className="size-2 rounded-full bg-emerald-400" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-faint">
                  investigation · TC-01
                </span>
              </div>

              <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <RiskGauge score={92} level="CRITICAL" size={168} />
                <div className="w-full space-y-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-faint">
                      Threat category
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      Phishing · Bank impersonation
                    </p>
                  </div>
                  <div className="space-y-2">
                    {[
                      ["Credential request", "HIGH"],
                      ["Suspicious URL", "HIGH"],
                      ["Artificial urgency", "MEDIUM"],
                    ].map(([label, severity]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                      >
                        <span className="text-xs text-muted-strong">{label}</span>
                        <Badge tone={severity === "HIGH" ? "orange" : "amber"}>{severity}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-teal-400/20 bg-teal-400/[0.06] p-4">
                <p className="flex items-center gap-2 text-xs font-medium text-teal-200">
                  <ShieldCheck className="size-4" />
                  Recommended next step
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  Do not share the OTP. Verify the claim through your bank&apos;s official app,
                  then report the message.
                </p>
              </div>
            </div>
            <p className="mt-3 text-center text-[11px] text-faint">
              Illustrative output · evidence-grounded, not a criminal determination
            </p>
          </div>
        </section>

        <section className="border-y border-white/5 bg-surface/40">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-12 sm:grid-cols-3">
            {[
              {
                title: "The gap",
                copy: "Existing tools stamp a message “spam” or “fraud”. They do not verify the claim, explain the reasoning, or say what to do next.",
              },
              {
                title: "The approach",
                copy: "TrustScan investigates: extract observable evidence, retrieve trusted guidance, correlate independent signals, then score risk.",
              },
              {
                title: "The promise",
                copy: "Every conclusion is traceable to evidence. Unknown senders are not automatically fraudulent — and absence of reports is not proof of safety.",
              },
            ].map((item) => (
              <div key={item.title} className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-300">
                  {item.title}
                </h2>
                <p className="text-sm leading-relaxed text-muted">{item.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mx-auto w-full max-w-7xl px-5 py-20">
          <div className="max-w-2xl">
            <Badge tone="cyan">Investigation pipeline</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Eight stages. One explainable verdict.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Each stage is persisted and timed, so the report shows how the conclusion was
              reached — not just the final label.
            </p>
          </div>
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PIPELINE.map((stage, index) => (
              <li
                key={stage.title}
                className="group relative rounded-xl border border-border bg-card/60 p-4 transition-colors hover:border-teal-400/30 hover:bg-card"
              >
                <span className="font-mono text-[10px] text-faint">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <stage.icon className="mt-3 size-5 text-teal-300" />
                <h3 className="mt-3 text-sm font-medium text-foreground">{stage.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{stage.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section id="capabilities" className="mx-auto w-full max-w-7xl px-5 pb-20">
          <div className="max-w-2xl">
            <Badge tone="violet">Capabilities</Badge>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              Built for real investigations
            </h2>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border bg-card/60 p-5 transition-colors hover:border-teal-400/25"
              >
                <div className="flex size-9 items-center justify-center rounded-lg border border-teal-400/20 bg-teal-400/10 text-teal-300">
                  <item.icon className="size-4" />
                </div>
                <h3 className="mt-4 text-sm font-medium text-foreground">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">{item.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="risk" className="border-y border-white/5 bg-surface/40">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-20 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge tone="amber">Explainable risk engine</Badge>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                A score you can argue with
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                The engine treats evidence as independent signals, not labels. Payment pressure
                alone is not critical; credential theft combined with a suspicious link is. Every
                band is bounded so the score stays honest.
              </p>
              <ul className="mt-6 space-y-2.5 text-sm text-muted">
                {[
                  "Unknown sender does not imply fraud.",
                  "Category labels are context, not extra evidence.",
                  "Strong independent evidence is required for CRITICAL.",
                  "The explanation names the signals that produced the score.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-300" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {BANDS.map((band) => (
                <div
                  key={band.level}
                  className="rounded-xl border border-border bg-card/70 p-5"
                >
                  <Badge tone={band.tone}>{band.level}</Badge>
                  <p className="mt-3 font-mono text-2xl font-semibold text-foreground">
                    {band.range}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {band.level === "Low"
                      ? "Limited indicators — stay cautious."
                      : band.level === "Medium"
                        ? "Some indicators — verify independently."
                        : band.level === "High"
                          ? "Correlated risk — do not act yet."
                          : "Strong evidence — stop and protect."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 py-20">
          <div className="relative overflow-hidden rounded-2xl border border-teal-400/20 bg-gradient-to-br from-teal-400/10 via-card to-cyan-500/5 p-8 sm:p-12">
            <div className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-teal-400/10 blur-3xl" />
            <div className="relative max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Got a suspicious message?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Paste it, drop a link, upload a screenshot. TrustScan returns a full report in
                seconds — with the evidence, the reasoning and the next step.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link href="/register">
                    Create a free account
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/login">I already have an account</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Logo size="sm" />
            <p className="text-xs text-faint">
              Evidence-based risk intelligence. Not proof of criminal conduct.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs text-muted">
            <Link href="/login" className="hover:text-foreground">
              Sign in
            </Link>
            <Link href="/register" className="hover:text-foreground">
              Create account
            </Link>
            <a href="/docs" className="pointer-events-none opacity-60">
              API docs
            </a>
            <span className="text-faint">© {new Date().getFullYear()} TrustScan AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
