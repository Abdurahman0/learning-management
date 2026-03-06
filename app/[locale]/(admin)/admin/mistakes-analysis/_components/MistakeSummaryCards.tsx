"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";
import type {MistakeSummaryStat} from "@/data/admin-mistakes-analysis";

type MistakeSummaryCardsProps = {
  stats: MistakeSummaryStat[];
};

const toneClassName: Record<NonNullable<MistakeSummaryStat["tone"]>, string> = {
  critical: "text-rose-400",
  warning: "text-amber-300",
  positive: "text-emerald-400",
  neutral: "text-foreground"
};

export function MistakeSummaryCards({stats}: MistakeSummaryCardsProps) {
  const t = useTranslations("adminMistakesAnalysis");

  return (
    <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <Card key={item.id} className="rounded-2xl border-border/70 bg-card/75 py-0">
          <CardContent className="space-y-1.5 px-5 py-4">
            <p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">{t(`summary.${item.id}`)}</p>
            <p className={`text-2xl leading-[1.15] font-semibold tracking-tight ${toneClassName[item.tone ?? "neutral"]}`}>{item.value}</p>
            <p className="text-sm text-muted-foreground">{item.sublabel}</p>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
