"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  EyeOff,
  Lock,
  MonitorSmartphone,
  Radar,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Wifi,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { RiskBadge } from "@/components/investigation/risk-badge";
import { RiskGauge } from "@/components/risk-gauge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api, errorMessage } from "@/lib/api";
import { collectDeviceSnapshot } from "@/lib/device-scan";
import type {
  DeviceScanDetail,
  DeviceSignal,
  DeviceSignalSeverity,
  PermissionState,
} from "@/lib/types";
import { formatDate, titleCase } from "@/lib/utils";

type BadgeTone = "neutral" | "teal" | "cyan" | "amber" | "orange" | "rose" | "emerald" | "violet";

const SEVERITY_STYLE: Record<
  DeviceSignalSeverity,
  { tone: BadgeTone; dot: string; text: string }
> = {
  CRITICAL: { tone: "rose", dot: "bg-rose-400", text: "text-rose-300" },
  HIGH: { tone: "orange", dot: "bg-orange-400", text: "text-orange-300" },
  MEDIUM: { tone: "amber", dot: "bg-amber-400", text: "text-amber-300" },
  LOW: { tone: "emerald", dot: "bg-emerald-400", text: "text-emerald-300" },
  INFO: { tone: "neutral", dot: "bg-slate-400", text: "text-slate-300" },
  GOOD: { tone: "teal", dot: "bg-teal-400", text: "text-teal-300" },
};

const SEVERITY_ORDER: Record<DeviceSignalSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
  GOOD: 5,
};

function pointsLabel(points: number): string {
  if (points > 0) return `+${points}`;
  return String(points);
}

function permissionTone(state: PermissionState): BadgeTone {
  if (state === "granted") return "orange";
  if (state === "denied") return "emerald";
  return "neutral";
}

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function valueOrDash(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <span className="text-[11px] text-faint">{label}</span>
      <span className="max-w-[60%] text-right text-xs text-muted-strong">{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border bg-surface/60 px-3 py-2.5">
      <p className="font-mono text-lg font-semibold tabular-nums text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-faint">{label}</p>
    </div>
  );
}

