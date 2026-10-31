"use client";

import { QueryProvider } from "@/lib/query-provider";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "sonner";

import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster
            theme="dark"
            position="top-right"
            toastOptions={{
              style: {
                background: "#0b1424",
                border: "1px solid #2b3f61",
                color: "#e9effc",
              },
            }}
          />
        </TooltipProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
