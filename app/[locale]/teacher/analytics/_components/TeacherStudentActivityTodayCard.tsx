"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherDailyActivityMetric} from "@/data/teacher/selectors";

type TeacherStudentActivityTodayCardProps = {
  metrics: TeacherDailyActivityMetric[];
};

function valueTone(id: TeacherDailyActivityMetric["id"]) {
  if (id === "inactive") {
    return "text-slate-300";
  }

  if (id === "submissions") {
    return "text-violet-300";
  }

  if (id === "testsStarted") {
    return "text-emerald-300";
  }

  return "text-primary";
}

export function TeacherStudentActivityTodayCard({metrics}: TeacherStudentActivityTodayCardProps) {
  const t = useTranslations("teacherAnalytics");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="text-2xl">{t("studentActivityToday")}</CardTitle>
      </CardHeader>

      <CardContent className="grid gap-3 pb-5 sm:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric.id} className="group relative rounded-xl border border-border/70 bg-background/40 px-3 py-4 text-center">
            <p className={`text-4xl leading-none font-semibold ${valueTone(metric.id)}`}>{metric.value}</p>
            <p className="mt-2 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t(metric.id)}</p>

            <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 rounded-md border border-border/70 bg-card px-2 py-0.5 text-[11px] font-semibold shadow-md group-hover:block max-sm:px-1.5 max-sm:py-0.5 max-sm:text-[10px]">
              {t("exactValue", {value: metric.value})}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
