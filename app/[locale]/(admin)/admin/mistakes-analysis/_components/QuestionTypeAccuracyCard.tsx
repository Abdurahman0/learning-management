"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {QuestionTypeAccuracyItem} from "@/data/admin-mistakes-analysis";

type QuestionTypeAccuracyCardProps = {
  items: QuestionTypeAccuracyItem[];
};

const severityStyle = {
  critical: {
    bar: "bg-rose-500",
    dot: "bg-rose-500"
  },
  warning: {
    bar: "bg-amber-500",
    dot: "bg-amber-500"
  },
  good: {
    bar: "bg-emerald-500",
    dot: "bg-emerald-500"
  }
} as const;

export function QuestionTypeAccuracyCard({items}: QuestionTypeAccuracyCardProps) {
  const t = useTranslations("adminMistakesAnalysis");

  return (
    <Card className="rounded-3xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-5 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-2xl font-semibold tracking-tight">{t("accuracyByQuestionType")}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{t("accuracyByQuestionTypeHint")}</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-rose-500" />
              {t("severity.critical")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              {t("severity.warning")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              {t("severity.good")}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-5">
        {items.map((item) => (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-base font-medium">
              <span>{item.label}</span>
              <span>{item.accuracy}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-muted/55">
              <div className={`h-full rounded-full ${severityStyle[item.severity].bar}`} style={{width: `${item.accuracy}%`}} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
