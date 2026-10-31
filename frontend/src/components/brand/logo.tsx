import { ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

export function Logo({
  className,
  showWordmark = true,
  size = "md",
}: {
  className?: string;
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const box = size === "lg" ? "size-12" : size === "sm" ? "size-8" : "size-10";
  const icon = size === "lg" ? "size-6" : size === "sm" ? "size-4" : "size-5";
  const word = size === "lg" ? "text-2xl" : size === "sm" ? "text-base" : "text-lg";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "relative inline-flex items-center justify-center rounded-xl border border-teal-400/30 bg-gradient-to-br from-teal-400/20 to-cyan-500/10 text-teal-300 shadow-[0_0_24px_-8px_rgba(45,212,191,0.7)]",
          box,
        )}
      >
        <ShieldCheck className={icon} strokeWidth={2.1} />
      </span>
      {showWordmark ? (
        <span className={cn("font-semibold tracking-tight text-foreground", word)}>
          TrustScan<span className="text-teal-300"> AI</span>
        </span>
      ) : null}
    </span>
  );
}
