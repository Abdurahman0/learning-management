"use client";

import type {LucideIcon} from "lucide-react";
import {Activity, ClipboardCheck, Crown, Users} from "lucide-react";
import {useTranslations} from "next-intl";

import {Badge} from "@/components/ui/badge";
import {Card, CardContent} from "@/components/ui/card";
import type {AdminSummaryIconKey, AdminSummaryMetric, AdminSummaryMetricKey} from "@/data/admin-dashboard";

const iconMap: Record<AdminSummaryIconKey, LucideIcon> = {
  users: Users,
  clipboardCheck: ClipboardCheck,
  activity: Activity,
  crown: Crown
};

function formatGrowth(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

type AdminStatCardsProps = {
  summary: AdminSummaryMetric[];
};

export function AdminStatCards({summary}: AdminStatCardsProps) {
  const t = useTranslations("adminDashboard");

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {summary.map((item) => {
        const Icon = iconMap[item.icon];

        return (
          <Card key={item.key} className="rounded-2xl border-border/70 bg-card/75 py-0 backdrop-blur-sm">
            <CardContent className="px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex size-11 items-center justify-center rounded-xl border border-primary/15 bg-primary/14 text-primary">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>

                <Badge variant="secondary" className="border border-emerald-500/25 bg-emerald-500/14 px-2 py-1 text-emerald-300">
                  {formatGrowth(item.growthPct)}
                </Badge>
              </div>

              <div className="mt-5 space-y-1.5">
                <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">{t(`stats.${item.key as AdminSummaryMetricKey}`)}</p>
                <p className="text-[2.05rem] leading-none font-semibold tracking-tight">{item.value.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
