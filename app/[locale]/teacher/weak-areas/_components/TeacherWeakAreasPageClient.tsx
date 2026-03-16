"use client";

import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";

import type {TeacherPracticeRecommendation, TeacherWeakAreasPageData} from "@/data/teacher/selectors";

import {TeacherSidebar} from "../../_components/TeacherSidebar";
import {TeacherTopbar} from "../../_components/TeacherTopbar";
import {TeacherModuleDifficultyChart} from "./TeacherModuleDifficultyChart";
import {TeacherMostCommonMistakesCard} from "./TeacherMostCommonMistakesCard";
import {TeacherQuestionTypeAccuracyCard} from "./TeacherQuestionTypeAccuracyCard";
import {TeacherRecommendedPracticeCard} from "./TeacherRecommendedPracticeCard";
import {TeacherStudentsNeedingImprovementTable} from "./TeacherStudentsNeedingImprovementTable";
import {TeacherWeakAreasSummaryCards} from "./TeacherWeakAreasSummaryCards";

type TeacherWeakAreasPageClientProps = {
  data: TeacherWeakAreasPageData;
};

export function TeacherWeakAreasPageClient({data}: TeacherWeakAreasPageClientProps) {
  const t = useTranslations("teacherWeakAreas");
  const locale = useLocale();
  const router = useRouter();

  const viewAllStudentsHref = `/${locale}/teacher/students?progress=needs_help&status=at_risk&sort=lowest_band`;

  const handleAssignRecommendation = (item: TeacherPracticeRecommendation) => {
    const params = new URLSearchParams({
      recommendationSkill: item.targetSkill,
      assignedToMode: item.assignMode === "class" ? "all" : "at_risk",
      title: t(`recommendationTitles.${item.targetSkill}`),
      instructions: t("recommendationAssignmentInstruction", {
        skill: t(`questionTypeLabels.${item.targetSkill}`),
        count: item.questionCount
      })
    });

    router.push(`/${locale}/teacher/assignments?${params.toString()}`);
  };

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

            <TeacherWeakAreasSummaryCards summary={data.summary} />

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)]">
              <TeacherQuestionTypeAccuracyCard items={data.questionTypeAccuracy} />
              <TeacherModuleDifficultyChart items={data.moduleDifficulty} />
            </section>

            <TeacherStudentsNeedingImprovementTable
              rows={data.studentsNeedingImprovement}
              totalCount={data.totalStudentsNeedingHelp}
              viewAllHref={viewAllStudentsHref}
            />

            <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.82fr)]">
              <TeacherMostCommonMistakesCard insights={data.commonMistakes} />
              <TeacherRecommendedPracticeCard items={data.recommendations} onAssign={handleAssignRecommendation} />
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
