import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-lg border border-border bg-surface px-3.5 py-2 text-sm text-foreground shadow-inner shadow-black/20 transition-colors",
        "placeholder:text-faint",
        "focus-visible:border-teal-400/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