function SignalRow({ signal }: { signal: DeviceSignal }) {
  const style = SEVERITY_STYLE[signal.severity];
  return (
    <li className="flex gap-3 px-5 py-3.5">
      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${style.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium text-foreground">{signal.label}</p>
          <Badge tone={style.tone} className="text-[10px]">
            {titleCase(signal.category)}
          </Badge>
          {signal.points !== 0 ? (
            <span className="font-mono text-[10px] text-faint">{pointsLabel(signal.points)} pts</span>
          ) : null}
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted">{signal.detail}</p>
      </div>
      <span className={`shrink-0 text-[10px] uppercase tracking-wider ${style.text}`}>
        {signal.severity}
      </span>
    </li>
  );
}

export default function DeviceScanReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const scanId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rescanning, setRescanning] = useState(false);

  const scan = useQuery({
    queryKey: ["device-scan", scanId],
    queryFn: () => api.get<DeviceScanDetail>(`/api/v1/device/scans/${scanId}`),
  });

  const remove = useMutation({
    mutationFn: () => api.delete<void>(`/api/v1/device/scans/${scanId}`),
    onSuccess: async () => {
      toast.success("Device scan deleted");
      await queryClient.invalidateQueries({ queryKey: ["device-scans"] });
      router.replace("/device");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  async function rescan() {
    setRescanning(true);
    try {
      const snapshot = await collectDeviceSnapshot();
      const created = await api.post<DeviceScanDetail>("/api/v1/device/scans", { snapshot });
      toast.success("Device scan complete");
      await queryClient.invalidateQueries({ queryKey: ["device-scans"] });
      router.replace(`/device/${created.id}`);
    } catch (error) {
      toast.error(errorMessage(error));
      setRescanning(false);
    }
  }

  if (scan.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (scan.isError || !scan.data) {
    return (
      <EmptyState
        icon={<AlertTriangle className="size-5" />}
        title="Device scan not found"
        description={errorMessage(scan.error)}
        action={
          <Button asChild variant="secondary" size="sm">
            <Link href="/device">
              <ArrowLeft className="size-3.5" />
              Back to device scans
            </Link>
          </Button>
        }
      />
    );
  }

  const data = scan.data;
  const metrics = data.metrics;
  const orderedSignals = [...data.signals].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
  const riskSignals = data.signals.filter((signal) => signal.points > 0);
  const granted = Object.values(metrics.permissions).filter((state) => state === "granted");
  const webrtcCount =
    metrics.webrtc.local_addresses.length + metrics.webrtc.public_addresses.length;
  const battery =
    metrics.battery.charging === null
      ? "Not supported"
      : `${Math.round((metrics.battery.level ?? 0) * 100)}%${
          metrics.battery.charging ? " · charging" : ""
        }`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/device"
          className="inline-flex w-fit items-center gap-1.5 text-xs text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to device scans
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border border-teal-400/25 bg-teal-400/10 text-teal-300">
              <MonitorSmartphone className="size-5" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                {data.label ?? "This browser"}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-faint">
                <RiskBadge level={data.level} score={data.score} />
                <span className="font-mono">#{data.id.slice(0, 8)}</span>
                <span>·</span>
                <span>{formatDate(data.created_at)}</span>
                <span>·</span>
                <span>{riskSignals.length} risk signal{riskSignals.length === 1 ? "" : "s"}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void rescan()}
              loading={rescanning}
            >
              <RefreshCw className="size-3.5" />
              Re-scan
            </Button>
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center">
          <div className="flex justify-center lg:justify-start">
            <RiskGauge score={data.score} level={data.level} size={168} />
          </div>
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={SEVERITY_STYLE[data.level as DeviceSignalSeverity]?.tone ?? "neutral"}>
                  {titleCase(data.level)} exposure
                </Badge>
                <span className="text-[11px] text-faint">
                  Scored on {data.signals.length} checked signals
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-strong">{data.summary}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Stat label="Risk signals" value={riskSignals.length} />
              <Stat label="Permissions granted" value={granted.length} />
              <Stat label="WebRTC addresses" value={webrtcCount} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-teal-300" />
              Exposure signals
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border/70">
              {orderedSignals.map((signal) => (
                <SignalRow key={signal.key} signal={signal} />
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-teal-300" />
              What to do
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3.5">
              {data.recommendations.map((recommendation, index) => (
                <li key={recommendation.title} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border bg-surface font-mono text-[10px] text-teal-300">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-medium text-foreground">{recommendation.title}</p>
                      <Badge
                        tone={
                          recommendation.priority === "now"
                            ? "rose"
                            : recommendation.priority === "soon"
                              ? "amber"
                              : "neutral"
                        }
                        className="text-[10px]"
                      >
                        {recommendation.priority === "now"
                          ? "Do now"
                          : recommendation.priority === "soon"
                            ? "Soon"
                            : "Info"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">
                      {recommendation.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MonitorSmartphone className="size-4 text-teal-300" />
              Device
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Metric label="Platform" value={valueOrDash(metrics.platform)} />
            <Metric
              label="Browser"
              value={
                metrics.browser
                  ? `${metrics.browser}${metrics.browser_version ? ` ${metrics.browser_version}` : ""}`
                  : "—"
              }
            />
            <Metric
              label="Screen"
              value={`${metrics.screen.width} × ${metrics.screen.height} · ${metrics.screen.pixel_ratio}x · ${metrics.screen.color_depth}-bit`}
            />
            <Metric
              label="Viewport"
              value={`${metrics.screen.viewport_width} × ${metrics.screen.viewport_height}`}
            />
            <Metric label="CPU cores" value={valueOrDash(metrics.hardware.cpu_cores)} />
            <Metric
              label="Memory"
              value={
                metrics.hardware.memory_gb
                  ? `${metrics.hardware.memory_gb} GB`
                  : "Not reported"
              }
            />
            <Metric label="Touch points" value={metrics.hardware.max_touch_points} />
            <Metric label="Time zone" value={valueOrDash(metrics.timezone)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="size-4 text-teal-300" />
              Protection & privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Metric
              label="Secure context"
              value={
                metrics.context.secure ? (
                  <span className="text-emerald-300">HTTPS</span>
                ) : (
                  <span className="text-rose-300">Insecure</span>
                )
              }
            />
            <Metric label="Cookies" value={yesNo(metrics.cookies_enabled)} />
            <Metric label="Local storage" value={yesNo(metrics.storage.local_storage)} />
            <Metric label="Session storage" value={yesNo(metrics.storage.session_storage)} />
            <Metric label="IndexedDB" value={yesNo(metrics.storage.indexed_db)} />
            <Metric label="Do Not Track" value={yesNo(metrics.privacy.do_not_track)} />
            <Metric
              label="Global Privacy Control"
              value={yesNo(metrics.privacy.global_privacy_control)}
            />
            <Metric
              label="Automation driver"
              value={
                metrics.privacy.webdriver ? (
                  <span className="text-orange-300">Detected</span>
                ) : (
                  "Not detected"
                )
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <EyeOff className="size-4 text-teal-300" />
              Site permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {(
              [
                ["Camera", metrics.permissions.camera],
                ["Microphone", metrics.permissions.microphone],
                ["Location", metrics.permissions.geolocation],
                ["Notifications", metrics.permissions.notifications],
                ["Clipboard", metrics.permissions.clipboard_read],
              ] as [string, PermissionState][]
            ).map(([label, state]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface/50 px-3 py-2"
              >
                <span className="text-xs text-muted-strong">{label}</span>
                <Badge tone={permissionTone(state)} className="text-[10px]">
                  {titleCase(state)}
                </Badge>
              </div>
            ))}
            <p className="pt-1 text-[11px] leading-relaxed text-faint">
              Browsers only expose a permission state they can confirm. Unsupported entries are not
              evidence either way.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="size-4 text-teal-300" />
              Network & WebRTC
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Metric
              label="Connection"
              value={valueOrDash(metrics.connection.effective_type?.toUpperCase() ?? null)}
            />
            <Metric
              label="Downlink"
              value={
                metrics.connection.downlink_mbps !== null
                  ? `${metrics.connection.downlink_mbps} Mbps`
                  : "—"
              }
            />
            <Metric
              label="Round trip"
              value={
                metrics.connection.rtt_ms !== null ? `${metrics.connection.rtt_ms} ms` : "—"
              }
            />
            <Metric label="Data saver" value={yesNo(metrics.connection.save_data)} />
            <Metric label="Battery" value={battery} />
            <Metric
              label="WebRTC support"
              value={metrics.webrtc.supported ? "Available" : "Unavailable"}
            />
            <Metric
              label="Local addresses"
              value={
                metrics.webrtc.local_addresses.length > 0 ? (
                  <span className="font-mono text-[11px]">
                    {metrics.webrtc.local_addresses.join(", ")}
                  </span>
                ) : (
                  "None exposed"
                )
              }
            />
            <Metric
              label="Public addresses"
              value={
                metrics.webrtc.public_addresses.length > 0 ? (
                  <span className="font-mono text-[11px]">
                    {metrics.webrtc.public_addresses.join(", ")}
                  </span>
                ) : (
                  "None exposed"
                )
              }
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 p-4">
          <Radar className="mt-0.5 size-4 shrink-0 text-teal-400/80" />
          <p className="text-[11px] leading-relaxed text-faint">
            Browser facts are self-reported and cannot prove a device is malware-free. Use this scan
            to reduce what you expose, not as a substitute for OS updates, endpoint protection or a
            password manager.
          </p>
        </CardContent>
      </Card>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this device scan?</DialogTitle>
            <DialogDescription>
              This permanently removes the saved score, signals and metrics snapshot. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() => remove.mutate()}
            >
              <Trash2 className="size-4" />
              Delete scan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
