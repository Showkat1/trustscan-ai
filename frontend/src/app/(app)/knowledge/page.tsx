"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpenCheck,
  Database,
  FileText,
  Layers,
  Loader2,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api, errorMessage } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type {
  KnowledgeDocument,
  KnowledgeDocumentDetail,
  KnowledgeSearchHit,
  KnowledgeSearchResponse,
} from "@/lib/types";
import { formatDate, titleCase } from "@/lib/utils";

export default function KnowledgePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [term, setTerm] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const documents = useQuery({
    queryKey: ["knowledge"],
    queryFn: () => api.get<KnowledgeDocument[]>("/api/v1/knowledge"),
  });

  const search = useQuery({
    queryKey: ["knowledge-search", submitted],
    queryFn: () =>
      api.get<KnowledgeSearchResponse>(
        `/api/v1/knowledge/search?q=${encodeURIComponent(submitted)}&top_k=5`,
      ),
    enabled: submitted.trim().length >= 2,
  });

  const detail = useQuery({
    queryKey: ["knowledge-document", openId],
    queryFn: () => api.get<KnowledgeDocumentDetail>(`/api/v1/knowledge/${openId}`),
    enabled: Boolean(openId),
  });

  const reindex = useMutation({
    mutationFn: () => api.post<Record<string, number>>("/api/v1/knowledge/reindex?force=true"),
    onSuccess: async (result) => {
      toast.success(
        `Knowledge base reindexed · ${result.indexed ?? 0} document(s), ${result.chunks ?? 0} chunk(s)`,
      );
      await queryClient.invalidateQueries({ queryKey: ["knowledge"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  const totalChunks = documents.data?.reduce((sum, doc) => sum + doc.chunk_count, 0) ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-teal-300">Knowledge base</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            Trusted-source retrieval
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">
            TrustScan grounds its investigation in a curated cybersecurity knowledge base. Search
            it semantically or inspect what the RAG pipeline can retrieve.
          </p>
        </div>
        {user?.role === "admin" ? (
          <Button
            variant="secondary"
            onClick={() => reindex.mutate()}
            loading={reindex.isPending}
          >
            <RefreshCw className="size-4" />
            Reindex
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Documents",
            value: documents.data?.length ?? 0,
            icon: FileText,
          },
          { label: "Indexed chunks", value: totalChunks, icon: Layers },
          {
            label: "Retrieval",
            value: "pgvector",
            icon: Database,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <span className="flex size-9 items-center justify-center rounded-lg border border-teal-400/20 bg-teal-400/10 text-teal-300">
                <stat.icon className="size-4" />
              </span>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-faint">
                  {stat.label}
                </p>
                <p className="font-mono text-lg font-semibold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-teal-300" />
            Semantic search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            className="flex flex-col gap-2 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(term.trim());
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
              <Input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="e.g. bank OTP phishing link"
                className="pl-10"
                aria-label="Search the knowledge base"
              />
            </div>
            <Button type="submit" disabled={term.trim().length < 2 || search.isFetching}>
              {search.isFetching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Search
            </Button>
          </form>

          {submitted.length >= 2 ? (
            search.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full" />
                ))}
              </div>
            ) : search.data && search.data.hits.length > 0 ? (
              <div className="space-y-2">
                {search.data.hits.map((hit: KnowledgeSearchHit, index) => (
                  <button
                    key={`${hit.document_id}-${index}`}
                    type="button"
                    onClick={() => setOpenId(hit.document_id)}
                    className="w-full rounded-lg border border-border bg-surface/60 p-3.5 text-left transition-colors hover:border-teal-400/30 hover:bg-card"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium text-foreground">{hit.title}</p>
                      <Badge tone="teal">{(hit.score * 100).toFixed(0)}% match</Badge>
                    </div>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-faint">
                      {hit.source}
                    </p>
                    <p className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-muted">
                      {hit.text}
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Search className="size-5" />}
                title="No passage matched"
                description="Try different wording, or browse the documents below."
              />
            )
          ) : (
            <p className="text-[11px] text-faint">
              Enter at least two characters to search the indexed guidance.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-medium text-foreground">Indexed documents</h2>
        {documents.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32 w-full" />
            ))}
          </div>
        ) : documents.data && documents.data.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {documents.data.map((document) => (
              <Card key={document.id} className="transition-colors hover:border-teal-400/25">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card-strong text-teal-300">
                        <BookOpenCheck className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{document.title}</p>
                        <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-faint">
                          {document.source}
                        </p>
                      </div>
                    </div>
                    <Badge tone="cyan">{titleCase(document.category)}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-faint">
                    <span>
                      {document.chunk_count} chunk{document.chunk_count === 1 ? "" : "s"} ·{" "}
                      {formatDate(document.created_at)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setOpenId(document.id)}
                      className="font-medium text-teal-300 hover:text-teal-200"
                    >
                      Inspect
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<BookOpenCheck className="size-5" />}
            title="Knowledge base is empty"
            description="An administrator can reindex the trusted documents from the backend."
          />
        )}
      </div>

      <Dialog open={Boolean(openId)} onOpenChange={(open) => !open && setOpenId(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{detail.data?.title ?? "Knowledge document"}</DialogTitle>
            <DialogDescription>
              {detail.data?.source} · {detail.data?.chunk_count ?? 0} indexed chunk(s)
            </DialogDescription>
          </DialogHeader>
          {detail.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : detail.data ? (
            <div className="space-y-4">
              <div className="max-h-64 overflow-auto rounded-lg border border-border bg-surface/60 p-3">
                <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-muted-strong">
                  {detail.data.content}
                </pre>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-faint">
                  Retrieval chunks
                </p>
                <div className="mt-2 space-y-2">
                  {detail.data.chunks.map((chunk) => (
                    <div
                      key={chunk.id}
                      className="rounded-lg border border-border bg-surface/50 p-3"
                    >
                      <p className="text-[10px] font-mono text-teal-300">
                        chunk {chunk.chunk_index + 1}
                      </p>
                      <p className="mt-1 text-[11px] leading-relaxed text-muted">
                        {chunk.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted">The document could not be loaded.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
