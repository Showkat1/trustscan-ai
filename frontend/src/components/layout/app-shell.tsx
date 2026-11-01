"use client";

import { useQuery } from "@tanstack/react-query";
import {
  BookOpenCheck,
  ChevronRight,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MonitorSmartphone,
  Plus,
  ScanSearch,
  Settings,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { SystemMeta } from "@/lib/types";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/investigate", label: "Investigate", icon: ScanSearch },
  { href: "/device", label: "Device", icon: MonitorSmartphone },
  { href: "/history", label: "History", icon: History },
  { href: "/knowledge", label: "Knowledge", icon: BookOpenCheck },
  { href: "/settings", label: "Settings", icon: Settings },
];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "border border-teal-400/20 bg-teal-400/10 text-teal-100"
                : "border border-transparent text-muted hover:bg-card-strong hover:text-foreground",
            )}
          >
            <item.icon
              className={cn("size-4", active ? "text-teal-300" : "text-faint group-hover:text-muted-strong")}
            />
            <span className="flex-1">{item.label}</span>
            {active ? <ChevronRight className="size-3.5 text-teal-300/70" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

function EngineBadge() {
  const { data } = useQuery({
    queryKey: ["meta"],
    queryFn: () => api.get<SystemMeta>("/api/v1/meta", { auth: false }),
    staleTime: 5 * 60_000,
  });

  const generative = data?.llm_mode === "generative";

  return (
    <div className="rounded-lg border border-border bg-surface/70 p-3">
      <div className="flex items-center gap-2 text-[11px] text-muted">
        <Sparkles className="size-3.5 text-teal-300" />
        <span className="flex-1">Analysis engine</span>
        <span
          className={cn(
            "rounded-full border px-2 py-0.5 text-[10px] font-medium",
            generative
              ? "border-teal-400/25 bg-teal-400/10 text-teal-300"
              : "border-cyan-400/25 bg-cyan-400/10 text-cyan-300",
          )}
        >
          {generative ? "Generative" : "Deterministic"}
        </span>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-faint">
        {generative
          ? "LLM investigation with evidence-grounded fallback."
          : "No LLM key configured — transparent heuristic analysis."}
      </p>
    </div>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <Link href="/dashboard" onClick={onNavigate} className="px-1">
        <Logo />
      </Link>
      <Button asChild className="w-full" size="md">
        <Link href="/investigate" onClick={onNavigate}>
          <Plus className="size-4" />
          New investigation
        </Link>
      </Button>
      <NavLinks onNavigate={onNavigate} />
      <div className="mt-auto space-y-3">
        <EngineBadge />
        <div className="flex items-center gap-2 px-1 text-[10px] text-faint">
          <ShieldCheck className="size-3.5 text-teal-400/70" />
          Evidence-grounded · v2.0
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, status, logout } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") router.replace("/login");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="size-8 animate-spin rounded-full border-2 border-teal-400/70 border-t-transparent" />
          <p className="text-xs text-muted">Restoring your session…</p>
        </div>
      </div>
    );
  }

  if (status === "anonymous" || !user) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="text-sm text-muted">Redirecting to sign in…</p>
      </div>
    );
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-white/5 bg-surface/50 lg:block">
        <SidebarBody />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="animate-fade absolute inset-y-0 left-0 w-72 border-r border-border-strong bg-surface">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-md p-1.5 text-muted hover:bg-card-strong hover:text-foreground"
              aria-label="Close navigation"
            >
              <X className="size-4" />
            </button>
            <SidebarBody onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/5 bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="rounded-lg border border-border p-2 text-muted hover:text-foreground lg:hidden"
            aria-label="Open navigation"
          >
            <Menu className="size-4" />
          </button>

          <div className="hidden items-center gap-2 text-xs text-faint sm:flex">
            <span>Workspace</span>
            <ChevronRight className="size-3" />
            <span className="text-muted-strong">
              {NAV.find(
                (item) =>
                  pathname === item.href || pathname.startsWith(`${item.href}/`),
              )?.label ?? "Investigation"}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
              <Link href="/investigate">
                <Plus className="size-3.5" />
                Investigate
              </Link>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2.5 rounded-full border border-border bg-card py-1 pl-1 pr-3 transition-colors hover:border-border-strong"
                >
                  <span className="flex size-8 items-center justify-center rounded-full bg-gradient-to-br from-teal-400/30 to-cyan-500/20 text-xs font-semibold text-teal-100">
                    {initials(user.full_name)}
                  </span>
                  <span className="hidden text-left sm:block">
                    <span className="block max-w-36 truncate text-xs font-medium text-foreground">
                      {user.full_name}
                    </span>
                    <span className="block max-w-36 truncate text-[10px] text-faint">
                      {user.email}
                    </span>
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
                <div className="px-3 pb-2">
                  <p className="text-sm font-medium text-foreground">{user.full_name}</p>
                  <p className="text-xs text-muted">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <Settings />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void handleLogout()}>
                  <LogOut />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
