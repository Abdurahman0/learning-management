"use client";

import {BookOpenText, CalendarDays, Flame, GraduationCap, Headphones, TrendingUp} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {Card, CardContent} from "@/components/ui/card";
import {AnimatedNumber} from "@/components/ui/animated-number";
import type {DashboardUserSummary} from "@/data/student/dashboard";
import {cn} from "@/lib/utils";

type DashboardKpisProps = {
  summary: DashboardUserSummary;
  onCurrentBandClick?: () => void;
  examDate?: string | null; // YYYY-MM-DD
  onExamCountdownClick?: () => void;
};

function formatIsoDateLabel(iso: string, locale: string) {
  const trimmed = String(iso ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const [y, m, d] = trimmed.split("-").map((part) => Number(part));
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return trimmed;
  return new Intl.DateTimeFormat(locale, {month: "short", day: "2-digit", year: "numeric"}).format(date);
}

function daysUntilIsoDate(iso: string) {
  const trimmed = String(iso ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;
  const [y, m, d] = trimmed.split("-").map((part) => Number(part));
  const target = new Date(y, m - 1, d);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffMs = targetDay.getTime() - today.getTime();
  return Math.round(diffMs / 86400000);
}

export function DashboardKpis({summary, onCurrentBandClick, examDate, onExamCountdownClick}: DashboardKpisProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  const examDaysLeft = examDate ? daysUntilIsoDate(examDate) : null;
  const examCountdownValue = (() => {
    if (!examDate) return t("kpis.examCountdown.valueNotSet");
    if (examDaysLeft === null) return examDate;
    if (examDaysLeft <= 0) return examDaysLeft === 0 ? t("kpis.examCountdown.valueToday") : t("kpis.examCountdown.valuePassed");
    if (examDaysLeft === 1) return t("kpis.examCountdown.valueOneDay");
    return t("kpis.examCountdown.valueDays", {days: examDaysLeft});
  })();

  const examCountdownLabel = (() => {
    if (!examDate) return t("kpis.examCountdown.label");
    const labelDate = formatIsoDateLabel(examDate, locale);
    return t("kpis.examCountdown.labelWithDate", {date: labelDate});
  })();

  const items = [
    {label: t("kpis.currentBand"), value: summary.currentBand, decimals: 1, icon: TrendingUp, bubble: "bg-blue-500/15 text-blue-300", onClick: onCurrentBandClick},
    {label: t("kpis.testsTaken"), value: summary.testsTaken, icon: GraduationCap, bubble: "bg-violet-500/15 text-violet-300"},
    {label: t("kpis.reading"), value: summary.readingAccuracy, suffix: "%", icon: BookOpenText, bubble: "bg-emerald-500/15 text-emerald-300"},
    {label: t("kpis.listening"), value: summary.listeningAccuracy, suffix: "%", icon: Headphones, bubble: "bg-cyan-500/15 text-cyan-300"},
    {label: t("kpis.studyStreak"), value: summary.streakDays, suffix: ` ${t("days")}`, icon: Flame, bubble: "bg-orange-500/15 text-orange-300"},
    {label: examCountdownLabel, textValue: examCountdownValue, icon: CalendarDays, bubble: "bg-fuchsia-500/15 text-fuchsia-300", onClick: onExamCountdownClick}
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {items.map((item) => (
        <Card
          key={item.label}
          className={cn("min-w-0 rounded-2xl border-border/70 bg-card/70 backdrop-blur", item.onClick && "cursor-pointer")}
          role={item.onClick ? "button" : undefined}
          tabIndex={item.onClick ? 0 : undefined}
          onClick={item.onClick}
          onKeyDown={
            item.onClick
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    item.onClick?.();
                  }
                }
              : undefined
          }
        >
          <CardContent className="flex items-center gap-3 p-5">
            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", item.bubble)}>
              <item.icon className="size-4.5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="text-3xl leading-none font-semibold tracking-tight">
                {"textValue" in item ? (
                  item.textValue
                ) : (
                  <AnimatedNumber value={item.value} decimals={item.decimals ?? 0} suffix={item.suffix ?? ""} />
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
