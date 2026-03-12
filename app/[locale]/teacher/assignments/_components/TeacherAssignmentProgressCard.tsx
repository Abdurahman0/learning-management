"use client";

import {useTranslations} from "next-intl";

import type {TeacherAssignmentProgressItem} from "@/data/teacher/selectors";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";

type TeacherAssignmentProgressCardProps = {
  items: TeacherAssignmentProgressItem[];
};

function toneClass(tone: TeacherAssignmentProgressItem["tone"]) {
  if (tone === "amber") {
    return "bg-amber-400";
  }

  if (tone === "emerald") {
    return "bg-emerald-400";
  }

  return "bg-blue-500";
}

function tooltipToneClass(tone: TeacherAssignmentProgressItem["tone"]) {
  if (tone === "amber") {
    return "border-amber-500/35 bg-amber-500/15 text-amber-200";
  }

  if (tone === "emerald") {
    return "border-emerald-500/35 bg-emerald-500/15 text-emerald-200";
  }

  return "border-blue-500/35 bg-blue-500/15 text-blue-100";
}

export function TeacherAssignmentProgressCard({items}: TeacherAssignmentProgressCardProps) {
  const t = useTranslations("teacherAssignments");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="text-2xl">{t("assignmentProgress")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4 pb-5">
        {items.map((item) => (
          <div key={item.id}>
            <div className="mb-1.5 flex items-center justify-between gap-2 text-sm">
              <span>{item.label}</span>
              <span className="font-semibold">{item.value}%</span>
            </div>

            <div className="group relative">
              <div className="h-2 rounded-full bg-muted/70">
                <div
                  className={`h-2 rounded-full ${toneClass(item.tone)}`}
                  style={{width: `${item.value}%`}}
                  aria-hidden="true"
                />
              </div>

              <span
                role="tooltip"
                className={`pointer-events-none absolute -top-8 right-0 hidden rounded-md border px-2 py-0.5 text-[11px] font-semibold shadow-md backdrop-blur-md group-hover:block max-sm:-top-7 max-sm:px-1.5 max-sm:py-0.5 max-sm:text-[10px] ${tooltipToneClass(item.tone)}`}
              >
                {item.value}% {t("completedLabel")}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
