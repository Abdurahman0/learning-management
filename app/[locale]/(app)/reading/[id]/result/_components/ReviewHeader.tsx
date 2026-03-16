"use client";

import Link from "next/link";
import { LayoutDashboard, RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ResultStatCard } from "./ResultStatCard";

type ReviewHeaderProps = {
  testId: string;
  testTitle: string;
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
  scorePercent: number;
  minutes: string;
  seconds: string;
  timerUsed: boolean;
  reviewHref?: string;
  showResultsButton?: boolean;
  resultsHref?: string;
};

export function ReviewHeader({
  testId,
  testTitle,
  correct,
  incorrect,
  unanswered,
  total,
  scorePercent,
  minutes,
  seconds,
  timerUsed,
  reviewHref,
  showResultsButton = false,
  resultsHref,
}: ReviewHeaderProps) {
  const locale = useLocale();
  const t = useTranslations("readingResult");

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
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button asChild className="h-9 rounded-xl px-4">
              <Link href={reviewHref ?? "#review-main"}>{t("reviewAnswers")}</Link>
            </Button>
            {showResultsButton && resultsHref ? (
              <Button variant="outline" asChild className="h-9 rounded-xl border-slate-200 bg-white/90 px-4 hover:bg-slate-100/80 dark:border-border/70 dark:bg-background/35">
                <Link href={resultsHref}>{t("resultsButton")}</Link>
              </Button>
            ) : null}
            <Button variant="outline" asChild className="h-9 rounded-xl border-slate-200 bg-white/90 px-4 hover:bg-slate-100/80 dark:border-border/70 dark:bg-background/35">
              <Link href={`/${locale}/reading/${testId}?restart=1`}>
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
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          <ResultStatCard label={t("correct")} value={correct} tone="success" />
          <ResultStatCard label={t("incorrect")} value={incorrect} tone="danger" />
          <ResultStatCard label={t("unanswered")} value={unanswered} tone="neutral" />
          <ResultStatCard
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
