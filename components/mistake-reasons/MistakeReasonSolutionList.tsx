"use client";

import {Download, ExternalLink, Lightbulb, Sparkles} from "lucide-react";
import {useTranslations} from "next-intl";
import type {ReactNode} from "react";

import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import type {MistakeReasonDetail} from "@/src/services/student/types";

type MistakeReasonSolutionListProps = {
  reasons: MistakeReasonDetail[];
};

type ReasonSolutionCard = {
  reason: MistakeReasonDetail;
  solution: string | null;
};

function isSafeDownloadUrl(value: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function getDownloadFileName(value: string | null, fallback: string) {
  if (!value) return fallback;
  try {
    const url = new URL(value);
    const lastSegment = url.pathname.split("/").filter(Boolean).pop();
    if (!lastSegment) return fallback;
    return decodeURIComponent(lastSegment).replace(/[_-]+/g, " ").trim() || fallback;
  } catch {
    return fallback;
  }
}

function resolveStudentSolution(reason: MistakeReasonDetail) {
  const generalSolution = reason.general_solution.trim();
  if (generalSolution) return generalSolution;

  return [reason.solution_1, reason.solution_2, reason.solution_3]
    .map((solution) => (solution ?? "").trim())
    .filter(Boolean)[0] ?? null;
}

function getReasonResourceUrl(reason: MistakeReasonDetail) {
  return reason.resource_url ?? reason.file_url ?? reason.link_url;
}

function renderFormattedText(text: string) {
  const nodes: ReactNode[] = [];
  text.split("\n").forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      nodes.push(<br key={`br-${lineIndex}`} />);
    }

    line.split(/(\*\*[^*]+\*\*)/g).forEach((part, partIndex) => {
      const key = `${lineIndex}-${partIndex}`;
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        nodes.push(
          <strong key={key} className="font-semibold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
        return;
      }

      nodes.push(<span key={key}>{part}</span>);
    });
  });

  return nodes;
}

export function MistakeReasonSolutionList({reasons}: MistakeReasonSolutionListProps) {
  const t = useTranslations("mistakeReasons");
  const cards: ReasonSolutionCard[] = reasons.map((reason) => ({
    reason,
    solution: resolveStudentSolution(reason)
  }));

  return (
    <Card className="overflow-hidden rounded-3xl border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-0 shadow-sm shadow-blue-100/70 dark:border-blue-500/25 dark:from-blue-950/30 dark:via-card/70 dark:to-emerald-950/20 dark:shadow-none">
      <div className="border-b border-blue-100/80 bg-white/70 px-4 py-4 backdrop-blur dark:border-blue-500/20 dark:bg-white/[0.03] sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-base font-semibold">
              <span className="grid size-9 place-items-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-500/30">
                <Sparkles className="size-4" />
              </span>
              {t("aiInsightsTitle")}
            </p>
            <p className="max-w-2xl text-sm text-muted-foreground">{t("oneSolutionPerReason")}</p>
          </div>
          <span className="rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-200">
            {t("reasonCount", {count: reasons.length})}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {cards.map(({reason, solution}, index) => (
          <article
            key={reason.id}
            className="group rounded-2xl border border-slate-200/90 bg-white/85 p-4 shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-border/70 dark:bg-background/55 dark:shadow-none"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-relaxed text-foreground">
                    {renderFormattedText(reason.reason)}
                  </p>
                </div>
              </div>

              {isSafeDownloadUrl(getReasonResourceUrl(reason)) ? (
                <Button size="sm" variant="outline" asChild>
                  <a href={getReasonResourceUrl(reason) ?? "#"} target="_blank" rel="noopener noreferrer">
                    {reason.resource_type === "link" ? <ExternalLink className="size-4" /> : <Download className="size-4" />}
                    {reason.resource_type === "link"
                      ? t("openResource")
                      : getDownloadFileName(getReasonResourceUrl(reason), t("downloadGuide"))}
                  </a>
                </Button>
              ) : null}
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/85 p-4 dark:border-emerald-500/25 dark:bg-emerald-500/10">
              <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">
                <Lightbulb className="size-4" />
                {t("solutionForReason")}
              </p>
              <p className="text-sm leading-relaxed text-foreground/90">
                {solution ? renderFormattedText(solution) : t("emptySolutions")}
              </p>
            </div>
          </article>
        ))}
      </div>
    </Card>
  );
}
