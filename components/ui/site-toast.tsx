"use client";

import {AlertCircle, CheckCircle2, Info, TriangleAlert} from "lucide-react";

import {cn} from "@/lib/utils";

type SiteToastTone = "info" | "success" | "warning" | "error";

export type SiteToastNotice = {
  title: string;
  description?: string;
  tone?: string;
};

type SiteToastProps = {
  notice: SiteToastNotice | null | undefined;
  className?: string;
};

const toneClassName: Record<SiteToastTone, string> = {
  info: "border-blue-400/45 bg-card/95 text-foreground",
  success: "border-emerald-400/45 bg-card/95 text-foreground",
  warning: "border-amber-400/45 bg-card/95 text-foreground",
  error: "border-rose-400/45 bg-card/95 text-foreground"
};

const iconClassName: Record<SiteToastTone, string> = {
  info: "text-blue-600 dark:text-blue-300",
  success: "text-emerald-600 dark:text-emerald-300",
  warning: "text-amber-600 dark:text-amber-300",
  error: "text-rose-600 dark:text-rose-300"
};

function normalizeTone(tone: string | undefined): SiteToastTone {
  if (!tone) return "info";
  const lowered = tone.toLowerCase();
  if (lowered === "success") return "success";
  if (lowered === "warning") return "warning";
  if (lowered === "danger" || lowered === "error") return "error";
  return "info";
}

function ToneIcon({tone}: {tone: SiteToastTone}) {
  const className = cn("size-4.5 shrink-0", iconClassName[tone]);
  if (tone === "success") return <CheckCircle2 className={className} />;
  if (tone === "warning") return <TriangleAlert className={className} />;
  if (tone === "error") return <AlertCircle className={className} />;
  return <Info className={className} />;
}

export function SiteToast({notice, className}: SiteToastProps) {
  if (!notice) {
    return null;
  }

  const tone = normalizeTone(notice.tone);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex justify-center px-3 sm:justify-end sm:px-6">
      <div
        className={cn(
          "pointer-events-auto w-full max-w-md rounded-xl border px-3.5 py-3 shadow-lg backdrop-blur-sm",
          "animate-in fade-in slide-in-from-top-2 duration-200",
          "dark:border-slate-600/70 dark:bg-slate-900/95",
          toneClassName[tone],
          className
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-2.5">
          <ToneIcon tone={tone} />
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-5">{notice.title}</p>
            {notice.description ? <p className="mt-0.5 text-sm leading-5 text-muted-foreground">{notice.description}</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
