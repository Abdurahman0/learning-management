"use client";

import { useTranslations } from "next-intl";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ListeningSectionPerformanceItem = {
  sectionId: string;
  label: string;
  correct: number;
  total: number;
  percent: number;
};

type ListeningSectionPerformanceProps = {
  items: ListeningSectionPerformanceItem[];
};

function getTone(percent: number) {
  if (percent >= 75) {
    return {
      card: "border-emerald-400/20 bg-emerald-500/[0.06]",
      bar: "bg-emerald-400/85",
      value: "text-emerald-200",
    };
  }

  if (percent >= 45) {
    return {
      card: "border-blue-400/20 bg-blue-500/[0.06]",
      bar: "bg-blue-400/85",
      value: "text-blue-200",
    };
  }

  return {
    card: "border-rose-400/25 bg-rose-500/[0.07]",
    bar: "bg-rose-400/85",
    value: "text-rose-200",
  };
}

export function ListeningSectionPerformance({ items }: ListeningSectionPerformanceProps) {
  const t = useTranslations("listeningResult");

  if (!items.length) return null;

  return (
    <Card className="gap-4 rounded-3xl border-border/75 bg-card/75 p-4 shadow-none sm:p-5">
      <div className="space-y-1">
        <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">{t("sectionPerformanceEyebrow")}</p>
        <h2 className="text-lg font-semibold tracking-tight">{t("sectionPerformance")}</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => {
          const tone = getTone(item.percent);
          return (
            <Card key={item.sectionId} className={cn("gap-2 rounded-2xl p-3 shadow-none", tone.card)}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium leading-tight">{item.label}</p>
                <span className={cn("text-xs font-semibold", tone.value)}>{item.percent}%</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {item.correct}/{item.total}
              </p>
              <div className="h-1.5 w-full rounded-full bg-background/70">
                <div className={cn("h-full rounded-full transition-all", tone.bar)} style={{ width: `${item.percent}%` }} />
              </div>
            </Card>
          );
        })}
      </div>
    </Card>
  );
}
