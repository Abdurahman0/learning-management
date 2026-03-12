"use client";

import Link from "next/link";
import {Activity, BarChart3, Clock3, Flame, Target, TrendingUp} from "lucide-react";
import {useTranslations} from "next-intl";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Card, CardContent} from "@/components/ui/card";

type TeacherStudentProgressHeroProps = {
  studentName: string;
  studentFallback: string;
  studentIdLabel: string;
  targetBand: number;
  currentBand: number;
  totalTests: number;
  improvementBand: number;
  testsThisWeek: number;
  averageStudyTimeHours: number;
  streakDays: number;
  lastActiveLabel: string;
  viewFullProfileHref: string;
};

function formatHours(value: number) {
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}h`;
}

export function TeacherStudentProgressHero({
  studentName,
  studentFallback,
  studentIdLabel,
  targetBand,
  currentBand,
  totalTests,
  improvementBand,
  testsThisWeek,
  averageStudyTimeHours,
  streakDays,
  lastActiveLabel,
  viewFullProfileHref
}: TeacherStudentProgressHeroProps) {
  const t = useTranslations("teacherStudentProgress");
  const improvementPrefix = improvementBand >= 0 ? "+" : "";

  return (
    <Card className="overflow-hidden rounded-3xl border-border/70 bg-card/80 py-0">
      <CardContent className="grid gap-4 p-5 sm:p-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.1fr)_minmax(300px,0.88fr)]">
        <section className="rounded-2xl border border-border/70 bg-background/40 p-4">
          <div className="flex items-start gap-3.5">
            <Avatar size="lg" className="ring-2 ring-border/70">
              <AvatarFallback className="bg-primary/18 text-primary">{studentFallback}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-semibold tracking-tight">{studentName}</h2>
              <p className="text-sm text-muted-foreground">
                {t("studentId")}: {studentIdLabel}
              </p>
            </div>
          </div>
          <Button asChild className="mt-4 h-10 rounded-xl">
            <Link href={viewFullProfileHref}>{t("viewFullProfile")}</Link>
          </Button>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3.5">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("targetBand")}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-4xl leading-none font-semibold text-primary">
              <Target className="size-4.5" />
              {targetBand.toFixed(1)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3.5">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("currentBand")}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-4xl leading-none font-semibold">
              <TrendingUp className="size-4.5 text-emerald-400" />
              {currentBand.toFixed(1)}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3.5">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("totalTests")}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-4xl leading-none font-semibold">
              <BarChart3 className="size-4.5 text-primary" />
              {totalTests}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3.5">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("improvement")}</p>
            <p className="mt-1 inline-flex items-center gap-1.5 text-3xl leading-none font-semibold text-emerald-300">
              <Activity className="size-4.5" />
              {improvementPrefix}
              {improvementBand.toFixed(1)} {t("bandLabel")}
            </p>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3.5">
              <p className="text-3xl leading-none font-semibold">{testsThisWeek}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("testsThisWeek")}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3.5">
              <p className="text-3xl leading-none font-semibold">{formatHours(averageStudyTimeHours)}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("averageStudyTime")}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3.5">
              <p className="inline-flex items-center gap-1.5 text-3xl leading-none font-semibold text-amber-300">
                <Flame className="size-4.5" />
                {streakDays}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t("dayStreak")}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/45 px-4 py-3.5">
              <p className="inline-flex items-center gap-1.5 text-2xl leading-none font-semibold">
                <Clock3 className="size-4.5 text-primary" />
                {lastActiveLabel}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{t("lastActive")}</p>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
