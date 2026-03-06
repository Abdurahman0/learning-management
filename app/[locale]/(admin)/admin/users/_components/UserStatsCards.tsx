"use client";

import {Activity, Crown, UserPlus2, Users} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";
import type {UserStatCard} from "@/data/admin-users";

type UserStatsCardsProps = {
  stats: UserStatCard[];
};

const iconMap = {
  totalUsers: Users,
  activeToday: Activity,
  newThisMonth: UserPlus2,
  payingUsers: Crown
} as const;

export function UserStatsCards({stats}: UserStatsCardsProps) {
  const t = useTranslations("adminUsers");

  return (
    <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => {
        const Icon = iconMap[item.id];

        return (
          <Card key={item.id} className="rounded-2xl border-border/70 bg-card/75 py-0">
            <CardContent className="space-y-3 px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="size-4.5" />
                </span>
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/12 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  {item.change}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t(`stats.${item.id}`)}</p>
                <p className="text-3xl font-semibold tracking-tight">{item.value.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

