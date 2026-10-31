import type { Metadata, Viewport } from "next";

import { Providers } from "@/components/providers";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TrustScan AI — Verify Before You Trust",
    template: "%s · TrustScan AI",
  },
  description:
    "Evidence-grounded Generative AI that investigates phishing, scams, impersonation and fraud — then explains the risk and tells you what to do next.",
  applicationName: "TrustScan AI",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  keywords: [
    "fraud detection",
    "phishing",
    "scam investigation",
    "digital trust",
    "explainable AI",
    "RAG",
  ],
  authors: [{ name: "TrustScan AI" }],
  openGraph: {
    title: "TrustScan AI — Verify Before You Trust",
    description:
      "Investigate suspicious messages, links, screenshots and documents with explainable AI risk scoring.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050a13",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
