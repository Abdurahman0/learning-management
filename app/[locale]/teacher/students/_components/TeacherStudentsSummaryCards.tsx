"use client";

import type {LucideIcon} from "lucide-react";
import {AlertTriangle, TrendingUp, UserMinus, Users} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";
import type {TeacherStudentsSummary} from "@/data/teacher/selectors";

type TeacherStudentsSummaryCardsProps = {
  summary: TeacherStudentsSummary;
};

type SummaryCard = {
  key: "totalStudents" | "studentsImproving" | "needingHelp" | "inactiveStudents";
  value: number;
  icon: LucideIcon;
  indicatorKey: "growthPositive" | "improvingShare" | "needsAttention" | "inactiveShare";
  indicatorClass: string;
};

export function TeacherStudentsSummaryCards({summary}: TeacherStudentsSummaryCardsProps) {
  const t = useTranslations("teacherStudents");

  const cards: SummaryCard[] = [
    {
      key: "totalStudents",
      value: summary.totalStudents,
      icon: Users,
      indicatorKey: "growthPositive",
      indicatorClass: "border-emerald-500/25 bg-emerald-500/14 text-emerald-300"
    },
    {
      key: "studentsImproving",
      value: summary.studentsImproving,
      icon: TrendingUp,
      indicatorKey: "improvingShare",
      indicatorClass: "border-blue-500/25 bg-blue-500/14 text-blue-300"
    },
    {
      key: "needingHelp",
      value: summary.needingHelp,
      icon: AlertTriangle,
      indicatorKey: "needsAttention",
      indicatorClass: "border-amber-500/25 bg-amber-500/14 text-amber-300"
    },
    {
      key: "inactiveStudents",
      value: summary.inactiveStudents,
      icon: UserMinus,
      indicatorKey: "inactiveShare",
      indicatorClass: "border-slate-500/25 bg-slate-500/14 text-slate-300"
    }
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Card key={card.key} className="rounded-2xl border-border/70 bg-card/75 py-0 backdrop-blur-sm">
            <CardContent className="px-5 py-5">
              <div className="flex items-start justify-between gap-3">
                <span className="inline-flex size-11 items-center justify-center rounded-xl border border-primary/15 bg-primary/14 text-primary">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>

                <span className={`rounded-md border px-2 py-1 text-[11px] font-medium ${card.indicatorClass}`}>
                  {t(`summaryIndicators.${card.indicatorKey}`)}
                </span>
              </div>

              <div className="mt-5 space-y-1.5">
                <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">{t(card.key)}</p>
                <p className="text-[2.05rem] leading-none font-semibold tracking-tight">{card.value.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
