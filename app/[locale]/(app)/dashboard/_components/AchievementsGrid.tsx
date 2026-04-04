"use client";

import {Award, Flame, Star} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {Achievement} from "@/data/student/dashboard";
import {cn} from "@/lib/utils";

type AchievementsGridProps = {
  achievements: Achievement[];
};

const stylesById: Record<string, {icon: typeof Flame; active: string; muted: string}> = {
  streak: {
    icon: Flame,
    active:
      "bg-gradient-to-br from-orange-400/35 to-amber-500/25 text-orange-300 shadow-[0_0_0_1px_rgba(251,146,60,.35),0_0_18px_rgba(251,146,60,.26)]",
    muted: "bg-muted text-muted-foreground"
  },
  band: {
    icon: Award,
    active:
      "bg-gradient-to-br from-indigo-400/35 to-blue-500/25 text-blue-200 shadow-[0_0_0_1px_rgba(96,165,250,.35),0_0_18px_rgba(96,165,250,.22)]",
    muted: "bg-muted text-muted-foreground"
  },
  perfect: {
    icon: Star,
    active:
      "bg-gradient-to-br from-yellow-300/35 to-amber-400/25 text-yellow-200 shadow-[0_0_0_1px_rgba(250,204,21,.35),0_0_18px_rgba(250,204,21,.22)]",
    muted: "bg-muted text-muted-foreground"
  }
};

export function AchievementsGrid({achievements}: AchievementsGridProps) {
  const t = useTranslations("dashboard");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/70">
      <CardHeader className="text-center">
        <CardTitle>{t("achievements.title")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("achievements.subtitle")}</p>
      </CardHeader>
      <CardContent className={achievements.length ? "grid gap-4 sm:grid-cols-3" : undefined}>
        {achievements.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">{t("achievements.empty")}</p>
        ) : (
          achievements.map((item) => {
            const style = stylesById[item.id] ?? stylesById.perfect;
            const Icon = style.icon;
            return (
              <div key={item.id} className="flex flex-col items-center rounded-xl border border-border/70 p-4 text-center">
                <span className={cn("mb-3 flex size-14 items-center justify-center rounded-full", item.earned ? style.active : style.muted)}>
                  <Icon className="size-6" />
                </span>
                <p className="font-semibold">{item.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
