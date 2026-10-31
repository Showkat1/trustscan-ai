import { cn, riskTone } from "@/lib/utils";

interface RiskGaugeProps {
  score: number;
  level: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showBand?: boolean;
}

export function RiskGauge({
  score,
  level,
  size = 176,
  strokeWidth = 12,
  className,
  showBand = true,
}: RiskGaugeProps) {
  const tone = riskTone(level);
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const arc = circumference * 0.75;
  const offset = arc - (clamped / 100) * arc;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="-rotate-[135deg]" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(148,163,184,0.12)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circumference}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={tone.hex}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${arc} ${circumference}`}
          strokeDashoffset={offset}
          style={{
            transition: "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)",
            filter: `drop-shadow(0 0 10px ${tone.hex}55)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <span className="font-mono text-4xl font-semibold tabular-nums text-foreground">
          {clamped}
        </span>
        <span className="text-[10px] uppercase tracking-[0.22em] text-faint">out of 100</span>
        {showBand ? (
          <span
            className={cn(
              "mt-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
              tone.bg,
              tone.border,
              tone.text,
            )}
          >
            {tone.label}
          </span>
        ) : null}
      </div>
    </div>
  );
}
