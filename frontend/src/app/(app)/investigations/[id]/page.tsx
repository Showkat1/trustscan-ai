"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  BookOpenCheck,
  ClipboardList,
  Clock,
  Download,
  FileText,
  Globe,
  Link2,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Waypoints,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { RiskBadge } from "@/components/investigation/risk-badge";
import { StatusBadge } from "@/components/investigation/status-badge";
import { TypeIcon } from "@/components/investigation/type-icon";
import { RiskGauge } from "@/components/risk-gauge";
import { CorrelationGraph } from "@/components/report/correlation-graph";
import { StageTimeline } from "@/components/report/stage-timeline";
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
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAccessToken, getApiBaseUrl, api, errorMessage } from "@/lib/api";
import type {
  Claim,
  CorrelationPattern,
  InvestigationDetail,
  PipelineStage,
  RiskLevel,
} from "@/lib/types";
import {
  formatDate,
  formatDuration,
  inputTypeLabel,
  titleCase,
} from "@/lib/utils";

const STAGE_DEFS = [
  { key: "intake", label: "Evidence intake" },
  { key: "extraction", label: "Evidence extraction" },
  { key: "url", label: "URL intelligence" },
  { key: "retrieval", label: "Trusted knowledge retrieval" },
  { key: "analysis", label: "Generative AI investigation" },
  { key: "correlation", label: "Evidence correlation" },
  { key: "risk", label: "Risk assessment" },
  { key: "actions", label: "Protection & response" },
];

function severityTone(severity: RiskLevel): "rose" | "orange" | "amber" | "emerald" {
  switch (severity) {
    case "CRITICAL":
      return "rose";
    case "HIGH":
      return "orange";
    case "MEDIUM":
      return "amber";
    default:
      return "emerald";
  }
}

function verificationTone(status: Claim["verification_status"]) {
  switch (status) {
    case "verified":
      return "emerald" as const;
    case "contradicted":
      return "rose" as const;
    case "requires_verification":
      return "amber" as const;
    default:
      return "neutral" as const;
  }
}

function processingStages(currentIndex: number): PipelineStage[] {
  return STAGE_DEFS.map((stage, index) => ({
    key: stage.key,
    label: stage.label,
    status:
      index < currentIndex ? "completed" : index === currentIndex ? "running" : "pending",
    duration_ms: null,
    detail: null,
  }));
}

