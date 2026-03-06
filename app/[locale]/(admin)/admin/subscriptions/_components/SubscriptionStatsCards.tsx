"use client";

import {Percent, UserRoundCheck, Users, Wallet} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";
import type {SubscriptionStat} from "@/data/admin-subscriptions";

type SubscriptionStatsCardsProps = {
  stats: SubscriptionStat[];
};

const iconMap = {
  users: Users,
  wallet: Wallet,
  userCheck: UserRoundCheck,
  percent: Percent
} as const;

const toneClassName = {
  positive: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
  negative: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  neutral: "border-slate-500/30 bg-slate-500/10 text-slate-300"
} as const;

export function SubscriptionStatsCards({stats}: SubscriptionStatsCardsProps) {
  const t = useTranslations("adminSubscriptions");

  return (
    <section className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => {
        const Icon = iconMap[item.icon];
        return (
          <Card key={item.id} className="rounded-2xl border-border/70 bg-card/75 py-0">
            <CardContent className="space-y-3 px-5 py-4">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="size-4.5" />
                </span>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${toneClassName[item.tone ?? "neutral"]}`}>{item.change}</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{t(item.labelKey)}</p>
                <p className="text-4xl font-semibold tracking-tight">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

