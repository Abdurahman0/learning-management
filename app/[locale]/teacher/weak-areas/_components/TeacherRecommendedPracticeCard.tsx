"use client";

import {BookOpenCheck, Sparkles} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherPracticeRecommendation} from "@/data/teacher/selectors";

type TeacherRecommendedPracticeCardProps = {
  items: TeacherPracticeRecommendation[];
  onAssign: (item: TeacherPracticeRecommendation) => void;
};

function deliveryBadgeClass(delivery: TeacherPracticeRecommendation["delivery"]) {
  if (delivery === "video_quiz") {
    return "border-violet-500/30 bg-violet-500/14 text-violet-300";
  }

  if (delivery === "timed_drill") {
    return "border-amber-500/30 bg-amber-500/14 text-amber-300";
  }

  return "border-primary/30 bg-primary/14 text-primary";
}

export function TeacherRecommendedPracticeCard({items, onAssign}: TeacherRecommendedPracticeCardProps) {
  const t = useTranslations("teacherWeakAreas");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="text-2xl">{t("recommendedPractice")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3.5 pb-5">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl border border-border/70 bg-background/40 p-3.5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-base font-semibold">{t(`recommendationTitles.${item.targetSkill}`)}</p>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${deliveryBadgeClass(item.delivery)}`}>
                {t(`deliveryLabels.${item.delivery}`)}
              </span>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              {t(`recommendationDescriptions.${item.delivery}`, {
                skill: t(`questionTypeLabels.${item.targetSkill}`),
                count: item.questionCount,
                students: item.targetStudents
              })}
            </p>

            <Button
              type="button"
              onClick={() => onAssign(item)}
              className="mt-3 h-10 w-full rounded-lg"
              variant={item.assignMode === "weak_students" ? "secondary" : "default"}
            >
              {item.assignMode === "class" ? (
                <>
                  <BookOpenCheck className="size-4" />
                  {t("assignToClass")}
                </>
              ) : (
                <>
                  <Sparkles className="size-4" />
                  {t("assignToWeakStudents")}
                </>
              )}
            </Button>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
