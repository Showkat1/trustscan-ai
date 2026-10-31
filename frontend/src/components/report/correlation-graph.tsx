import { Waypoints } from "lucide-react";

import type { CorrelationResult } from "@/lib/types";
import { titleCase } from "@/lib/utils";

export function CorrelationGraph({ correlation }: { correlation: CorrelationResult }) {
  const signals = Array.from(new Set(correlation.evidence_signals)).slice(0, 8);

  if (signals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-12 text-center">
        <Waypoints className="size-5 text-faint" />
        <p className="text-xs text-muted">
          No correlated evidence signals were detected for this investigation.
        </p>
      </div>
    );
  }

  const center = 50;
  const radius = 36;
  const points = signals.map((signal, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / signals.length;
    return {
      signal,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    };
  });

  return (
    <div className="space-y-4">
      <div className="relative mx-auto aspect-square w-full max-w-md">
        <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden>
          {points.map((point) => (
            <line
              key={point.signal}
              x1={center}
              y1={center}
              x2={point.x}
              y2={point.y}
              stroke="rgba(45,212,191,0.28)"
              strokeWidth="0.5"
              strokeDasharray="2 2"
            />
          ))}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(148,163,184,0.1)"
            strokeWidth="0.4"
          />
        </svg>

        <div className="absolute left-1/2 top-1/2 flex size-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-teal-400/30 bg-gradient-to-br from-teal-400/15 to-cyan-500/10 text-center shadow-[0_0_40px_-12px_rgba(45,212,191,0.6)]">
          <span className="font-mono text-2xl font-semibold text-foreground">
            {correlation.correlation_score}
          </span>
          <span className="text-[9px] uppercase tracking-[0.16em] text-teal-200/80">
            {correlation.correlation_level}
          </span>
        </div>

        {points.map((point) => (
          <div
            key={point.signal}
            className="absolute w-28 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${point.x}%`, top: `${point.y}%` }}
          >
            <span className="block truncate rounded-full border border-border bg-card px-2.5 py-1 text-center text-[10px] text-muted-strong shadow-lg">
              {titleCase(point.signal)}
            </span>
          </div>
        ))}
      </div>

      {correlation.relationships.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-faint">Relationships</p>
          {correlation.relationships.slice(0, 6).map((relationship, index) => (
            <div
              key={`${relationship.source}-${relationship.target}-${index}`}
              className="flex flex-wrap items-center gap-1.5 rounded-lg border border-border bg-surface/50 px-2.5 py-1.5 text-[11px]"
            >
              <span className="text-muted-strong">{titleCase(relationship.source)}</span>
              <span className="text-teal-300">→</span>
              <span className="text-faint">{relationship.relationship}</span>
              <span className="text-teal-300">→</span>
              <span className="text-muted-strong">{titleCase(relationship.target)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
