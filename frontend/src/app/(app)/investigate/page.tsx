"use client";

import {
  ArrowRight,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  FileSearch,
  FileText,
  Image as ImageIcon,
  Link2,
  Loader2,
  MessageSquare,
  ScanText,
  ShieldAlert,
  Sparkles,
  UploadCloud,
  Waypoints,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api, errorMessage } from "@/lib/api";
import type { InputType } from "@/lib/types";
import { cn } from "@/lib/utils";

const MAX_TEXT = 20_000;
const MAX_FILE_MB = 10;

const SAMPLES = [
  {
    label: "Bank OTP phishing",
    text: "Your HBL account will be blocked immediately. Verify your account at https://secure-hbl-login.example.com/verify and send your OTP to 03001234567. Pay PKR 5,000 verification fee within 30 minutes.",
  },
  {
    label: "Prize scam",
    text: "Congratulations! You have won PKR 1,000,000 in the national lottery. To claim your prize, pay a PKR 10,000 tax processing fee within 24 hours and share your CNIC and bank account details.",
  },
  {
    label: "Benign notification",
    text: "Your HBL account statement for August is now available in your official mobile banking application. Please log in through the application to view it.",
  },
];

const STAGES = [
  { icon: FileSearch, label: "Evidence intake" },
  { icon: ScanText, label: "Structured extraction" },
  { icon: Link2, label: "URL intelligence" },
  { icon: BookOpenCheck, label: "Trusted retrieval" },
  { icon: BrainCircuit, label: "AI investigation" },
  { icon: Waypoints, label: "Correlation" },
  { icon: ShieldAlert, label: "Risk scoring" },
  { icon: CheckCircle2, label: "Guidance" },
];

interface CreateResponse {
  id: string;
  status: string;
}

