"use client";

import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {PassagePerformance} from "@/data/admin-analytics";

type PassagePerformanceCardProps = {
  rows: PassagePerformance[];
};

export function PassagePerformanceCard({rows}: PassagePerformanceCardProps) {
  const t = useTranslations("adminAnalytics");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-5 pb-2">
        <CardTitle className="text-lg font-semibold tracking-tight">{t("passagePerformance")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-1 pb-5">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/40 px-3 py-2.5">
            <Badge className="size-7 justify-center rounded-lg border border-primary/30 bg-primary/12 text-primary">{row.rank}</Badge>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{row.title}</p>
              <p className="text-xs text-muted-foreground">{t("avgScore", {value: row.avgScore.toFixed(1)})}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
