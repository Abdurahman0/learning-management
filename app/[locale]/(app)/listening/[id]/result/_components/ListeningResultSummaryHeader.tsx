"use client";

import Link from "next/link";
import { LayoutDashboard, RotateCcw, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListeningResultStatCard } from "./ListeningResultStatCard";

type ListeningResultSummaryHeaderProps = {
  testId: string;
  testTitle: string;
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
  scorePercent: number;
  estimatedBand: string;
  timerUsed: boolean;
  minutes: string;
  seconds: string;
  reviewHref?: string;
  reviewVariant?: "answers" | "analysis";
  showResultsButton?: boolean;
  resultsHref?: string;
  showAiAnalysisButton?: boolean;
  aiAnalysisNotice?: string | null;
  onAiAnalysisClick?: () => void;
};

export function ListeningResultSummaryHeader({
  testId,
  testTitle,
  correct,
  incorrect,
  unanswered,
  total,
  scorePercent,
  estimatedBand,
  timerUsed,
  minutes,
  seconds,
  reviewHref,
  reviewVariant = "answers",
  showResultsButton = false,
  resultsHref,
  showAiAnalysisButton = false,
  aiAnalysisNotice = null,
  onAiAnalysisClick,
}: ListeningResultSummaryHeaderProps) {
  const locale = useLocale();
  const t = useTranslations("listeningResult");
  const reviewCtaLabel =
    reviewVariant === "analysis"
      ? (t.has("reviewAnalysis") ? t("reviewAnalysis") : "Review Analysis")
      : t("reviewAnswers");

  return (
    <Card className="gap-5 rounded-3xl border-slate-200/85 bg-linear-to-br from-white via-slate-50 to-blue-50 p-4 shadow-sm shadow-slate-200/60 dark:border-border/75 dark:bg-[linear-gradient(120deg,rgba(11,23,43,0.95),rgba(10,25,49,0.82)_52%,rgba(22,48,92,0.32))] dark:shadow-none sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:items-start">
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] tracking-[0.2em] text-slate-600 uppercase dark:text-blue-200/80">{t("eyebrow")}</p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-foreground sm:text-3xl">{testTitle}</h1>
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1.5">
              <p className="text-3xl font-semibold leading-tight text-slate-900 dark:text-foreground sm:text-4xl">
                {correct}
                <span className="text-slate-600 dark:text-foreground/75"> / {total}</span>
                <span className="ml-2 text-xl font-medium text-slate-700 dark:text-foreground/90 sm:text-2xl">{t("correctStatus")}</span>
              </p>
              <p className="pb-1 text-sm text-slate-600 dark:text-muted-foreground">{t("accuracyPercent", { percent: scorePercent })}</p>
            </div>
            <p className="text-sm font-medium text-blue-700 dark:text-blue-200">
              <span className="font-normal text-slate-600 dark:text-muted-foreground">{t("estimatedBand")}:</span> {estimatedBand}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2.5">
              <Button asChild className="h-9 rounded-xl px-4">
                <Link href={reviewHref ?? "#review-main"}>{reviewCtaLabel}</Link>
              </Button>
              {showResultsButton && resultsHref ? (
                <Button variant="outline" asChild className="h-9 rounded-xl border-slate-200 bg-white/90 px-4 hover:bg-slate-100/80 dark:border-border/70 dark:bg-background/35">
                  <Link href={resultsHref}>{t("resultsButton")}</Link>
                </Button>
              ) : null}
              <Button variant="outline" asChild className="h-9 rounded-xl border-slate-200 bg-white/90 px-4 hover:bg-slate-100/80 dark:border-border/70 dark:bg-background/35">
                <Link href={`/${locale}/listening/${testId}?restart=1`}>
                  <RotateCcw className="size-4" />
                  {t("retakeTest")}
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-9 rounded-xl border-slate-200 bg-white/90 px-4 hover:bg-slate-100/80 dark:border-border/70 dark:bg-background/35">
                <Link href={`/${locale}/dashboard`}>
                  <LayoutDashboard className="size-4" />
                  {t("goToDashboard")}
                </Link>
              </Button>
            </div>

            {showAiAnalysisButton ? (
              <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end sm:shrink-0">
                {aiAnalysisNotice ? (
                  <p className="max-w-sm rounded-xl border border-amber-300/70 bg-amber-100/80 px-3 py-2 text-xs font-medium text-amber-800 shadow-sm dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-100">
                    {aiAnalysisNotice}
                  </p>
                ) : null}
                <Button
                  type="button"
                  onClick={onAiAnalysisClick}
                  className="h-10 rounded-xl border-0 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 px-5 font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-500 hover:via-cyan-500 hover:to-emerald-400 hover:text-white dark:shadow-blue-950/40"
                >
                  <Sparkles className="size-4" />
                  {t.has("aiAnalysis") ? t("aiAnalysis") : "AI analysis"}
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <ListeningResultStatCard label={t("correct")} value={correct} tone="success" />
          <ListeningResultStatCard label={t("incorrect")} value={incorrect} tone="danger" />
          <ListeningResultStatCard label={t("unanswered")} value={unanswered} tone="neutral" />
          <ListeningResultStatCard
            label={t("timeUsed")}
            value={timerUsed ? `${minutes}:${seconds}` : t("practiceTest")}
            hint={timerUsed ? t("timerUsed") : t("practiceMode")}
            tone="info"
          />
        </div>
      </div>
    </Card>
  );
}
