"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Gauge,
  Plus,
  Radar,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { RiskBadge } from "@/components/investigation/risk-badge";
import { StatusBadge } from "@/components/investigation/status-badge";
import { TypeIcon } from "@/components/investigation/type-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { InvestigationPage, OverviewStats } from "@/lib/types";
import { formatRelative, inputTypeLabel, riskTone } from "@/lib/utils";

const STAT_STYLES = [
  { key: "total", label: "Investigations", icon: Radar, tone: "text-teal-300" },
  { key: "high", label: "High & critical", icon: ShieldAlert, tone: "text-rose-300" },
  { key: "average", label: "Average score", icon: Gauge, tone: "text-amber-300" },
  { key: "week", label: "Last 7 days", icon: Activity, tone: "text-cyan-300" },
] as const;

export default function DashboardPage() {
  const { user } = useAuth();

  const overview = useQuery({
    queryKey: ["overview"],
    queryFn: () => api.get<OverviewStats>("/api/v1/analytics/overview"),
  });

  const recent = useQuery({
    queryKey: ["investigations", "recent"],
    queryFn: () => api.get<InvestigationPage>("/api/v1/investigations?page=1&page_size=6"),
  });

  const stats = overview.data;
  const distribution = stats?.risk_distribution;
  const totalScored = distribution
    ? distribution.LOW + distribution.MEDIUM + distribution.HIGH + distribution.CRITICAL
    : 0;

  const values = {
    total: stats?.total ?? 0,
    high: (stats?.high_risk ?? 0) + (stats?.critical_risk ?? 0),
    average: stats ? Math.round(stats.average_score) : 0,
    week: stats?.last_7_days ?? 0,
  };

  const firstName = user?.full_name.split(" ")[0] ?? "there";

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-teal-300">Workspace</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Here is the current picture of your investigations.
          </p>
        </div>
        <Button asChild>
          <Link href="/investigate">
            <Plus className="size-4" />
            New investigation
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_STYLES.map((stat) => (
          <Card key={stat.key} className="relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <p className="text-[11px] uppercase tracking-[0.16em] text-faint">{stat.label}</p>
                <stat.icon className={`size-4 ${stat.tone}`} />
              </div>
              {overview.isLoading ? (
                <Skeleton className="mt-3 h-8 w-20" />
              ) : (
                <p className="mt-3 font-mono text-3xl font-semibold tabular-nums text-foreground">
                  {stat.key === "average" ? `${values.average}` : values[stat.key]}
                  {stat.key === "average" ? (
                    <span className="ml-1 text-sm font-normal text-faint">/100</span>
                  ) : null}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Risk distribution</CardTitle>
            <Badge tone="neutral">{totalScored} scored</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {overview.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Skeleton key={index} className="h-9 w-full" />
                ))}
              </div>
            ) : (
              (["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((level) => {
                const count = distribution?.[level] ?? 0;
                const percent = totalScored ? (count / totalScored) * 100 : 0;
                const tone = riskTone(level);
                return (
                  <div key={level}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className={`font-medium ${tone.text}`}>{tone.label}</span>
                      <span className="font-mono text-faint">
                        {count} · {Math.round(percent)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-surface">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${percent}%`, backgroundColor: tone.hex }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline health</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Completed", value: stats?.completed ?? 0, tone: "text-teal-300" },
              { label: "In progress", value: stats?.running ?? 0, tone: "text-cyan-300" },
              { label: "Failed", value: stats?.failed ?? 0, tone: "text-rose-300" },
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between rounded-lg border border-border bg-surface/60 px-3.5 py-2.5"
              >
                <span className="text-xs text-muted-strong">{row.label}</span>
                <span className={`font-mono text-sm ${row.tone}`}>{row.value}</span>
              </div>
            ))}
            <div className="flex items-start gap-2 rounded-lg border border-teal-400/15 bg-teal-400/[0.05] p-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-300" />
              <p className="text-[11px] leading-relaxed text-muted">
                Every completed investigation stores its full evidence trail and stage timings
                for auditability.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent investigations</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/history">
              View all
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recent.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-full" />
              ))}
            </div>
          ) : recent.data && recent.data.items.length > 0 ? (
            <div className="divide-y divide-border/70">
              {recent.data.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/investigations/${item.id}`}
                  className="group flex items-center gap-3 py-3 transition-colors first:pt-0 last:pb-0"
                >
                  <TypeIcon type={item.input_type} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground group-hover:text-teal-200">
                      {item.input_excerpt || inputTypeLabel(item.input_type)}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-faint">
                      <span>{inputTypeLabel(item.input_type)}</span>
                      <span>·</span>
                      <span>{formatRelative(item.created_at)}</span>
                      {item.threat_category ? (
                        <>
                          <span>·</span>
                          <span className="truncate">{item.threat_category}</span>
                        </>
                      ) : null}
                    </p>
                  </div>
                  <div className="hidden items-center gap-2 sm:flex">
                    <StatusBadge status={item.status} />
                    <RiskBadge level={item.risk_level} score={item.risk_score} />
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-teal-300" />
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Sparkles className="size-5" />}
              title="No investigations yet"
              description="Paste a suspicious message, drop a link, or upload a screenshot to see TrustScan in action."
              action={
                <Button asChild size="sm">
                  <Link href="/investigate">
                    <Plus className="size-3.5" />
                    Start your first investigation
                  </Link>
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
