"use client";

import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PassageHeatmapItem } from "@/data/review-reading";

type ReviewMistakeHeatmapProps = {
  items: PassageHeatmapItem[];
};

function getLevelStyles(level: PassageHeatmapItem["level"]) {
  switch (level) {
    case "excellent":
      return {
        card: "border-emerald-200 bg-emerald-50 dark:border-emerald-500/45 dark:bg-emerald-500/10",
        text: "text-emerald-700 dark:text-emerald-300",
      };
    case "average":
      return {
        card: "border-amber-200 bg-amber-50 dark:border-amber-500/45 dark:bg-amber-500/10",
        text: "text-amber-700 dark:text-amber-300",
      };
    default:
      return {
        card: "border-rose-200 bg-rose-50 dark:border-rose-500/45 dark:bg-rose-500/10",
        text: "text-rose-700 dark:text-rose-300",
      };
  }
}

export function ReviewMistakeHeatmap({ items }: ReviewMistakeHeatmapProps) {
  const t = useTranslations("readingReview");

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{t("mistakeHeatmap")}</h2>
      <Card className="space-y-3 border-slate-200/85 bg-white/95 p-4 shadow-sm shadow-slate-200/50 dark:border-border/80 dark:bg-card/70 dark:shadow-none">
        <div className="grid gap-2 sm:grid-cols-3">
          {items.map((item) => {
            const styles = getLevelStyles(item.level);
            return (
              <Card key={item.passageId} className={cn("border p-3", styles.card)}>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.answeredCorrectly}/{item.total}</p>
                <p className={cn("mt-2 text-xs font-semibold uppercase", styles.text)}>
                  {t(item.level)}
                </p>
              </Card>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
