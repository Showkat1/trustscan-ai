import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value);
}

export function formatDuration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function riskTone(level: string | null | undefined): {
  label: string;
  text: string;
  bg: string;
  border: string;
  dot: string;
  hex: string;
} {
  switch ((level || "").toUpperCase()) {
    case "CRITICAL":
      return {
        label: "Critical",
        text: "text-rose-300",
        bg: "bg-rose-500/10",
        border: "border-rose-500/30",
        dot: "bg-rose-400",
        hex: "#fb7185",
      };
    case "HIGH":
      return {
        label: "High",
        text: "text-orange-300",
        bg: "bg-orange-500/10",
        border: "border-orange-500/30",
        dot: "bg-orange-400",
        hex: "#fb923c",
      };
    case "MEDIUM":
      return {
        label: "Medium",
        text: "text-amber-300",
        bg: "bg-amber-500/10",
        border: "border-amber-500/30",
        dot: "bg-amber-400",
        hex: "#fbbf24",
      };
    case "LOW":
      return {
        label: "Low",
        text: "text-emerald-300",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/30",
        dot: "bg-emerald-400",
        hex: "#34d399",
      };
    default:
      return {
        label: "Unscored",
        text: "text-slate-300",
        bg: "bg-slate-500/10",
        border: "border-slate-500/30",
        dot: "bg-slate-400",
        hex: "#94a3b8",
      };
  }
}

export function inputTypeLabel(type: string): string {
  switch (type) {
    case "message":
      return "Message";
    case "url":
      return "URL";
    case "screenshot":
      return "Screenshot";
    case "document":
      return "Document";
    default:
      return titleCase(type);
  }
}

export function truncate(value: string, max = 120): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}
