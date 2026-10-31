import { Badge } from "@/components/ui/badge";
import type { InvestigationStatus } from "@/lib/types";

const MAP: Record<
  InvestigationStatus,
  { label: string; tone: "neutral" | "teal" | "cyan" | "rose" | "amber" }
> = {
  queued: { label: "Queued", tone: "neutral" },
  running: { label: "Running", tone: "cyan" },
  completed: { label: "Completed", tone: "teal" },
  failed: { label: "Failed", tone: "rose" },
};

export function StatusBadge({ status }: { status: InvestigationStatus }) {
  const config = MAP[status] ?? { label: status, tone: "neutral" as const };
  return (
    <Badge tone={config.tone}>
      {status === "running" ? (
        <span className="size-1.5 animate-pulse rounded-full bg-current" />
      ) : null}
      {config.label}
    </Badge>
  );
}
