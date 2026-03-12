"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherWeakAreaAggregate} from "@/data/teacher/selectors";

type TeacherWeakAreasAcrossStudentsCardProps = {
  areas: TeacherWeakAreaAggregate[];
};

function toneClass(tone: TeacherWeakAreaAggregate["tone"]) {
  if (tone === "weak") {
    return "bg-rose-400";
  }

  if (tone === "average") {
    return "bg-amber-400";
  }

  return "bg-emerald-400";
}

export function TeacherWeakAreasAcrossStudentsCard({areas}: TeacherWeakAreasAcrossStudentsCardProps) {
  const t = useTranslations("teacherAnalytics");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="text-2xl">{t("weakAreasAcrossStudents")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3.5 pb-5">
        {areas.map((item) => (
          <div key={item.id} className="space-y-1.5">
            <div className="flex items-center justify-between text-sm">
              <span>{t(`skills.${item.label}`)}</span>
            </div>

            <div className="relative">
              <div className="h-2.5 rounded-full bg-muted/70">
                <div
                  className={`h-2.5 rounded-full ${toneClass(item.tone)}`}
                  style={{width: `${item.percentage}%`}}
                  aria-hidden="true"
                />
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
