"use client";

import {AlertCircle, Clock3, Lightbulb, Timer} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherCommonMistakeInsight} from "@/data/teacher/selectors";

type TeacherMostCommonMistakesCardProps = {
  insights: TeacherCommonMistakeInsight[];
};

function severityBadgeClass(severity: TeacherCommonMistakeInsight["severity"]) {
  if (severity === "high") {
    return "border-rose-500/30 bg-rose-600/72 text-white dark:bg-rose-500/15 dark:text-rose-300";
  }

  if (severity === "moderate") {
    return "border-amber-500/30 bg-amber-600/72 text-white dark:bg-amber-500/15 dark:text-amber-300";
  }

  return "border-sky-500/30 bg-sky-600/72 text-white dark:bg-sky-500/15 dark:text-sky-300";
}

function panelToneClass(severity: TeacherCommonMistakeInsight["severity"]) {
  if (severity === "high") {
    return "border-rose-500/25 bg-rose-500/6";
  }

  if (severity === "moderate") {
    return "border-amber-500/25 bg-amber-500/6";
  }

  return "border-sky-500/25 bg-sky-500/6";
}

export function TeacherMostCommonMistakesCard({insights}: TeacherMostCommonMistakesCardProps) {
  const t = useTranslations("teacherWeakAreas");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="text-2xl">{t("mostCommonMistakes")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3.5 pb-5">
        {insights.map((insight) => (
          <article key={insight.id} className={`rounded-xl border p-4 ${panelToneClass(insight.severity)}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <h3 className="text-base font-semibold">{t(`insights.${insight.id}.title`)}</h3>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${severityBadgeClass(insight.severity)}`}>
                {t(`insightSeverity.${insight.severity}`)}
              </span>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {insight.id === "falseVsNotGiven"
                ? t(`insights.${insight.id}.description`, {value: insight.metricPrimary})
                : insight.id === "timeManagementSection3"
                  ? t(`insights.${insight.id}.description`, {
                    section12: insight.metricPrimary,
                    section3: insight.metricSecondary ?? 12
                  })
                  : t(`insights.${insight.id}.description`, {value: insight.metricPrimary})}
            </p>

            <div className="mt-3 inline-flex items-start gap-2 rounded-lg border border-border/70 bg-background/35 px-3 py-2 text-sm">
              {insight.id === "timeManagementSection3" ? (
                <Timer className="mt-0.5 size-4 text-amber-300" />
              ) : insight.id === "task2Cohesion" ? (
                <Clock3 className="mt-0.5 size-4 text-sky-300" />
              ) : (
                <AlertCircle className="mt-0.5 size-4 text-rose-300" />
              )}
              <p className="leading-relaxed">
                <span className="font-semibold text-foreground">{t("suggestionLabel")} </span>
                {t(`insights.${insight.id}.suggestion`)}
              </p>
            </div>
          </article>
        ))}

        <div className="rounded-xl border border-border/70 bg-background/40 p-3">
          <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Lightbulb className="size-4 text-primary" />
            {t("insightsFootnote")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
