"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Cookie,
  EyeOff,
  Fingerprint,
  History,
  Lock,
  MonitorSmartphone,
  Radar,
  ScanLine,
  ShieldCheck,
  Timer,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { RiskBadge } from "@/components/investigation/risk-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api, errorMessage } from "@/lib/api";
import { collectDeviceSnapshot } from "@/lib/device-scan";
import type { DeviceScanDetail, DeviceScanPage } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const CHECKS = [
  {
    icon: Lock,
    title: "Secure connection",
    detail: "HTTPS, transport security and mixed-content exposure.",
  },
  {
    icon: Cookie,
    title: "Cookies & storage",
    detail: "Whether the browser can keep a protected, persistent session.",
  },
  {
    icon: Radar,
    title: "WebRTC leaks",
    detail: "Local and public addresses revealed by ICE candidate gathering.",
  },
  {
    icon: EyeOff,
    title: "Site permissions",
    detail: "Camera, microphone, location, notifications and clipboard access.",
  },
  {
    icon: Timer,
    title: "Time zone integrity",
    detail: "Clock and zone consistency against the reported UTC offset.",
  },
  {
    icon: Fingerprint,
    title: "Automation signals",
    detail: "Whether this browser is being driven by automation software.",
  },
];

export default function DeviceScanPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [scanning, setScanning] = useState(false);
  const [page, setPage] = useState(1);

  const recent = useQuery({
    queryKey: ["device-scans", page],
    queryFn: () =>
      api.get<DeviceScanPage>(`/api/v1/device/scans?page=${page}&page_size=8`),
  });

  async function runScan() {
    setScanning(true);
    try {
      const snapshot = await collectDeviceSnapshot();
      const scan = await api.post<DeviceScanDetail>("/api/v1/device/scans", { snapshot });
      toast.success(`Scan complete — ${scan.level.toLowerCase()} exposure`);
      await queryClient.invalidateQueries({ queryKey: ["device-scans"] });
      router.push(`/device/${scan.id}`);
    } catch (error) {
      toast.error(errorMessage(error));
      setScanning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.2em] text-teal-300">Device scan</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Inspect this browser
        </h1>
        <p className="max-w-2xl text-sm text-muted">
          Check how much this browser exposes about you and your device. TrustScan scores the
          results deterministically and keeps a history so you can compare later.
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="pointer-events-none absolute -right-20 -top-24 size-64 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-teal-400/30 bg-teal-400/10 text-teal-300">
              <ScanLine className={scanning ? "size-6 animate-pulse" : "size-6"} />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                {scanning ? "Collecting browser signals…" : "Ready to scan"}
              </p>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-muted">
                The scan reads browser facts and probes WebRTC candidates. It takes a few seconds,
                never asks for your password, and is saved to your account.
              </p>
            </div>
          </div>
          <Button onClick={() => void runScan()} loading={scanning} className="relative shrink-0">
            <MonitorSmartphone className="size-4" />
            {scanning ? "Scanning…" : "Run device scan"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CHECKS.map((check) => (
          <Card key={check.title}>
            <CardContent className="flex items-start gap-3 p-4">
              <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-teal-300">
                <check.icon className="size-4" />
              </span>
              <div>
                <p className="text-xs font-medium text-foreground">{check.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-muted">{check.detail}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-surface/50 p-4">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-400/80" />
          <p className="text-[11px] leading-relaxed text-faint">
            What is stored: the derived score, the checklist results, and a small metrics snapshot
            (platform, browser, screen size, permissions and WebRTC address counts). Raw addresses
            are saved with your own scan so you can see what leaked. The WebRTC probe contacts a STUN
            server to discover which addresses your browser exposes. TrustScan never receives your
            browsing history or page contents.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="size-4 text-faint" />
          <h2 className="text-sm font-semibold text-foreground">Recent scans</h2>
        </div>
        {recent.data && recent.data.total > 0 ? (
          <span className="text-[11px] text-faint">
            {recent.data.total} saved scan{recent.data.total === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      {recent.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : recent.data && recent.data.items.length > 0 ? (
        <div className="space-y-3">
          <Card>
            <CardContent className="divide-y divide-border/70 p-0">
              {recent.data.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/device/${item.id}`}
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-card-strong/40"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-teal-300">
                    <MonitorSmartphone className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground group-hover:text-teal-200">
                      {item.label ?? "This browser"}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-faint">
                      <span>{formatDate(item.created_at)}</span>
                      <span>·</span>
                      <span className="truncate">{item.summary}</span>
                    </p>
                  </div>
                  <RiskBadge level={item.level} score={item.score} />
                  <ArrowRight className="size-4 text-faint transition-colors group-hover:text-teal-300" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {recent.data.pages > 1 ? (
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-[11px] text-faint">
                Page {recent.data.page} of {recent.data.pages} · {recent.data.total} total
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={recent.data.page <= 1 || recent.isFetching}
                >
                  <ArrowLeft className="size-3.5" />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((value) => Math.min(recent.data.pages, value + 1))}
                  disabled={recent.data.page >= recent.data.pages || recent.isFetching}
                >
                  Next
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <EmptyState
          icon={<Radar className="size-5" />}
          title="No device scans yet"
          description="Run your first scan to see what this browser reveals about your connection, permissions and network."
          action={
            <Button size="sm" onClick={() => void runScan()} loading={scanning}>
              <ScanLine className="size-3.5" />
              Run device scan
            </Button>
          }
        />
      )}
    </div>
  );
}
