"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {MostReportedQuestion} from "@/data/admin-reports";

type MostReportedQuestionsCardProps = {
  items: MostReportedQuestion[];
};

const rankTone = [
  "bg-rose-500/18 text-rose-300",
  "bg-amber-500/18 text-amber-300",
  "bg-blue-500/18 text-blue-300",
  "bg-slate-500/18 text-slate-300",
  "bg-slate-500/18 text-slate-300"
];

export function MostReportedQuestionsCard({items}: MostReportedQuestionsCardProps) {
  const t = useTranslations("adminReports");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/70 py-0">
      <CardHeader className="flex flex-row items-center justify-between px-5 py-4">
        <CardTitle className="text-lg font-semibold tracking-tight">{t("mostReportedQuestions")}</CardTitle>
        <p className="text-xs text-muted-foreground">{t("currentWindow")}</p>
      </CardHeader>
      <CardContent className="space-y-3 px-5 pb-5">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("table.empty")}</p>
        ) : (
          items.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/45 px-3 py-3">
              <span className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${rankTone[index] ?? rankTone[4]}`}>
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">
                  {t(`modules.${item.module}`)} • {t(`types.${item.reportType}`)}
                </p>
              </div>
              <p className="shrink-0 text-sm font-semibold">{t("reportCount", {count: item.reportCount})}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
