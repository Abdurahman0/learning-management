"use client";

import {AlertTriangle} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherStudentWeakAreaMetric} from "@/types/teacher";

type TeacherStudentWeakAreasCardProps = {
  weakAreas: TeacherStudentWeakAreaMetric[];
  recommendation: string;
};

function toneClass(tone: TeacherStudentWeakAreaMetric["tone"]) {
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

export function TeacherStudentWeakAreasCard({weakAreas, recommendation}: TeacherStudentWeakAreasCardProps) {
  const t = useTranslations("teacherStudentProfile");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="inline-flex items-center gap-2 text-xl">
          <AlertTriangle className="size-4.5 text-amber-300" />
          {t("weakAreas")}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pb-5">
        {weakAreas.map((area) => {
          const tone = toneClass(area.tone);

          return (
            <div key={area.id}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
                <span>{t(`weakAreaLabels.${area.label}`)}</span>
                <span className={`font-semibold ${tone.text}`}>{area.score}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted/70">
                <div className={`h-2 rounded-full ${tone.bar}`} style={{width: `${area.score}%`}} aria-hidden="true" />
              </div>
            </div>
          );
        })}

        <div className="rounded-xl border border-border/70 bg-background/45 p-3.5">
          <p className="text-xs font-medium text-muted-foreground">{t("recommendationLabel")}</p>
          <p className="mt-1.5 text-sm leading-relaxed">{recommendation}</p>
        </div>
      </CardContent>
    </Card>
  );
}
