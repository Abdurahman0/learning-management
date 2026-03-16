"use client";

import type {LucideIcon} from "lucide-react";
import {AlertTriangle, CheckCircle2, ClipboardCheck, Clock3} from "lucide-react";
import {useTranslations} from "next-intl";

import type {TeacherAssignmentsSummary} from "@/data/teacher/selectors";
import {Card, CardContent} from "@/components/ui/card";

type TeacherAssignmentsSummaryCardsProps = {
  summary: TeacherAssignmentsSummary;
};

type SummaryCard = {
  key: keyof TeacherAssignmentsSummary;
  icon: LucideIcon;
  tone: "blue" | "amber" | "emerald" | "rose";
};

const summaryCards: SummaryCard[] = [
  {key: "activeAssignments", icon: ClipboardCheck, tone: "blue"},
  {key: "dueSoon", icon: Clock3, tone: "amber"},
  {key: "completed", icon: CheckCircle2, tone: "emerald"},
  {key: "overdue", icon: AlertTriangle, tone: "rose"}
];

function toneClass(tone: SummaryCard["tone"]) {
  if (tone === "amber") {
    return "bg-amber-600/72 text-white dark:bg-amber-500/12 dark:text-amber-300 border-amber-500/25";
  }

  if (tone === "emerald") {
    return "bg-emerald-600/72 text-white dark:bg-emerald-500/12 dark:text-emerald-300 border-emerald-500/25";
  }

  if (tone === "rose") {
    return "bg-rose-600/72 text-white dark:bg-rose-500/12 dark:text-rose-300 border-rose-500/25";
  }

  return "bg-primary/12 text-primary border-primary/25";
}

export function TeacherAssignmentsSummaryCards({summary}: TeacherAssignmentsSummaryCardsProps) {
  const t = useTranslations("teacherAssignments");

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaryCards.map((item) => {
        const Icon = item.icon;

        return (
          <Card key={item.key} className="rounded-2xl border-border/70 bg-card/75 py-0">
            <CardContent className="space-y-4 p-4">
              <span className={`inline-flex size-10 items-center justify-center rounded-xl border ${toneClass(item.tone)}`}>
                <Icon className="size-4.5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">{t(item.key)}</p>
                <p className="mt-1 text-4xl leading-none font-semibold">{summary[item.key]}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
