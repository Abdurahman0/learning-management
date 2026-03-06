"use client";

import {BrainCircuit, ChartNoAxesColumnIncreasing, UsersRound} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {InsightCard} from "@/data/admin-analytics";

type InsightsCardsProps = {
  items: InsightCard[];
};

const toneMap = {
  default: "border-border/70 bg-card/75",
  success: "border-emerald-500/25 bg-emerald-500/10",
  info: "border-sky-500/25 bg-sky-500/10"
} as const;

const iconMap = {
  risingDifficultyGap: ChartNoAxesColumnIncreasing,
  vocabularyRetention: BrainCircuit,
  regionalPerformance: UsersRound
} as const;

export function InsightsCards({items}: InsightsCardsProps) {
  const t = useTranslations("adminAnalytics");

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold tracking-tight">{t("aiInsights")}</h2>
      <div className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const Icon = iconMap[item.titleKey];
          return (
            <Card key={item.id} className={`rounded-2xl py-0 ${toneMap[item.tone]}`}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pt-5 pb-2">
                <Icon className="size-4.5 text-primary" />
                <Badge className="rounded-full border border-primary/25 bg-primary/12 px-2.5 py-0.5 text-[10px] tracking-wide text-primary uppercase">
                  {t(`insights.badges.${item.badgeKey}`)}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 pb-5">
                <CardTitle className="text-lg font-semibold tracking-tight">{t(`insights.titles.${item.titleKey}`)}</CardTitle>
                <p className="text-sm text-muted-foreground">{t(`insights.descriptions.${item.descriptionKey}`)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
