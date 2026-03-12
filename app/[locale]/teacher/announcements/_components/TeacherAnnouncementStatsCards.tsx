"use client";

import type {LucideIcon} from "lucide-react";
import {CalendarDays, Clock3, Megaphone, Users} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";
import type {TeacherAnnouncementsPageData} from "@/data/teacher/selectors";

type TeacherAnnouncementStatsCardsProps = {
  stats: TeacherAnnouncementsPageData["stats"];
};

type StatCardConfig = {
  key: keyof TeacherAnnouncementsPageData["stats"];
  icon: LucideIcon;
  toneClassName: string;
};

const statConfigs: StatCardConfig[] = [
  {key: "totalAnnouncements", icon: Megaphone, toneClassName: "text-primary"},
  {key: "publishedThisWeek", icon: CalendarDays, toneClassName: "text-emerald-400"},
  {key: "scheduled", icon: Clock3, toneClassName: "text-amber-400"},
  {key: "studentsReached", icon: Users, toneClassName: "text-sky-400"}
];

export function TeacherAnnouncementStatsCards({stats}: TeacherAnnouncementStatsCardsProps) {
  const t = useTranslations("teacherAnnouncements");

  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {statConfigs.map((item) => {
        const Icon = item.icon;
        const value = stats[item.key];

        return (
          <Card key={item.key} className="rounded-2xl border-border/70 bg-card/75 py-0">
            <CardContent className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex size-9 items-center justify-center rounded-lg border border-border/70 bg-background/45 text-muted-foreground">
                  <Icon className="size-4.5" />
                </span>
                <span className={`text-xs font-semibold ${item.toneClassName}`}>{t(`summaryIndicators.${item.key}`)}</span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{t(item.key)}</p>
                <p className="mt-1 text-3xl font-semibold tracking-tight">{value.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
