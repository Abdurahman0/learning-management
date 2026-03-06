"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {MistakeDistributionItem} from "@/data/admin-mistakes-analysis";

type MistakeDistributionChartProps = {
  items: MistakeDistributionItem[];
  totalErrorsLabel: string;
};

export function MistakeDistributionChart({items, totalErrorsLabel}: MistakeDistributionChartProps) {
  const t = useTranslations("adminMistakesAnalysis");
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const total = items.reduce((sum, item) => sum + item.totalErrors, 0);

  let consumed = 0;
  const segments = items.map((item) => {
    const ratio = total > 0 ? item.totalErrors / total : 0;
    const length = ratio * circumference;
    const offset = -consumed;
    consumed += length;
    return {...item, length, offset};
  });

  return (
    <Card className="rounded-3xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-5 pb-2">
        <CardTitle className="text-2xl font-semibold tracking-tight">{t("mistakeDistribution")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-5">
        <div className="relative mx-auto size-[190px]">
          <svg viewBox="0 0 190 190" className="size-full">
            <g transform="translate(95,95)">
              <circle r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="20" />
              {segments.map((segment) => (
                <circle
                  key={segment.module}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="20"
                  strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                  strokeDashoffset={segment.offset}
                  strokeLinecap="round"
                  transform="rotate(-90)"
                />
              ))}
            </g>
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-3xl font-semibold tracking-tight">{totalErrorsLabel}</p>
            <p className="text-sm text-muted-foreground">{t("totalErrors")}</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.module} className="flex items-center justify-between rounded-lg border border-border/70 bg-background/35 px-2.5 py-2">
              <span className="inline-flex items-center gap-2 text-sm">
                <span className="size-2.5 rounded-full" style={{backgroundColor: item.color}} />
                {t(`modules.${item.module}`)}
              </span>
              <span className="text-sm font-medium">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
