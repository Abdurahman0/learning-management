"use client";

import {useTranslations} from "next-intl";

import type {PlanDistributionItem} from "@/data/admin-subscriptions";

type PlanDistributionChartProps = {
  items: PlanDistributionItem[];
};

function formatCompactUsers(value: number) {
  if (value >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }

  return `${value}`;
}

export function PlanDistributionChart({items}: PlanDistributionChartProps) {
  const t = useTranslations("adminSubscriptions");
  const totalUsers = items.reduce((sum, item) => sum + item.users, 0);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;

  let accLength = 0;
  const segments = items.map((item) => {
    const length = (item.percentage / 100) * circumference;
    const dashOffset = -accLength;
    accLength += length;
    return {...item, length, dashOffset};
  });

  return (
    <div className="grid gap-4 sm:grid-cols-[170px_minmax(0,1fr)] sm:items-center">
      <div className="relative mx-auto size-[170px]">
        <svg viewBox="0 0 170 170" className="size-full">
          <g transform="translate(85,85)">
            <circle r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="16" />
            {segments.map((segment) => (
              <circle
                key={segment.plan}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth="16"
                strokeDasharray={`${segment.length} ${circumference - segment.length}`}
                strokeDashoffset={segment.dashOffset}
                strokeLinecap="round"
                transform="rotate(-90)"
              />
            ))}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-4xl font-semibold tracking-tight">{formatCompactUsers(totalUsers)}</p>
          <p className="text-xs text-muted-foreground">{t("distribution.users")}</p>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.plan} className="flex items-center justify-between gap-3 rounded-lg border border-border/70 bg-background/35 px-3 py-2">
            <span className="inline-flex items-center gap-2 text-sm">
              <span className="size-2.5 rounded-full" style={{backgroundColor: item.color}} />
              {t(`distribution.plans.${item.plan}`)}
            </span>
            <span className="text-sm font-medium text-muted-foreground">
              {item.percentage}% ({formatCompactUsers(item.users)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

