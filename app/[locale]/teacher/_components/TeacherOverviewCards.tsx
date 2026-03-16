"use client";

import type {LucideIcon} from "lucide-react";
import {AlertTriangle, BookOpen, ClipboardCheck, Users} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";
import {
  teacherOverviewStats,
  type TeacherDashboardStatKey,
  type TeacherStatIndicatorKey,
  type TeacherStatTone
} from "@/data/teacher-dashboard";

const iconMap: Record<TeacherDashboardStatKey, LucideIcon> = {
  studentsAssigned: Users,
  pendingReviews: ClipboardCheck,
  assignmentsActive: BookOpen,
  studentsAtRisk: AlertTriangle
};

const toneClasses: Record<TeacherStatTone, string> = {
  success: "border-emerald-500/25 bg-emerald-600/72 text-white dark:bg-emerald-500/14 dark:text-emerald-300",
  warning: "border-amber-500/25 bg-amber-600/72 text-white dark:bg-amber-500/14 dark:text-amber-300",
  info: "border-blue-500/25 bg-blue-600/72 text-white dark:bg-blue-500/14 dark:text-blue-300",
  danger: "border-rose-500/30 bg-rose-600/72 text-white dark:bg-rose-500/14 dark:text-rose-300"
};

export function TeacherOverviewCards() {
  const t = useTranslations("teacherDashboard");

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {teacherOverviewStats.map((item) => {
        const Icon = iconMap[item.key];

        return (
          <Card key={item.key} className="rounded-2xl border-border/70 bg-card/75 py-0 backdrop-blur-sm">
            <CardContent className="px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex size-11 items-center justify-center rounded-xl border border-primary/15 bg-primary/14 text-primary">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>

                <span className={`rounded-md border px-2 py-1 text-[11px] font-medium ${toneClasses[item.tone]}`}>
                  {t(`indicators.${item.indicator as TeacherStatIndicatorKey}`)}
                </span>
              </div>

              <div className="mt-5 space-y-1.5">
                <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
                  {t(item.key as TeacherDashboardStatKey)}
                </p>
                <p className="text-[2.05rem] leading-none font-semibold tracking-tight">{item.value.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
