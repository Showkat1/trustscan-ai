import { Check, Circle, Loader2, X } from "lucide-react";

import type { PipelineStage } from "@/lib/types";
import { cn, formatDuration } from "@/lib/utils";

export function StageTimeline({
  stages,
  currentIndex,
}: {
  stages: PipelineStage[];
  currentIndex?: number;
}) {
  if (stages.length === 0) return null;

  return (
    <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {stages.map((stage, index) => {
        const active = stage.status === "running";
        const done = stage.status === "completed";
        const failed = stage.status === "failed";
        const pending = stage.status === "pending";

        return (
          <li
            key={stage.key}
            className={cn(
              "flex items-start gap-2.5 rounded-lg border px-3 py-2.5",
              done && "border-teal-400/20 bg-teal-400/[0.04]",
              active && "border-cyan-400/30 bg-cyan-400/[0.06]",
              failed && "border-rose-400/30 bg-rose-400/[0.06]",
              pending && "border-border bg-surface/50",
            )}
          >
            <span
              className={cn(
                "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px]",
                done && "border-teal-400/40 bg-teal-400/15 text-teal-300",
                active && "border-cyan-400/40 bg-cyan-400/15 text-cyan-300",
                failed && "border-rose-400/40 bg-rose-400/15 text-rose-300",
                pending && "border-border bg-card text-faint",
              )}
            >
              {done ? (
                <Check className="size-3" />
              ) : failed ? (
                <X className="size-3" />
              ) : active ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Circle className="size-2" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center justify-between gap-2 text-[11px] font-medium text-foreground">
                <span className="truncate">{stage.label}</span>
                <span className="font-mono text-[10px] font-normal text-faint">
                  {stage.duration_ms !== null && stage.duration_ms !== undefined
                    ? formatDuration(stage.duration_ms)
                    : active
                      ? "…"
                      : ""}
                </span>
              </p>
              <p className="mt-0.5 truncate text-[10px] text-faint">
                {stage.detail ??
                  (pending
                    ? "Waiting"
                    : active
                      ? "In progress"
                      : index <= (currentIndex ?? -1)
                        ? "Completed"
                        : "Pending")}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
