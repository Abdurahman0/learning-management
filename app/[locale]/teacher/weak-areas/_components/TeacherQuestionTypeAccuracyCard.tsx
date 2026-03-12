"use client";

import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherQuestionTypeAccuracy} from "@/data/teacher/selectors";

type TeacherQuestionTypeAccuracyCardProps = {
  items: TeacherQuestionTypeAccuracy[];
};

function toneClasses(tone: TeacherQuestionTypeAccuracy["tone"]) {
  if (tone === "weak") {
    return {
      text: "text-rose-300",
      bar: "bg-rose-400"
    };
  }

  if (tone === "average") {
    return {
      text: "text-amber-300",
      bar: "bg-amber-400"
    };
  }

  return {
    text: "text-emerald-300",
    bar: "bg-emerald-400"
  };
}

export function TeacherQuestionTypeAccuracyCard({items}: TeacherQuestionTypeAccuracyCardProps) {
  const t = useTranslations("teacherWeakAreas");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="text-2xl">{t("questionTypeAccuracy")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pb-5">
        {items.map((item) => {
          const tone = toneClasses(item.tone);

          return (
            <div key={item.id} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <p>{t(`questionTypeLabels.${item.label}`)}</p>
                <p className={`font-semibold ${tone.text}`}>{item.percentage}%</p>
              </div>

              <div className="h-2.5 rounded-full bg-muted/70">
                <div className={`h-2.5 rounded-full ${tone.bar}`} style={{width: `${item.percentage}%`}} aria-hidden="true" />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
