"use client";

import Link from "next/link";
import type {LucideIcon} from "lucide-react";
import {ArrowRight, BookOpenCheck, Mic, PenLine, Target} from "lucide-react";
import {useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import type {TeacherStudentRecommendation} from "@/data/teacher/selectors";

type TeacherStudentRecommendedFocusCardProps = {
  recommendations: TeacherStudentRecommendation[];
  viewAllHref: string;
  onAssign: (recommendation: TeacherStudentRecommendation) => void;
};

const moduleIcons: Record<TeacherStudentRecommendation["focusModule"], LucideIcon> = {
  reading: BookOpenCheck,
  listening: Target,
  writing: PenLine,
  speaking: Mic,
  general: Target
};

export function TeacherStudentRecommendedFocusCard({
  recommendations,
  viewAllHref,
  onAssign
}: TeacherStudentRecommendedFocusCardProps) {
  const t = useTranslations("teacherStudentProgress");

  return (
    <Card className="rounded-2xl border-border/70 bg-card/75 py-0">
      <CardHeader className="pt-7 pb-3">
        <CardTitle className="text-xl">{t("recommendedFocusAreas")}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3.5 pb-5">
        {recommendations.map((item) => {
          const Icon = moduleIcons[item.focusModule];

          return (
            <div key={item.id} className="rounded-2xl border border-border/70 bg-background/45 p-3">
              <div className="flex items-start gap-3">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">{t("recommendationTitle", {skill: t(`weakAreaLabels.${item.targetSkill}`)})}</p>
                  <p className="text-sm text-muted-foreground">
                    {t("recommendationDescription", {
                      priority: t(`priority.${item.priority}`),
                      count: item.moduleCount,
                      module: t(`modules.${item.focusModule}`)
                    })}
                  </p>
                </div>
                <Button type="button" size="sm" className="rounded-lg" onClick={() => onAssign(item)}>
                  {t("assign")}
                </Button>
              </div>
            </div>
          );
        })}

        <div className="border-t border-border/65 pt-3.5">
          <Button asChild variant="link" className="ml-auto flex h-auto px-0 text-sm text-primary">
            <Link href={viewAllHref}>
              {t("viewAllRecommendations")}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
