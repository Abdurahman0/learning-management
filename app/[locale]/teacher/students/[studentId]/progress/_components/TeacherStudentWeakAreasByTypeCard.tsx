"use client";

import {AlertTriangle} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherStudentWeakQuestionType} from "@/data/teacher/selectors";

type TeacherStudentWeakAreasByTypeCardProps = {
  weakAreas: TeacherStudentWeakQuestionType[];
};

function toneStyles(tone: TeacherStudentWeakQuestionType["tone"]) {
  if (tone === "weak") {
    return {text: "text-rose-300", bar: "bg-rose-400"};
  }

  if (tone === "average") {
    return {text: "text-amber-300", bar: "bg-amber-400"};
  }

  return {text: "text-emerald-300", bar: "bg-emerald-400"};
}

export function TeacherStudentWeakAreasByTypeCard({weakAreas}: TeacherStudentWeakAreasByTypeCardProps) {
  const t = useTranslations("teacherStudentProgress");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="inline-flex items-center gap-2 text-xl">
          <AlertTriangle className="size-4.5 text-amber-300" />
          {t("weakAreasByQuestionType")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pb-5">
        {weakAreas.map((area) => {
          const tone = toneStyles(area.tone);

          return (
            <div key={area.id}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                <span>{t(`weakAreaLabels.${area.label}`)}</span>
                <span className={`font-semibold ${tone.text}`}>
                  {area.accuracy}% {t("accuracy")}
                </span>
              </div>
              <div className="h-2 rounded-full bg-muted/70">
                <div className={`h-2 rounded-full ${tone.bar}`} style={{width: `${area.accuracy}%`}} aria-hidden="true" />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
