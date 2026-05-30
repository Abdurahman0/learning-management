"use client";

import {BookOpenText, CalendarDays, Flame, GraduationCap, TrendingUp} from "lucide-react";
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

  const targetBand = (summary.targetReadingBand + summary.targetListeningBand) / 2;
  const examDateValue = examDate ? formatIsoDateLabel(examDate, locale) : t("kpis.examCountdown.valueNotSet");
  const targetBandLabel = t("kpis.targetBand");

  const items = [
    {label: t("kpis.currentBand"), value: summary.currentBand, decimals: 1, icon: TrendingUp, bubble: "bg-blue-500/15 text-blue-300", onClick: onCurrentBandClick},
    {label: t("kpis.testsTaken"), value: summary.testsTaken, icon: GraduationCap, bubble: "bg-violet-500/15 text-violet-300"},
    {
      label: t("kpis.targetBand"),
      value: targetBand,
      decimals: 1,
      icon: BookOpenText,
      bubble: "bg-emerald-500/15 text-emerald-300",
      className: "md:row-span-2"
    },
    {label: t("kpis.studyStreak"), value: summary.streakDays, suffix: ` ${t("days")}`, icon: Flame, bubble: "bg-orange-500/15 text-orange-300"},
    {
      label: t("kpis.examDate"),
      textValue: examDateValue,
      subtext: examCountdownValue,
      icon: CalendarDays,
      bubble: "bg-fuchsia-500/15 text-fuchsia-300",
      onClick: onExamCountdownClick
    }
  ];

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {items.map((item) => (
        <Card
          key={item.label}
          className={cn(
            "min-w-0 rounded-2xl border-border/70 bg-card/70 backdrop-blur",
            item.className,
            item.onClick && "cursor-pointer"
          )}
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
          <CardContent
            className={cn(
              "flex h-full gap-3 p-5",
              item.label === targetBandLabel ? "relative flex-col items-start justify-between overflow-hidden" : "items-center"
            )}
          >
            {item.label === targetBandLabel ? (
              <div className="relative flex h-full w-full flex-col justify-between">
                <div className="absolute inset-x-6 bottom-4 top-20 rounded-[2rem] bg-[radial-gradient(circle_at_50%_20%,rgba(16,185,129,0.12),transparent_62%),radial-gradient(circle_at_80%_70%,rgba(34,211,238,0.16),transparent_55%)]" />
                <div className="relative flex items-start justify-between gap-3">
                  <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", item.bubble)}>
                    <item.icon className="size-5" />
                  </span>
                  <div className="min-w-0 text-right">
                    <p className="text-base font-medium text-muted-foreground">{item.label}</p>
                    <p className="text-5xl font-black tracking-tight text-foreground sm:text-6xl">
                      <AnimatedNumber value={targetBand} decimals={1} />
                    </p>
                  </div>
                </div>
                <div className="relative z-10 flex items-end justify-between gap-3">
                  <p className="max-w-32 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground/90">
                    {t("kpis.targetBand")}
                  </p>
                </div>
                <div className="pointer-events-none absolute -bottom-2 right-2 select-none text-[7rem] font-black leading-none tracking-tight text-foreground/5 dark:text-white/5">
                  7.0
                </div>
              </div>
            ) : (
              <>
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
                  {item.subtext ? <p className="mt-2 text-xs font-medium text-muted-foreground">{item.subtext}</p> : null}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
