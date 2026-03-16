"use client";

import type {LucideIcon} from "lucide-react";
import {AlertTriangle, CheckCheck, ClipboardCheck, Star} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";
import type {TeacherReviewsSummary} from "@/data/teacher/selectors";

type TeacherReviewsSummaryCardsProps = {
  summary: TeacherReviewsSummary;
};

type SummaryKey = keyof TeacherReviewsSummary;

type SummaryCard = {
  key: SummaryKey;
  icon: LucideIcon;
  tone: "blue" | "emerald" | "amber" | "rose";
  format?: (value: number) => string;
};

const cards: SummaryCard[] = [
  {key: "pendingReviews", icon: ClipboardCheck, tone: "blue"},
  {key: "reviewedToday", icon: CheckCheck, tone: "emerald"},
  {key: "averageBandScore", icon: Star, tone: "amber", format: (value) => value.toFixed(1)},
  {key: "overdueSubmissions", icon: AlertTriangle, tone: "rose"}
];

function toneClass(tone: SummaryCard["tone"]) {
  if (tone === "emerald") {
    return "bg-emerald-600/72 text-white dark:bg-emerald-500/12 dark:text-emerald-300 border-emerald-500/30";
  }

  if (tone === "amber") {
    return "bg-amber-600/72 text-white dark:bg-amber-500/12 dark:text-amber-300 border-amber-500/30";
  }

  if (tone === "rose") {
    return "bg-rose-600/72 text-white dark:bg-rose-500/12 dark:text-rose-300 border-rose-500/30";
  }

  return "bg-primary/12 text-primary border-primary/30";
}

export function TeacherReviewsSummaryCards({summary}: TeacherReviewsSummaryCardsProps) {
  const t = useTranslations("teacherReviews");

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const value = summary[card.key];

        return (
          <Card key={card.key} className="rounded-2xl border-border/70 bg-card/75 py-0">
            <CardContent className="space-y-4 p-4">
              <span className={`inline-flex size-10 items-center justify-center rounded-xl border ${toneClass(card.tone)}`}>
                <Icon className="size-4.5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">{t(card.key)}</p>
                <p className="mt-1 text-4xl leading-none font-semibold">
                  {card.format ? card.format(value) : value}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
