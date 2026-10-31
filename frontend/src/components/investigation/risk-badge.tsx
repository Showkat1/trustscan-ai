import { Badge } from "@/components/ui/badge";
import { riskTone } from "@/lib/utils";

export function RiskBadge({
  level,
  score,
  className,
}: {
  level: string | null | undefined;
  score?: number | null;
  className?: string;
}) {
  const tone = riskTone(level);
  const toneKey =
    tone.label === "Critical"
      ? "rose"
      : tone.label === "High"
        ? "orange"
        : tone.label === "Medium"
          ? "amber"
          : tone.label === "Low"
            ? "emerald"
            : "neutral";

  return (
    <Badge tone={toneKey} className={className}>
      <span className={`size-1.5 rounded-full ${tone.dot}`} />
      {tone.label}
      {typeof score === "number" ? (
        <span className="font-mono text-[10px] opacity-80">{score}</span>
      ) : null}
    </Badge>
  );
}
