import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-32 w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground shadow-inner shadow-black/20 transition-colors",
      "placeholder:text-faint",
      "focus-visible:border-teal-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/20",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
