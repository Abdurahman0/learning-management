"use client";

import {BellRing, Flame, Trophy} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import type {GamificationSettings} from "@/data/admin-achievements";
import {cn} from "@/lib/utils";

type GamificationSettingsCardProps = {
  settings: GamificationSettings;
  onChange: (patch: Partial<GamificationSettings>) => void;
};

type SettingToggleRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onToggle: (value: boolean) => void;
};

function SettingToggleRow({title, description, checked, onToggle}: SettingToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="space-y-0.5">
        <p className="text-base leading-tight font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onToggle(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors",
          checked ? "border-primary/45 bg-primary/80" : "border-border/80 bg-muted/65"
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 size-5 -translate-y-1/2 rounded-full bg-white shadow transition-all",
            checked ? "left-[24px]" : "left-[2px]"
          )}
        />
      </button>
    </div>
  );
}

export function GamificationSettingsCard({settings, onChange}: GamificationSettingsCardProps) {
  const t = useTranslations("adminAchievements");

  return (
    <Card className="rounded-3xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-5 pb-2">
        <CardTitle className="text-xl font-semibold tracking-tight">{t("gamificationSettings")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pb-5">
        <SettingToggleRow
          title={t("settings.streakTracking")}
          description={t("settings.streakTrackingHint")}
          checked={settings.streakTracking}
          onToggle={(value) => onChange({streakTracking: value})}
        />

        <SettingToggleRow
          title={t("settings.badgeNotifications")}
          description={t("settings.badgeNotificationsHint")}
          checked={settings.badgeNotifications}
          onToggle={(value) => onChange({badgeNotifications: value})}
        />

        <SettingToggleRow
          title={t("settings.publicLeaderboard")}
          description={t("settings.publicLeaderboardHint")}
          checked={settings.publicLeaderboard}
          onToggle={(value) => onChange({publicLeaderboard: value})}
        />

        <Separator className="my-1" />

        <div className="space-y-3">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">{t("quickPreview")}</p>
          <div className="rounded-2xl border border-border/70 bg-background/45 p-3.5">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary/18 text-primary">
                {settings.badgeNotifications ? <BellRing className="size-4.5" /> : <Trophy className="size-4.5" />}
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold">
                  {settings.streakTracking ? t("preview.streakTitle") : t("preview.badgeTitle")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {settings.publicLeaderboard ? t("preview.leaderboardEnabled") : t("preview.leaderboardDisabled")}
                </p>
              </div>
              <span className="ml-auto inline-flex size-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                <Flame className="size-4" />
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