export default function InvestigationReportPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const investigationId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [confirmDelete, setConfirmDelete] = useState(false);

  const investigation = useQuery({
    queryKey: ["investigation", investigationId],
    queryFn: () =>
      api.get<InvestigationDetail>(`/api/v1/investigations/${investigationId}`),
    refetchInterval: (query) => {
      const data = query.state.data as InvestigationDetail | undefined;
      if (!data) return 1200;
      return data.status === "queued" || data.status === "running" ? 1200 : false;
    },
  });

  const retry = useMutation({
    mutationFn: () =>
      api.post<{ id: string; status: string }>(
        `/api/v1/investigations/${investigationId}/retry`,
      ),
    onSuccess: async () => {
      toast.success("Investigation re-queued");
      await queryClient.invalidateQueries({
        queryKey: ["investigation", investigationId],
      });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const remove = useMutation({
    mutationFn: () => api.delete<void>(`/api/v1/investigations/${investigationId}`),
    onSuccess: async () => {
      toast.success("Investigation deleted");
      await queryClient.invalidateQueries({ queryKey: ["investigations"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
      router.replace("/history");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  async function downloadReport() {
    try {
      const token = getAccessToken();
      const response = await fetch(
        `${getApiBaseUrl()}/api/v1/investigations/${investigationId}/export`,
        {
          credentials: "include",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `trustscan-${investigationId}.json`;
      anchor.click();
      URL.revokeObjectURL(objectUrl);
      toast.success("Report exported");
    } catch {
      toast.error("The report could not be exported");
    }
  }

  if (investigation.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (investigation.isError || !investigation.data) {
    return (
      <EmptyState
        icon={<AlertTriangle className="size-5" />}
        title="Investigation not found"
        description={errorMessage(investigation.error)}
        action={
          <Button asChild variant="secondary" size="sm">
            <Link href="/history">
              <ArrowLeft className="size-3.5" />
              Back to history
            </Link>
          </Button>
        }
      />
    );
  }

  const data = investigation.data;
  const report = data.report;
  const isProcessing = data.status === "queued" || data.status === "running";
  const isFailed = data.status === "failed";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/history"
          className="inline-flex w-fit items-center gap-1.5 text-xs text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to history
        </Link>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <TypeIcon type={data.input_type} className="mt-0.5 size-10" />
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
                {report?.analysis.threat_category ?? inputTypeLabel(data.input_type)}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-faint">
                <StatusBadge status={data.status} />
                <RiskBadge level={data.risk_level} score={data.risk_score} />
                <span className="font-mono">#{data.id.slice(0, 8)}</span>
                <span>·</span>
                <span>{formatDate(data.created_at)}</span>
                {data.duration_ms ? (
                  <>
                    <span>·</span>
                    <span>{formatDuration(data.duration_ms)}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {report ? (
              <Button variant="secondary" size="sm" onClick={() => void downloadReport()}>
                <Download className="size-3.5" />
                Export JSON
              </Button>
            ) : null}
            {!isProcessing ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => retry.mutate()}
                loading={retry.isPending}
              >
                <RefreshCw className="size-3.5" />
                Re-run
              </Button>
            ) : null}
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {isProcessing ? (
        <Card>
          <CardContent className="space-y-5 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-cyan-300">
                <Loader2 className="size-5 animate-spin" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Investigation in progress
                </p>
                <p className="text-xs text-muted">
                  {STAGE_DEFS[data.stage_index]?.label ?? "Processing"} · this page updates
                  automatically.
                </p>
              </div>
            </div>
            <Progress
              value={(data.stage_index / STAGE_DEFS.length) * 100}
              indicatorClassName="bg-cyan-400"
            />
            <StageTimeline
              stages={processingStages(data.stage_index)}
              currentIndex={data.stage_index}
            />
          </CardContent>
        </Card>
      ) : null}

      {isFailed ? (
        <Card className="border-rose-500/30 bg-rose-500/[0.05]">
          <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-rose-400/30 bg-rose-400/10 text-rose-300">
                <AlertTriangle className="size-5" />
              </span>
              <div>
                <p className="text-sm font-medium text-rose-200">
                  This investigation could not be completed
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">
                  {data.error_message ??
                    "The evidence could not be processed. Check the file and try again."}
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => retry.mutate()}
              loading={retry.isPending}
            >
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {report ? (
        <>
          <Card className="overflow-hidden">
            <div className="grid gap-6 p-6 lg:grid-cols-[auto_1fr] lg:items-center">
              <div className="flex justify-center lg:justify-start">
                <RiskGauge score={report.risk.score} level={report.risk.level} size={188} />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-faint">
                    Why this score
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-strong">
                    {report.risk.explanation}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    ["Category", report.analysis.threat_category],
                    ["Correlation", report.correlation.correlation_level],
                    [
                      "Analysis",
                      report.analysis_mode === "generative"
                        ? "Generative AI"
                        : report.analysis_mode === "deterministic_fallback"
                          ? "Fallback"
                          : "Deterministic",
                    ],
                    ["Sources", `${report.sources.length} retrieved`],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-lg border border-border bg-surface/60 px-3 py-2"
                    >
                      <p className="text-[10px] uppercase tracking-[0.14em] text-faint">
                        {label}
                      </p>
                      <p className="mt-0.5 truncate text-xs font-medium text-foreground">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-4 text-teal-300" />
                Pipeline stages
              </CardTitle>
              <Badge tone="neutral">{formatDuration(data.duration_ms)} total</Badge>
            </CardHeader>
            <CardContent>
              <StageTimeline stages={report.stages} currentIndex={report.stages.length} />
            </CardContent>
          </Card>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">
                <Sparkles className="size-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="evidence">
                <ClipboardList className="size-4" />
                Evidence
              </TabsTrigger>
              <TabsTrigger value="correlation">
                <Waypoints className="size-4" />
                Correlation
              </TabsTrigger>
              <TabsTrigger value="sources">
                <BookOpenCheck className="size-4" />
                Sources
              </TabsTrigger>
              <TabsTrigger value="actions">
                <ShieldCheck className="size-4" />
                Actions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Investigation summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-strong">
                    {report.analysis.summary}
                  </p>
                  {report.analysis.intent.length > 0 ? (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {report.analysis.intent.map((intent) => (
                        <Badge key={intent} tone="cyan">
                          {intent}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  {report.notes.length > 0 ? (
                    <div className="mt-4 space-y-1.5 rounded-lg border border-amber-400/20 bg-amber-400/[0.05] p-3">
                      {report.notes.map((note) => (
                        <p key={note} className="flex items-start gap-2 text-[11px] text-amber-200/90">
                          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                          {note}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Risk signals</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {report.analysis.risk_signals.length > 0 ? (
                      report.analysis.risk_signals.map((signal, index) => (
                        <div
                          key={`${signal.name}-${index}`}
                          className="rounded-lg border border-border bg-surface/60 p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-foreground">
                              {titleCase(signal.name)}
                            </p>
                            <Badge tone={severityTone(signal.severity)}>
                              {signal.severity}
                            </Badge>
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-muted">
                            {signal.explanation}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted">No distinct risk signals were extracted.</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Claims to verify</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    {report.analysis.claims.length > 0 ? (
                      report.analysis.claims.map((claim, index) => (
                        <div
                          key={`${claim.claim}-${index}`}
                          className="rounded-lg border border-border bg-surface/60 p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs leading-relaxed text-muted-strong">
                              {claim.claim}
                            </p>
                            <Badge tone={verificationTone(claim.verification_status)}>
                              {titleCase(claim.verification_status)}
                            </Badge>
                          </div>
                          {claim.supporting_evidence.length > 0 ? (
                            <ul className="mt-2 space-y-1">
                              {claim.supporting_evidence.map((item) => (
                                <li
                                  key={item}
                                  className="flex items-start gap-1.5 text-[11px] text-faint"
                                >
                                  <span className="mt-1 size-1 shrink-0 rounded-full bg-teal-400/60" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted">No material claims were identified.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="evidence" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Extracted evidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <EvidenceGroup
                      icon={<Link2 className="size-3.5" />}
                      label="URLs"
                      values={report.extracted.urls}
                    />
                    <EvidenceGroup
                      icon={<Phone className="size-3.5" />}
                      label="Phone numbers"
                      values={report.extracted.phone_numbers}
                    />
                    <EvidenceGroup
                      icon={<Mail className="size-3.5" />}
                      label="Emails"
                      values={report.extracted.emails}
                    />
                    <EvidenceGroup
                      icon={<FileText className="size-3.5" />}
                      label="Money amounts"
                      values={report.extracted.money_amounts}
                    />
                    <EvidenceGroup
                      icon={<ShieldAlert className="size-3.5" />}
                      label="Organizations"
                      values={report.extracted.organizations}
                    />
                    <EvidenceGroup
                      icon={<ClipboardList className="size-3.5" />}
                      label="Requests"
                      values={report.extracted.requests}
                    />
                    <EvidenceGroup
                      icon={<AlertTriangle className="size-3.5" />}
                      label="Risk indicators"
                      values={report.extracted.risk_indicators.map(titleCase)}
                    />
                    <EvidenceGroup
                      icon={<Waypoints className="size-3.5" />}
                      label="Categories"
                      values={report.extracted.categories.map(titleCase)}
                    />
                  </div>

                  <div className="mt-5">
                    <p className="text-[10px] uppercase tracking-[0.16em] text-faint">
                      Submitted content
                    </p>
                    <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-surface/70 p-3 font-mono text-[11px] leading-relaxed text-muted-strong">
                      {report.text_excerpt}
                    </pre>
                  </div>
                </CardContent>
              </Card>

              {report.urls.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>URL intelligence</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {report.urls.map((url) => (
                      <div
                        key={url.url}
                        className="rounded-lg border border-border bg-surface/60 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="flex min-w-0 items-center gap-2 font-mono text-xs text-foreground">
                            <Globe className="size-3.5 shrink-0 text-teal-300" />
                            <span className="truncate">{url.url}</span>
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Badge tone={url.is_https ? "emerald" : "rose"}>
                              {url.is_https ? "HTTPS" : "No HTTPS"}
                            </Badge>
                            {url.brand_domain_mismatches.length > 0 ? (
                              <Badge tone="rose">Brand mismatch</Badge>
                            ) : null}
                          </div>
                        </div>
                        <p className="mt-2 text-[11px] leading-relaxed text-muted">
                          {url.assessment}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <Badge tone="neutral">{url.registered_domain || "unknown domain"}</Badge>
                          {url.is_url_shortener ? <Badge tone="amber">Shortener</Badge> : null}
                          {url.contains_punycode ? <Badge tone="rose">Punycode</Badge> : null}
                          {url.risk_indicators.map((indicator) => (
                            <Badge key={indicator} tone="orange">
                              {titleCase(indicator)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : null}
            </TabsContent>

            <TabsContent value="correlation" className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                <Card>
                  <CardHeader>
                    <CardTitle>Signal correlation</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CorrelationGraph correlation={report.correlation} />
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Correlated patterns</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2.5">
                      {report.correlation.correlations.length > 0 ? (
                        report.correlation.correlations.map((pattern: CorrelationPattern) => (
                          <div
                            key={pattern.name}
                            className="rounded-lg border border-border bg-surface/60 p-3"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-medium text-foreground">
                                {titleCase(pattern.name)}
                              </p>
                              <Badge tone={severityTone(pattern.severity)}>
                                {pattern.severity}
                              </Badge>
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-muted">
                              {pattern.explanation}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted">
                          No multi-signal correlation pattern was detected.
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Narrative</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm leading-relaxed text-muted-strong">
                        {report.correlation.narrative || "No correlation narrative available."}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="sources" className="space-y-3">
              {report.sources.length > 0 ? (
                report.sources.map((source, index) => (
                  <Card key={`${source.source}-${index}`}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <BookOpenCheck className="size-4 text-teal-300" />
                          <p className="text-xs font-medium text-foreground">{source.title}</p>
                        </div>
                        <Badge tone="teal">
                          relevance {(source.score * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-faint">
                        {source.source}
                      </p>
                      <p className="mt-2 text-[11px] leading-relaxed text-muted">
                        {source.text}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <EmptyState
                  icon={<BookOpenCheck className="size-5" />}
                  title="No trusted source matched"
                  description="No knowledge-base passage exceeded the relevance threshold for this evidence."
                />
              )}
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recommended actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {report.actions.map((action, index) => (
                    <div
                      key={action}
                      className="flex items-start gap-3 rounded-lg border border-border bg-surface/60 p-3"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-teal-400/25 bg-teal-400/10 font-mono text-[10px] text-teal-300">
                        {index + 1}
                      </span>
                      <p className="text-xs leading-relaxed text-muted-strong">{action}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-amber-400/20 bg-amber-400/[0.04]">
                <CardContent className="flex items-start gap-3 p-4">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
                  <p className="text-[11px] leading-relaxed text-amber-100/80">
                    TrustScan provides evidence-based risk intelligence. A high score means the
                    communication warrants verification and caution — it is not proof that a
                    person, organization, phone number or URL is fraudulent.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      ) : null}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this investigation?</DialogTitle>
            <DialogDescription>
              The report, extracted evidence and any uploaded file will be permanently removed.
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
              Delete investigation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EvidenceGroup({
  icon,
  label,
  values,
}: {
  icon: React.ReactNode;
  label: string;
  values: string[];
}) {
  return (
    <div className="rounded-lg border border-border bg-surface/60 p-3">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-faint">
        <span className="text-teal-300">{icon}</span>
        {label}
      </p>
      {values.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {values.slice(0, 6).map((value) => (
            <li key={value} className="truncate text-[11px] text-muted-strong" title={value}>
              {value}
            </li>
          ))}
          {values.length > 6 ? (
            <li className="text-[10px] text-faint">+{values.length - 6} more</li>
          ) : null}
        </ul>
      ) : (
        <p className="mt-2 text-[11px] text-faint">None detected</p>
      )}
    </div>
  );
}
