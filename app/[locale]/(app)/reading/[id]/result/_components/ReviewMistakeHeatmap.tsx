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
        card: "border-emerald-500/45 bg-emerald-500/10",
        text: "text-emerald-300",
      };
    case "average":
      return {
        card: "border-amber-500/45 bg-amber-500/10",
        text: "text-amber-300",
      };
    default:
      return {
        card: "border-rose-500/45 bg-rose-500/10",
        text: "text-rose-300",
      };
  }
}

export function ReviewMistakeHeatmap({ items }: ReviewMistakeHeatmapProps) {
  const t = useTranslations("readingReview");

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{t("mistakeHeatmap")}</h2>
      <Card className="space-y-3 border-border/80 bg-card/70 p-4">
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
