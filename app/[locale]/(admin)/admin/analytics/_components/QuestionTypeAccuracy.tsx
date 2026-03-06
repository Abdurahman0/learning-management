"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {QuestionTypeAccuracyItem} from "@/data/admin-analytics";

type QuestionTypeAccuracyProps = {
  items: QuestionTypeAccuracyItem[];
};

export function QuestionTypeAccuracy({items}: QuestionTypeAccuracyProps) {
  const t = useTranslations("adminAnalytics");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-5 pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight">{t("accuracyByQuestionType")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-1 pb-5">
        {items.map((item) => (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <p>{t(`questionTypes.${item.typeKey}`)}</p>
              <p className="font-semibold">{item.accuracy}%</p>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted/60">
              <div className="h-full rounded-full transition-all duration-200" style={{width: `${item.accuracy}%`, backgroundColor: item.color}} />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
