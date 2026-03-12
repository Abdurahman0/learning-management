"use client";

import {useMemo, useState} from "react";
import {useTranslations} from "next-intl";

import {
  getTeacherClassProgressOverview,
  getTeacherStudentsForList,
  getTeacherStudentsSummary,
  type TeacherStudentsProgressFilter,
  type TeacherStudentsSortBy,
  type TeacherStudentsStatusFilter,
  type TeacherStudentsTargetFilter
} from "@/data/teacher/selectors";

import {TeacherSidebar} from "../../_components/TeacherSidebar";
import {TeacherTopbar} from "../../_components/TeacherTopbar";
import {TeacherClassProgressOverview} from "./TeacherClassProgressOverview";
import {TeacherStudentsFilters} from "./TeacherStudentsFilters";
import {TeacherStudentsSummaryCards} from "./TeacherStudentsSummaryCards";
import {TeacherStudentsTable} from "./TeacherStudentsTable";

export function TeacherMyStudentsPageClient() {
  const t = useTranslations("teacherStudents");

  const [searchQuery, setSearchQuery] = useState("");
  const [progressFilter, setProgressFilter] = useState<TeacherStudentsProgressFilter>("all");
  const [targetFilter, setTargetFilter] = useState<TeacherStudentsTargetFilter>("all");
  const [statusFilter, setStatusFilter] = useState<TeacherStudentsStatusFilter>("all");
  const [sortBy, setSortBy] = useState<TeacherStudentsSortBy>("recent_activity");

  const summary = useMemo(() => getTeacherStudentsSummary(), []);

  const students = useMemo(
    () =>
      getTeacherStudentsForList({
        query: searchQuery,
        progressFilter,
        targetFilter,
        statusFilter,
        sortBy
      }),
    [progressFilter, searchQuery, sortBy, statusFilter, targetFilter]
  );

  const classProgress = useMemo(() => getTeacherClassProgressOverview(), []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <TeacherSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TeacherTopbar title={t("title")} />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <section>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">{t("subtitle")}</p>
            </section>

            <TeacherStudentsSummaryCards summary={summary} />

            <TeacherStudentsFilters
              searchQuery={searchQuery}
              progressFilter={progressFilter}
              targetFilter={targetFilter}
              statusFilter={statusFilter}
              sortBy={sortBy}
              onSearchQueryChange={setSearchQuery}
              onProgressFilterChange={setProgressFilter}
              onTargetFilterChange={setTargetFilter}
              onStatusFilterChange={setStatusFilter}
              onSortByChange={setSortBy}
            />

            <TeacherStudentsTable students={students} totalStudents={summary.totalStudents} />

            <TeacherClassProgressOverview points={classProgress} />
          </main>
        </div>
      </div>
    </div>
  );
}
