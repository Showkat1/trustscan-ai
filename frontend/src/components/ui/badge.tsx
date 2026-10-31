import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide transition-colors",
  {
    variants: {
      tone: {
        neutral: "border-border-strong bg-card-strong text-muted-strong",
        teal: "border-teal-400/25 bg-teal-400/10 text-teal-300",
        cyan: "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
        amber: "border-amber-400/25 bg-amber-400/10 text-amber-300",
        orange: "border-orange-400/25 bg-orange-400/10 text-orange-300",
        rose: "border-rose-400/25 bg-rose-400/10 text-rose-300",
        emerald: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
        violet: "border-violet-400/25 bg-violet-400/10 text-violet-300",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
