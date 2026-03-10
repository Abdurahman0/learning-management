"use client";

import {Award, Flame, GraduationCap, TrendingUp} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";
import type {DashboardUserSummary} from "@/data/dashboard-demo";
import {cn} from "@/lib/utils";

type DashboardKpisProps = {
  summary: DashboardUserSummary;
  onCurrentBandClick?: () => void;
};

export function DashboardKpis({summary, onCurrentBandClick}: DashboardKpisProps) {
  const t = useTranslations("dashboard");

  const items = [
    {label: t("kpis.currentBand"), value: summary.currentBand, icon: TrendingUp, bubble: "bg-blue-500/15 text-blue-300", onClick: onCurrentBandClick},
    {label: t("kpis.testsTaken"), value: summary.testsTaken, icon: GraduationCap, bubble: "bg-violet-500/15 text-violet-300"},
    {label: t("kpis.avgScore"), value: summary.avgScore, icon: Award, bubble: "bg-emerald-500/15 text-emerald-300"},
    {label: t("kpis.studyStreak"), value: `${summary.streakDays} ${t("days")}`, icon: Flame, bubble: "bg-orange-500/15 text-orange-300"}
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.label}
          className={cn("min-w-0 rounded-2xl border-border/70 bg-card/70 backdrop-blur", item.onClick && "cursor-pointer")}
          role={item.onClick ? "button" : undefined}
          tabIndex={item.onClick ? 0 : undefined}
          onClick={item.onClick}
          onKeyDown={
            item.onClick
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    item.onClick?.();
                  }
                }
              : undefined
          }
        >
          <CardContent className="flex items-center gap-3 p-5">
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", item.bubble)}>
              <item.icon className="size-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-3xl leading-none font-semibold tracking-tight">{item.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
