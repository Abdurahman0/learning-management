"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {PassageDifficultyItem} from "@/data/admin-mistakes-analysis";

type PassageDifficultyRankCardProps = {
  items: PassageDifficultyItem[];
};

export function PassageDifficultyRankCard({items}: PassageDifficultyRankCardProps) {
  const t = useTranslations("adminMistakesAnalysis");

  return (
    <Card className="rounded-3xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-5 pb-2">
        <CardTitle className="text-xl font-semibold tracking-tight">{t("passageDifficultyRank")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-5">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="space-y-1.5 rounded-xl border border-border/70 bg-background/30 px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="inline-flex items-center gap-2 text-base leading-tight font-semibold tracking-tight">
                  <span className="text-muted-foreground">{String(item.rank).padStart(2, "0")}</span>
                  {item.title}
                </p>
                <span className="text-sm font-semibold text-rose-400">{item.accuracy}% {t("accShort")}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted/60">
                <div className="h-full rounded-full bg-amber-500" style={{width: `${Math.max(10, item.accuracy)}%`}} />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">{t("noPassages")}</p>
        )}
      </CardContent>
    </Card>
  );
}
