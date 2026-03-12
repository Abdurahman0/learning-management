"use client";

import Link from "next/link";
import {ChevronRight} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";

import {createTeacherRecommendationAssignmentDraft} from "@/data/teacher/recommendations";
import type {TeacherStudentProgressData, TeacherStudentRecommendation} from "@/data/teacher/selectors";

import {TeacherSidebar} from "../../../../_components/TeacherSidebar";
import {TeacherTopbar} from "../../../../_components/TeacherTopbar";
import {TeacherStudentBandProgressChart} from "./TeacherStudentBandProgressChart";
import {TeacherStudentModulePerformanceCard} from "./TeacherStudentModulePerformanceCard";
import {TeacherStudentProgressHero} from "./TeacherStudentProgressHero";
import {TeacherStudentRecommendedFocusCard} from "./TeacherStudentRecommendedFocusCard";
import {TeacherStudentWeakAreasByTypeCard} from "./TeacherStudentWeakAreasByTypeCard";

type TeacherStudentProgressPageClientProps = {
  progress: TeacherStudentProgressData;
};

function formatLastActivity(
  t: ReturnType<typeof useTranslations>,
  value: TeacherStudentProgressData["summary"]["lastActivity"]
) {
  if (typeof value.value === "number") {
    return t(`relative.${value.key}`, {value: value.value});
  }

  return t(`relative.${value.key}`);
}

function toDisplayStudentCode(studentCode: string) {
  return `IELTS-${studentCode.replace("ST-", "")}`;
}

export function TeacherStudentProgressPageClient({progress}: TeacherStudentProgressPageClientProps) {
  const t = useTranslations("teacherStudentProgress");
  const locale = useLocale();
  const router = useRouter();

  const profileHref = `/${locale}/teacher/students/${progress.student.id}`;
  const viewAllRecommendationsHref = `/${locale}/teacher/assignments?studentId=${progress.student.id}`;

  const handleAssignRecommendation = (item: TeacherStudentRecommendation) => {
    createTeacherRecommendationAssignmentDraft({
      studentId: progress.student.id,
      recommendationId: item.id,
      targetSkill: item.targetSkill
    });

    const params = new URLSearchParams({
      studentId: progress.student.id,
      recommendationSkill: item.targetSkill,
      title: t("recommendationTitle", {skill: t(`weakAreaLabels.${item.targetSkill}`)}),
      instructions: t("recommendationAssignmentInstruction", {skill: t(`weakAreaLabels.${item.targetSkill}`)})
    });

    router.push(`/${locale}/teacher/assignments?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <TeacherSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <TeacherTopbar title={t("title")} />

          <main className="mx-auto min-w-0 w-full max-w-[1480px] space-y-5 overflow-x-hidden px-4 py-5 sm:px-6 lg:px-8">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Link href={`/${locale}/teacher/students`} className="hover:text-foreground">
                  {t("students")}
                </Link>
                <ChevronRight className="size-4" />
                <Link href={profileHref} className="hover:text-foreground">
                  {progress.student.name}
                </Link>
                <ChevronRight className="size-4" />
                <span className="font-medium text-foreground">{t("title")}</span>
              </div>

              <section>
                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
                <p className="mt-1.5 text-sm text-muted-foreground">{t("subtitle")}</p>
              </section>
            </div>

            <TeacherStudentProgressHero
              studentName={progress.student.name}
              studentFallback={progress.student.avatarFallback}
              studentIdLabel={toDisplayStudentCode(progress.summary.studentCode)}
              targetBand={progress.summary.targetBand}
              currentBand={progress.summary.currentBand}
              totalTests={progress.summary.totalTests}
              improvementBand={progress.summary.improvementBand}
              testsThisWeek={progress.summary.testsThisWeek}
              averageStudyTimeHours={progress.summary.averageStudyTimeHours}
              streakDays={progress.summary.streakDays}
              lastActiveLabel={formatLastActivity(t, progress.summary.lastActivity)}
              viewFullProfileHref={profileHref}
            />

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.9fr)]">
              <TeacherStudentBandProgressChart points={progress.bandProgression} />
              <TeacherStudentModulePerformanceCard modules={progress.modulePerformance} />
            </section>

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.9fr)]">
              <TeacherStudentWeakAreasByTypeCard weakAreas={progress.weakAreasByType} />
              <TeacherStudentRecommendedFocusCard
                recommendations={progress.recommendations}
                viewAllHref={viewAllRecommendationsHref}
                onAssign={handleAssignRecommendation}
              />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
