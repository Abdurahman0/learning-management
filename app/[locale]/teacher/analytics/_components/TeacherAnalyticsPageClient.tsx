"use client";

import {useState} from "react";
import {useTranslations} from "next-intl";

import type {TeacherAnalyticsPageData, TeacherAnalyticsPeriod} from "@/data/teacher/selectors";

import {TeacherSidebar} from "../../_components/TeacherSidebar";
import {TeacherTopbar} from "../../_components/TeacherTopbar";
import {TeacherAnalyticsSummaryCards} from "./TeacherAnalyticsSummaryCards";
import {TeacherAverageBandProgressChart} from "./TeacherAverageBandProgressChart";
import {TeacherModulePerformanceCard} from "./TeacherModulePerformanceCard";
import {TeacherStudentActivityTodayCard} from "./TeacherStudentActivityTodayCard";
import {TeacherWeakAreasAcrossStudentsCard} from "./TeacherWeakAreasAcrossStudentsCard";

type TeacherAnalyticsPageClientProps = {
  data: TeacherAnalyticsPageData;
};

export function TeacherAnalyticsPageClient({data}: TeacherAnalyticsPageClientProps) {
  const t = useTranslations("teacherAnalytics");
  const [period, setPeriod] = useState<TeacherAnalyticsPeriod>("monthly");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <TeacherSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TeacherTopbar title={t("title")} />

          <main className="mx-auto min-w-0 w-full max-w-370 space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <section>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{t("subtitle")}</p>
            </section>

            <TeacherAnalyticsSummaryCards summary={data.summary} />

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.85fr)]">
              <TeacherAverageBandProgressChart
                period={period}
                points={data.progress[period]}
                onChangePeriod={setPeriod}
              />
              <TeacherModulePerformanceCard modules={data.modulePerformance} />
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.95fr)]">
              <TeacherWeakAreasAcrossStudentsCard areas={data.weakAreas} />
              <TeacherStudentActivityTodayCard metrics={data.dailyActivity} />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
