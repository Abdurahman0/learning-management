"use client";

import type {LucideIcon} from "lucide-react";
import {Award, Flame, Sparkles, TrendingUp} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";
import type {AchievementStat, AchievementStatIcon} from "@/data/admin-achievements";

const iconMap: Record<AchievementStatIcon, LucideIcon> = {
  total: Award,
  earned: TrendingUp,
  badge: Sparkles,
  streak: Flame
};

const toneClassMap: Record<AchievementStatIcon, string> = {
  total: "bg-primary/18 text-primary",
  earned: "bg-emerald-500/18 text-emerald-400",
  badge: "bg-amber-500/18 text-amber-400",
  streak: "bg-violet-500/18 text-violet-400"
};

type AchievementStatsCardsProps = {
  stats: AchievementStat[];
};

export function AchievementStatsCards({stats}: AchievementStatsCardsProps) {
  const t = useTranslations("adminAchievements");

  return (
    <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = iconMap[stat.icon];
        return (
          <Card key={stat.id} className="rounded-2xl border-border/70 bg-card/75 py-0">
            <CardContent className="space-y-3 px-5 pt-5 pb-5">
              <span className={`inline-flex size-10 items-center justify-center rounded-xl ${toneClassMap[stat.icon]}`}>
                <Icon className="size-4.5" />
              </span>
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">{t(`stats.${stat.id}`)}</p>
                <p className="text-3xl leading-tight font-semibold tracking-tight">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
