"use client";

import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AccuracyItem = {
  label: string;
  value: string;
};

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
  accuracyByType: AccuracyItem[];
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
  accuracyByType,
}: ReviewHeaderProps) {
  const locale = useLocale();
  const t = useTranslations("readingReview");

  return (
    <Card className="grid gap-4 border-border/80 bg-card/70 p-4 sm:p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
      <div className="space-y-3">
        <div>
          <p className="text-xs tracking-[0.14em] text-muted-foreground uppercase">{t("title")}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{testTitle}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("scoreSummary", { correct, total, percent: scorePercent })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="#review-main">{t("reviewAnswers")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/${locale}/reading/${testId}?restart=1`}>
              <RotateCcw className="size-4" />
              {t("retakeTest")}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/70 bg-background/40 p-3">
          <p className="text-xs text-muted-foreground">{t("correct")}</p>
          <p className="text-lg font-semibold text-emerald-400">{correct}</p>
        </Card>
        <Card className="border-border/70 bg-background/40 p-3">
          <p className="text-xs text-muted-foreground">{t("incorrect")}</p>
          <p className="text-lg font-semibold text-rose-400">{incorrect}</p>
        </Card>
        <Card className="border-border/70 bg-background/40 p-3">
          <p className="text-xs text-muted-foreground">{t("skipped")}</p>
          <p className="text-lg font-semibold text-muted-foreground">{unanswered}</p>
        </Card>
        <Card className="border-border/70 bg-background/40 p-3">
          <p className="text-xs text-muted-foreground">{t("timeUsed")}</p>
          <p className="text-lg font-semibold">{minutes}:{seconds}</p>
          <p className="text-[11px] text-muted-foreground">{timerUsed ? t("timerUsed") : t("timerNotUsed")}</p>
        </Card>
      </div>

      {accuracyByType.length ? (
        <div className="lg:col-span-2">
          <p className="mb-2 text-xs tracking-[0.14em] text-muted-foreground uppercase">{t("accuracyByType")}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {accuracyByType.map((item) => (
              <Card key={item.label} className="border-border/70 bg-background/40 p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-base font-semibold">{item.value}</p>
              </Card>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
