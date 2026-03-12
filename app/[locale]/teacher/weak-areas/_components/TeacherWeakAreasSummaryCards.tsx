"use client";

import type {LucideIcon} from "lucide-react";
import {AlertTriangle, BookOpenCheck, Star, Target} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";
import type {TeacherWeakAreasSummary} from "@/data/teacher/selectors";

type TeacherWeakAreasSummaryCardsProps = {
  summary: TeacherWeakAreasSummary;
};

type SummaryCard = {
  key: keyof TeacherWeakAreasSummary;
  labelKey: "mostDifficultModule" | "hardestQuestionType" | "lowestAverageScore" | "studentsNeedingHelp";
  icon: LucideIcon;
  tone: "primary" | "violet" | "rose" | "amber";
  indicatorKey: "mostDifficultModule" | "hardestQuestionType" | "lowestAverageScore" | "studentsNeedingHelp";
};

const summaryCards: SummaryCard[] = [
  {
    key: "mostDifficultModule",
    labelKey: "mostDifficultModule",
    icon: BookOpenCheck,
    tone: "primary",
    indicatorKey: "mostDifficultModule"
  },
  {
    key: "hardestQuestionType",
    labelKey: "hardestQuestionType",
    icon: Target,
    tone: "violet",
    indicatorKey: "hardestQuestionType"
  },
  {
    key: "lowestAverageScore",
    labelKey: "lowestAverageScore",
    icon: Star,
    tone: "rose",
    indicatorKey: "lowestAverageScore"
  },
  {
    key: "studentsNeedingHelpCount",
    labelKey: "studentsNeedingHelp",
    icon: AlertTriangle,
    tone: "amber",
    indicatorKey: "studentsNeedingHelp"
  }
];

function toneClass(tone: SummaryCard["tone"]) {
  if (tone === "violet") {
    return "border-violet-500/30 bg-violet-500/15 text-violet-300";
  }

  if (tone === "rose") {
    return "border-rose-500/30 bg-rose-500/15 text-rose-300";
  }

  if (tone === "amber") {
    return "border-amber-500/30 bg-amber-500/15 text-amber-300";
  }

  return "border-primary/30 bg-primary/15 text-primary";
}

export function TeacherWeakAreasSummaryCards({summary}: TeacherWeakAreasSummaryCardsProps) {
  const t = useTranslations("teacherWeakAreas");

  const summaryValues: Record<keyof TeacherWeakAreasSummary, string> = {
    mostDifficultModule: t(`modules.${summary.mostDifficultModule}`),
    hardestQuestionType: t(`questionTypeLabels.${summary.hardestQuestionType}`),
    lowestAverageScore: summary.lowestAverageScore.toFixed(1),
    studentsNeedingHelpCount: `${summary.studentsNeedingHelpCount}`
  };

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.key} className="rounded-2xl border-border/70 bg-card/75 py-0">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className={`inline-flex size-10 items-center justify-center rounded-xl border ${toneClass(card.tone)}`}>
                  <Icon className="size-4.5" />
                </span>
                <span className="inline-flex rounded-full border border-border/70 bg-background/55 px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                  {t(`summaryIndicators.${card.indicatorKey}`)}
                </span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">{t(card.labelKey)}</p>
                <p className="mt-1 text-[1.95rem] leading-none font-semibold tracking-tight">{summaryValues[card.key]}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