export default function InvestigatePage() {
  const router = useRouter();
  const [tab, setTab] = useState<InputType>("message");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function resetFile() {
    setFile(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function selectFile(next: File | null) {
    if (!next) return;
    if (next.size > MAX_FILE_MB * 1024 * 1024) {
      toast.error(`File must be smaller than ${MAX_FILE_MB} MB`);
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(next);
    setPreview(next.type.startsWith("image/") ? URL.createObjectURL(next) : null);
  }

  function switchTab(value: string) {
    const next = value as InputType;
    if (next !== tab) resetFile();
    setTab(next);
  }

  const canSubmit =
    tab === "message"
      ? text.trim().length >= 3
      : tab === "url"
        ? url.trim().length > 3
        : Boolean(file);

  async function submit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    try {
      const form = new FormData();
      form.append("input_type", tab);
      if (tab === "message") form.append("text", text.trim());
      if (tab === "url") form.append("url", url.trim());
      if (file) form.append("file", file);

      const response = await api.upload<CreateResponse>("/api/v1/investigations", form);
      toast.success("Investigation started");
      router.push(`/investigations/${response.id}`);
    } catch (error) {
      toast.error(errorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-7">
      <div className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-teal-300">New investigation</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          What should TrustScan investigate?
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Submit the suspicious communication exactly as you received it. The more context you
          provide, the stronger the evidence trail.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr] lg:items-start">
        <Card>
          <CardContent className="p-5 sm:p-6">
            <Tabs value={tab} onValueChange={switchTab}>
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="message">
                  <MessageSquare className="size-4" />
                  Message
                </TabsTrigger>
                <TabsTrigger value="url">
                  <Link2 className="size-4" />
                  URL
                </TabsTrigger>
                <TabsTrigger value="screenshot">
                  <ImageIcon className="size-4" />
                  Screenshot
                </TabsTrigger>
                <TabsTrigger value="document">
                  <FileText className="size-4" />
                  Document
                </TabsTrigger>
              </TabsList>

              <TabsContent value="message" className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="message"
                      className="text-xs font-medium uppercase tracking-[0.14em] text-muted"
                    >
                      Message content
                    </label>
                    <span
                      className={cn(
                        "font-mono text-[11px]",
                        text.length > MAX_TEXT ? "text-rose-300" : "text-faint",
                      )}
                    >
                      {text.length.toLocaleString()} / {MAX_TEXT.toLocaleString()}
                    </span>
                  </div>
                  <Textarea
                    id="message"
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder="Paste the SMS, WhatsApp, email or social media message here…"
                    className="min-h-56"
                    maxLength={MAX_TEXT}
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] uppercase tracking-[0.14em] text-faint">
                    Try a sample
                  </span>
                  {SAMPLES.map((sample) => (
                    <button
                      key={sample.label}
                      type="button"
                      onClick={() => setText(sample.text)}
                      className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] text-muted transition-colors hover:border-teal-400/40 hover:text-teal-200"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="url" className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="url"
                    className="text-xs font-medium uppercase tracking-[0.14em] text-muted"
                  >
                    Suspicious link
                  </label>
                  <div className="relative">
                    <Link2 className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-faint" />
                    <Input
                      id="url"
                      value={url}
                      onChange={(event) => setUrl(event.target.value)}
                      placeholder="https://secure-hbl-login.example.com/verify"
                      className="pl-10 font-mono text-xs"
                      spellCheck={false}
                      autoCapitalize="none"
                    />
                  </div>
                  <p className="text-[11px] leading-relaxed text-faint">
                    TrustScan analyses URL structure, look-alike domains, shorteners and
                    obfuscation. It does not visit or execute the link.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="screenshot" className="space-y-4">
                <Dropzone
                  id="screenshot"
                  accept=".png,.jpg,.jpeg,.webp"
                  hint="PNG, JPG or WEBP · up to 10 MB"
                  note="Text is extracted with OCR before analysis."
                  file={file}
                  preview={preview}
                  dragging={dragging}
                  setDragging={setDragging}
                  onSelect={selectFile}
                  onClear={resetFile}
                  onBrowse={() => inputRef.current?.click()}
                  inputRef={inputRef}
                />
              </TabsContent>

              <TabsContent value="document" className="space-y-4">
                <Dropzone
                  id="document"
                  accept=".pdf,.txt,.md,.csv"
                  hint="PDF, TXT, MD or CSV · up to 10 MB"
                  note="Readable text is extracted from the document before analysis."
                  file={file}
                  preview={null}
                  dragging={dragging}
                  setDragging={setDragging}
                  onSelect={selectFile}
                  onClear={resetFile}
                  onBrowse={() => inputRef.current?.click()}
                  inputRef={inputRef}
                  documentMode
                />
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] leading-relaxed text-faint">
                By submitting, you confirm you have the right to share this content.
              </p>
              <Button onClick={submit} disabled={!canSubmit} loading={submitting} size="lg">
                {submitting ? "Investigating…" : "Run investigation"}
                {!submitting ? <ArrowRight className="size-4" /> : null}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-teal-300" />
                What happens next
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {STAGES.map((stage, index) => (
                  <li key={stage.label} className="flex items-center gap-3">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-faint">
                      <stage.icon className="size-3.5" />
                    </span>
                    <span className="flex-1 text-xs text-muted-strong">{stage.label}</span>
                    <span className="font-mono text-[10px] text-faint">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          <Card className="border-teal-400/15 bg-teal-400/[0.04]">
            <CardContent className="p-5">
              <Badge tone="teal">
                <ShieldAlert className="size-3" />
                Responsible use
              </Badge>
              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                TrustScan produces evidence-based risk intelligence. A high score is a reason to
                verify and pause — not proof that a person or organization committed a crime.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface DropzoneProps {
  id: string;
  accept: string;
  hint: string;
  note: string;
  file: File | null;
  preview: string | null;
  dragging: boolean;
  setDragging: (value: boolean) => void;
  onSelect: (file: File | null) => void;
  onClear: () => void;
  onBrowse: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  documentMode?: boolean;
}

function Dropzone({
  id,
  accept,
  hint,
  note,
  file,
  preview,
  dragging,
  setDragging,
  onSelect,
  onClear,
  onBrowse,
  inputRef,
  documentMode = false,
}: DropzoneProps) {
  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(event) => onSelect(event.target.files?.[0] ?? null)}
      />

      {file ? (
        <div className="flex items-center gap-4 rounded-xl border border-teal-400/25 bg-teal-400/[0.05] p-4">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Screenshot preview"
              className="size-20 rounded-lg border border-border object-cover"
            />
          ) : (
            <span className="flex size-12 items-center justify-center rounded-lg border border-border bg-card text-teal-300">
              <FileText className="size-5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-foreground">{file.name}</p>
            <p className="mt-0.5 text-[11px] text-faint">
              {(file.size / 1024 / 1024).toFixed(2)} MB · ready to investigate
            </p>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="rounded-md p-1.5 text-muted hover:bg-card-strong hover:text-foreground"
            aria-label="Remove file"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onBrowse}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            onSelect(event.dataTransfer.files?.[0] ?? null);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-3 rounded-xl border border-dashed px-6 py-12 text-center transition-colors",
            dragging
              ? "border-teal-400/60 bg-teal-400/[0.07]"
              : "border-border bg-surface/40 hover:border-teal-400/35 hover:bg-surface",
          )}
        >
          <span className="flex size-12 items-center justify-center rounded-full border border-border bg-card text-teal-300">
            {documentMode ? (
              <UploadCloud className="size-5" />
            ) : (
              <ImageIcon className="size-5" />
            )}
          </span>
          <span className="text-sm font-medium text-foreground">
            Drop your {documentMode ? "document" : "screenshot"} here
          </span>
          <span className="text-xs text-muted">or click to browse · {hint}</span>
          <span className="flex items-center gap-1.5 text-[11px] text-faint">
            <Loader2 className="size-3" />
            {note}
          </span>
        </button>
      )}
    </div>
  );
}
