"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Filter,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";import { toast } from "sonner";

import { RiskBadge } from "@/components/investigation/risk-badge";
import { StatusBadge } from "@/components/investigation/status-badge";
import { TypeIcon } from "@/components/investigation/type-icon";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, errorMessage } from "@/lib/api";
import type { InvestigationListItem, InvestigationPage } from "@/lib/types";
import { formatDate, formatDuration, inputTypeLabel, truncate } from "@/lib/utils";

const PAGE_SIZE = 12;

function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function HistoryPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [risk, setRisk] = useState("all");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<InvestigationListItem | null>(null);

  const debouncedSearch = useDebounced(search);

  function changeFilter(
    setter: (value: string) => void,
  ): (value: string) => void {
    return (value: string) => {
      setter(value);
      setPage(1);
    };
  }

  const handleSearch = changeFilter(setSearch);
  const handleRisk = changeFilter(setRisk);
  const handleStatus = changeFilter(setStatus);
  const handleType = changeFilter(setType);

  const params = new URLSearchParams({
    page: String(page),
    page_size: String(PAGE_SIZE),
  });
  if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
  if (risk !== "all") params.set("risk_level", risk);
  if (status !== "all") params.set("status", status);
  if (type !== "all") params.set("input_type", type);

  const queryKey = ["investigations", params.toString()];

  const investigations = useQuery({
    queryKey,
    queryFn: () => api.get<InvestigationPage>(`/api/v1/investigations?${params.toString()}`),
    placeholderData: (previous) => previous,
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/api/v1/investigations/${id}`),
    onSuccess: async () => {
      toast.success("Investigation deleted");
      setPendingDelete(null);
      await queryClient.invalidateQueries({ queryKey: ["investigations"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const data = investigations.data;
  const filtersActive = Boolean(search || risk !== "all" || status !== "all" || type !== "all");

  function resetFilters() {
    setSearch("");
    setRisk("all");
    setStatus("all");
    setType("all");
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-teal-300">History</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            All investigations
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {data ? `${data.total} investigation${data.total === 1 ? "" : "s"} on record` : "Loading your record…"}
          </p>
        </div>
        <Button asChild>
          <Link href="/investigate">
            <Plus className="size-4" />
            New investigation
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="grid gap-2.5 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <Input
                value={search}
                onChange={(event) => handleSearch(event.target.value)}
                placeholder="Search evidence or threat category…"
                className="pl-10"
                aria-label="Search investigations"
              />
            </div>

            <Select value={risk} onValueChange={handleRisk}>
              <SelectTrigger aria-label="Filter by risk">
                <SelectValue placeholder="Risk" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All risk levels</SelectItem>
                <SelectItem value="CRITICAL">Critical</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={handleStatus}>
              <SelectTrigger aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={type} onValueChange={handleType}>
              <SelectTrigger aria-label="Filter by input type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="message">Message</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="screenshot">Screenshot</SelectItem>
                <SelectItem value="document">Document</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtersActive ? (
            <div className="mt-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] text-faint">
                <Filter className="size-3" />
                Filters applied
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="text-[11px] text-teal-300 hover:text-teal-200"
              >
                Clear filters
              </button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {investigations.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="space-y-3">
          <Card>
            <CardContent className="divide-y divide-border/70 p-0">
              {data.items.map((item) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-card-strong/40"
                >
                  <TypeIcon type={item.input_type} />
                  <Link href={`/investigations/${item.id}`} className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground group-hover:text-teal-200">
                      {item.input_excerpt ? truncate(item.input_excerpt, 110) : inputTypeLabel(item.input_type)}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-faint">
                      <span>{inputTypeLabel(item.input_type)}</span>
                      <span>·</span>
                      <span>{formatDate(item.created_at)}</span>
                      <span>·</span>
                      <span>{formatDuration(item.duration_ms)}</span>
                      {item.threat_category ? (
                        <>
                          <span>·</span>
                          <span className="truncate">{item.threat_category}</span>
                        </>
                      ) : null}
                    </p>
                  </Link>
                  <div className="hidden items-center gap-2 md:flex">
                    <StatusBadge status={item.status} />
                    <RiskBadge level={item.risk_level} score={item.risk_score} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(item)}
                    className="rounded-md p-1.5 text-faint opacity-0 transition-opacity hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label="Delete investigation"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <Link
                    href={`/investigations/${item.id}`}
                    className="rounded-md p-1.5 text-faint hover:text-teal-300"
                    aria-label="Open investigation"
                  >
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-[11px] text-faint">
              Page {data.page} of {data.pages} · {data.total} total
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={data.page <= 1 || investigations.isFetching}
              >
                <ArrowLeft className="size-3.5" />
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((value) => Math.min(data.pages, value + 1))}
                disabled={data.page >= data.pages || investigations.isFetching}
              >
                Next
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Search className="size-5" />}
          title={filtersActive ? "No matching investigations" : "No investigations yet"}
          description={
            filtersActive
              ? "Try widening your filters or clearing the search term."
              : "Your investigations will appear here once you run your first analysis."
          }
          action={
            filtersActive ? (
              <Button variant="secondary" size="sm" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href="/investigate">
                  <Plus className="size-3.5" />
                  Start an investigation
                </Link>
              </Button>
            )
          }
        />
      )}

      <Dialog open={Boolean(pendingDelete)} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this investigation?</DialogTitle>
            <DialogDescription>
              This permanently removes the report, extracted evidence and any uploaded file.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={remove.isPending}
              onClick={() => pendingDelete && remove.mutate(pendingDelete.id)}
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
