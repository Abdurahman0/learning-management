"use client";

import {AlertTriangle, BarChart3, CheckCheck, FileWarning} from "lucide-react";
import {useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";

type ReportsSummaryCardsProps = {
  openReports: number;
  resolvedToday: number;
  mostReported: string;
  urgentReports: number;
};

const iconClassName = [
  "bg-blue-500/16 text-blue-300",
  "bg-emerald-500/16 text-emerald-300",
  "bg-violet-500/16 text-violet-300",
  "bg-rose-500/16 text-rose-300"
];

export function ReportsSummaryCards({openReports, resolvedToday, mostReported, urgentReports}: ReportsSummaryCardsProps) {
  const t = useTranslations("adminReports");

  const cards = [
    {id: "openReports", value: openReports.toLocaleString(), description: t("summary.openReportsHint"), icon: FileWarning},
    {id: "resolvedToday", value: resolvedToday.toLocaleString(), description: t("summary.resolvedTodayHint"), icon: CheckCheck},
    {id: "mostReported", value: mostReported, description: t("summary.mostReportedHint"), icon: BarChart3},
    {id: "urgentReports", value: urgentReports.toLocaleString(), description: t("summary.urgentReportsHint"), icon: AlertTriangle}
  ] as const;

  return (
    <section className="grid min-w-0 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <Card key={card.id} className="rounded-2xl border-border/70 bg-card/75 py-0">
            <CardContent className="space-y-2.5 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-medium tracking-[0.11em] text-muted-foreground uppercase">{t(`summary.${card.id}`)}</p>
                <span className={`inline-flex size-8 items-center justify-center rounded-lg ${iconClassName[index]}`}>
                  <Icon className="size-4" />
                </span>
              </div>
              <p className="truncate text-2xl leading-none font-semibold tracking-tight">{card.value}</p>
              <p className="truncate text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
