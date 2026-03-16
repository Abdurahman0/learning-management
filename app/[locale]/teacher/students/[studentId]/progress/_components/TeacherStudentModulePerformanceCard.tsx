"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherStudentModuleScore} from "@/data/teacher/selectors";

type TeacherStudentModulePerformanceCardProps = {
  modules: TeacherStudentModuleScore[];
};

export function TeacherStudentModulePerformanceCard({modules}: TeacherStudentModulePerformanceCardProps) {
  const t = useTranslations("teacherStudentProgress");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pt-7 pb-3">
        <CardTitle className="text-xl">{t("modulePerformance")}</CardTitle>
        <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-600/72 px-2.5 py-1 text-xs text-white dark:bg-emerald-500/12 dark:text-emerald-300">
          {t("updatedToday")}
        </span>
      </CardHeader>

      <CardContent className="space-y-4 pb-5">
        {modules.map((item) => (
          <div key={item.module}>
            <div className="mb-2 flex items-center justify-between gap-2 text-sm">
              <span className="font-medium">{t(`modules.${item.module}`)}</span>
              <span className="font-semibold text-primary">{item.score.toFixed(1)}</span>
            </div>
            <div className="h-2 rounded-full bg-muted/70">
              <div
                className="h-2 rounded-full bg-linear-to-r from-blue-600 to-indigo-500"
                style={{width: `${Math.min(100, (item.score / 9) * 100)}%`}}
                aria-hidden="true"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("targetBandLabel", {value: item.target.toFixed(1)})}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
