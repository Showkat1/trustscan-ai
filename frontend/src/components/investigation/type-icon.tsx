import { FileText, Image as ImageIcon, Link2, MessageSquare } from "lucide-react";

import { cn } from "@/lib/utils";

export function TypeIcon({
  type,
  className,
}: {
  type: string;
  className?: string;
}) {
  const Icon =
    type === "url"
      ? Link2
      : type === "screenshot"
        ? ImageIcon
        : type === "document"
          ? FileText
          : MessageSquare;

  return (
    <span
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card-strong text-muted-strong",
        className,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}
