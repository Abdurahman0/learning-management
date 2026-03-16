"use client";

import type {LucideIcon} from "lucide-react";
import {Activity, BookCheck, ChartColumnBig, Users} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";
import type {TeacherAnalyticsSummary} from "@/data/teacher/selectors";

type TeacherAnalyticsSummaryCardsProps = {
  summary: TeacherAnalyticsSummary;
};

type SummaryKey = keyof TeacherAnalyticsSummary;

type SummaryCard = {
  key: SummaryKey;
  icon: LucideIcon;
  tone: "blue" | "violet" | "amber" | "emerald";
  value: (value: number) => string;
  trendKey: "studentsTrend" | "bandTrend" | "testsTrend" | "studyTimeTrend";
};

const summaryCards: SummaryCard[] = [
  {key: "totalStudents", icon: Users, tone: "blue", value: (value) => `${value}`, trendKey: "studentsTrend"},
  {key: "averageBandScore", icon: ChartColumnBig, tone: "violet", value: (value) => value.toFixed(1), trendKey: "bandTrend"},
  {key: "testsCompleted", icon: BookCheck, tone: "amber", value: (value) => `${value}`, trendKey: "testsTrend"},
  {key: "averageStudyTimeHours", icon: Activity, tone: "emerald", value: (value) => `${value.toFixed(1)}h`, trendKey: "studyTimeTrend"}
];

function toneClass(tone: SummaryCard["tone"]) {
  if (tone === "violet") {
    return "border-violet-500/30 bg-violet-600/72 text-white dark:bg-violet-500/15 dark:text-violet-300";
  }

  if (tone === "amber") {
    return "border-amber-500/30 bg-amber-600/72 text-white dark:bg-amber-500/15 dark:text-amber-300";
  }

  if (tone === "emerald") {
    return "border-emerald-500/30 bg-emerald-600/72 text-white dark:bg-emerald-500/15 dark:text-emerald-300";
  }

  return "border-primary/30 bg-primary/15 text-primary";
}

export function TeacherAnalyticsSummaryCards({summary}: TeacherAnalyticsSummaryCardsProps) {
  const t = useTranslations("teacherAnalytics");

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => {
        const Icon = card.icon;
        const rawValue = summary[card.key];

        return (
          <Card key={card.key} className="rounded-2xl border-border/70 bg-card/75 py-0">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className={`inline-flex size-10 items-center justify-center rounded-xl border ${toneClass(card.tone)}`}>
                  <Icon className="size-4.5" />
                </span>
                <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-600/72 px-2 py-0.5 text-xs font-semibold text-white dark:bg-emerald-500/12 dark:text-emerald-300">
                  {t(`indicators.${card.trendKey}`)}
                </span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{t(card.key)}</p>
                <p className="mt-1 text-4xl leading-none font-semibold">{card.value(rawValue)}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
