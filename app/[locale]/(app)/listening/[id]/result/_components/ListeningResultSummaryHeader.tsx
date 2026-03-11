"use client";

import Link from "next/link";
import { LayoutDashboard, RotateCcw } from "lucide-react";
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
}: ListeningResultSummaryHeaderProps) {
  const locale = useLocale();
  const t = useTranslations("listeningResult");

  return (
    <Card className="gap-5 rounded-3xl border-border/75 bg-[linear-gradient(120deg,rgba(11,23,43,0.95),rgba(10,25,49,0.82)_52%,rgba(22,48,92,0.32))] p-4 shadow-none sm:p-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:items-start">
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-[11px] tracking-[0.2em] text-blue-200/80 uppercase">{t("eyebrow")}</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{testTitle}</h1>
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1.5">
              <p className="text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
                {correct}
                <span className="text-foreground/75"> / {total}</span>
                <span className="ml-2 text-xl font-medium text-foreground/90 sm:text-2xl">{t("correctStatus")}</span>
              </p>
              <p className="pb-1 text-sm text-muted-foreground">{t("accuracyPercent", { percent: scorePercent })}</p>
            </div>
            <p className="text-sm text-blue-200">
              <span className="text-muted-foreground">{t("estimatedBand")}:</span> {estimatedBand}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button asChild className="h-9 rounded-xl px-4">
              <Link href="#review-main">{t("reviewAnswers")}</Link>
            </Button>
            <Button variant="outline" asChild className="h-9 rounded-xl border-border/70 bg-background/35 px-4">
              <Link href={`/${locale}/listening/${testId}?restart=1`}>
                <RotateCcw className="size-4" />
                {t("retakeTest")}
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-9 rounded-xl border-border/70 bg-background/35 px-4">
              <Link href={`/${locale}/dashboard`}>
                <LayoutDashboard className="size-4" />
                {t("goToDashboard")}
              </Link>
            </Button>
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
