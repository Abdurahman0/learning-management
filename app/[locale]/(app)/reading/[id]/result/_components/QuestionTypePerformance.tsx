"use client";

import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import type { ReadingQuestion } from "@/data/reading-tests";
import { cn } from "@/lib/utils";

export type QuestionTypePerformanceItem = {
  type: ReadingQuestion["type"];
  correct: number;
  total: number;
  percent: number;
};

type QuestionTypePerformanceProps = {
  items: QuestionTypePerformanceItem[];
};

function getTone(percent: number) {
  if (percent >= 75) {
    return {
      card: "border-emerald-200 bg-emerald-50 dark:border-emerald-400/20 dark:bg-emerald-500/[0.06]",
      bar: "bg-emerald-500 dark:bg-emerald-400/85",
      value: "text-emerald-700 dark:text-emerald-200",
    };
  }

  if (percent >= 45) {
    return {
      card: "border-blue-200 bg-blue-50 dark:border-blue-400/20 dark:bg-blue-500/[0.06]",
      bar: "bg-blue-500 dark:bg-blue-400/85",
      value: "text-blue-700 dark:text-blue-200",
    };
  }

  return {
    card: "border-rose-200 bg-rose-50 dark:border-rose-400/25 dark:bg-rose-500/[0.07]",
    bar: "bg-rose-500 dark:bg-rose-400/85",
    value: "text-rose-700 dark:text-rose-200",
  };
}

export function QuestionTypePerformance({ items }: QuestionTypePerformanceProps) {
  const t = useTranslations("readingResult");

  if (!items.length) return null;

  return (
    <Card className="gap-4 rounded-3xl border-slate-200/85 bg-white/95 p-4 shadow-sm shadow-slate-200/50 dark:border-border/75 dark:bg-card/75 dark:shadow-none sm:p-5">
      <div className="space-y-1">
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">{t("performanceEyebrow")}</p>
        <h2 className="text-lg font-semibold tracking-tight">{t("performanceByType")}</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const tone = getTone(item.percent);
          return (
            <Card key={item.type} className={cn("gap-2 rounded-2xl p-3 shadow-none", tone.card)}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium leading-tight">{t(`questionTypes.${item.type}`)}</p>
                <span className={cn("text-xs font-semibold", tone.value)}>{item.percent}%</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {item.correct}/{item.total}
              </p>
              <div className="h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-background/70">
                <div className={cn("h-full rounded-full transition-all", tone.bar)} style={{ width: `${item.percent}%` }} />
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
}
