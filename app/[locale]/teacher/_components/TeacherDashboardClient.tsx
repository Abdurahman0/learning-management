"use client";

import {Badge} from "@/components/ui/badge";
import {useTranslations} from "next-intl";

import {TeacherOverviewCards} from "./TeacherOverviewCards";
import {TeacherQuickActionsCard} from "./TeacherQuickActionsCard";
import {TeacherRecentActivityCard} from "./TeacherRecentActivityCard";
import {TeacherSidebar} from "./TeacherSidebar";
import {TeacherStudentsNeedingHelpTable} from "./TeacherStudentsNeedingHelpTable";
import {TeacherStudentProgressChart} from "./TeacherStudentProgressChart";
import {TeacherTopbar} from "./TeacherTopbar";

export function TeacherDashboardClient() {
  const t = useTranslations("teacherDashboard");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <TeacherSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TeacherTopbar />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <section className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">{t("subtitle")}</p>
              </div>
              <Badge variant="secondary" className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-1 text-primary">
                {t("teacherRoleLabel")}
              </Badge>
            </section>

            <TeacherOverviewCards />

            <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(290px,0.82fr)]">
              <TeacherStudentProgressChart />
              <div className="space-y-5">
                <TeacherQuickActionsCard />
                <TeacherRecentActivityCard />
              </div>
            </section>

            <TeacherStudentsNeedingHelpTable />
          </main>
        </div>
      </div>
    </div>
  );
}
