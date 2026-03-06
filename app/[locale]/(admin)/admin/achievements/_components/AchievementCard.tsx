"use client";

import type {LucideIcon} from "lucide-react";
import {Award, Flame, MoreVertical, Sparkles, Trophy} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/components/ui/dropdown-menu";
import type {ActiveAchievement, ActiveAchievementIcon, ActiveAchievementTone} from "@/data/admin-achievements";

const iconMap: Record<ActiveAchievementIcon, LucideIcon> = {
  trophy: Trophy,
  award: Award,
  flame: Flame,
  sparkles: Sparkles
};

const toneMap: Record<ActiveAchievementTone, string> = {
  gold: "bg-amber-500/18 text-amber-400",
  slate: "bg-slate-400/18 text-slate-300",
  orange: "bg-orange-500/18 text-orange-400",
  purple: "bg-violet-500/18 text-violet-400"
};

type AchievementCardProps = {
  item: ActiveAchievement;
  onAction: (action: "edit" | "duplicate" | "disable", item: ActiveAchievement) => void;
};

export function AchievementCard({item, onAction}: AchievementCardProps) {
  const t = useTranslations("adminAchievements");
  const Icon = iconMap[item.badgeIcon];

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardContent className="space-y-4 px-5 pt-5 pb-5">
        <div className="flex items-start justify-between gap-3">
          <span className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full ${toneMap[item.tone]}`}>
            <Icon className="size-5" />
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-lg text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                aria-label={t("actions.openMenu")}
              >
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl border-border/70 bg-popover/95 backdrop-blur">
              <DropdownMenuItem onClick={() => onAction("edit", item)}>{t("actions.edit")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("duplicate", item)}>{t("actions.duplicate")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAction("disable", item)} className="text-rose-400 focus:text-rose-300">
                {t("actions.disable")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <h3 className="text-[1.45rem] leading-tight font-semibold tracking-tight">{item.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-3">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">{t("timesEarned")}</p>
          <p className="text-sm font-semibold text-primary">{item.timesEarned.toLocaleString()}</p>
        </div>
      </CardContent>
    </Card>
  );
}
