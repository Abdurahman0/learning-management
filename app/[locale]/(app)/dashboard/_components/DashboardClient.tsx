"use client";

import {useEffect, useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {Brain, CalendarClock, Sparkles} from "lucide-react";
import {useLocale, useTranslations} from "next-intl";

import {AchievementsGrid} from "./AchievementsGrid";
import {ContinueCard} from "./ContinueCard";
import {DashboardKpis} from "./DashboardKpis";
import {ScoreProgressChart} from "./ScoreProgressChart";
import {SkillsSnapshot} from "./SkillsSnapshot";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Separator} from "@/components/ui/separator";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {DASHBOARD_DATA} from "@/data/student/dashboard";
import {studentDashboardService} from "@/src/services/student/dashboard.service";
import type {StudentDashboardResponse} from "@/src/services/student/types";

type Notice = {
  title: string;
  description: string;
};

type DashboardViewModel = {
  userSummary: typeof DASHBOARD_DATA.userSummary;
  continueTest: (typeof DASHBOARD_DATA.continueTest & {href?: string}) | null;
  scoreProgress: typeof DASHBOARD_DATA.scoreProgress;
  skillsSnapshot: typeof DASHBOARD_DATA.skillsSnapshot;
  overallJourneyPct: number;
  weakAreas: Array<{
    id: string;
    title: string;
    module: "reading" | "listening" | "writing" | "speaking";
    accuracy: string;
    actionLabel: string;
  }>;
  aiRecommendation: typeof DASHBOARD_DATA.aiRecommendation | null;
  recentHistory: typeof DASHBOARD_DATA.recentHistory;
  achievements: typeof DASHBOARD_DATA.achievements;
};

function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
  }).format(date);
}

function buildDashboardViewModel(payload: StudentDashboardResponse): DashboardViewModel {
  const safeGoalBand = payload.summary.goalBand > 0 ? payload.summary.goalBand : DASHBOARD_DATA.userSummary.goalBand;
  const safeCurrentBand = payload.summary.currentBand >= 0 ? payload.summary.currentBand : 0;
  const journeyPercentRaw =
    payload.overallJourneyPct ??
    (safeGoalBand > 0 ? Math.round((safeCurrentBand / safeGoalBand) * 100) : DASHBOARD_DATA.overallJourneyPct);
  const overallJourneyPct = Math.max(0, Math.min(100, Number.isFinite(journeyPercentRaw) ? journeyPercentRaw : 0));

  return {
    userSummary: {
      name: payload.summary.name || DASHBOARD_DATA.userSummary.name,
      currentBand: safeCurrentBand,
      goalBand: safeGoalBand,
      testsTaken: payload.summary.testsTaken,
      readingAccuracy: payload.summary.readingAccuracy,
      listeningAccuracy: payload.summary.listeningAccuracy,
      streakDays: payload.summary.streakDays,
      streakIncreasedToday: payload.summary.streakIncreasedToday,
      bandsAway: payload.summary.bandsAway
    },
    continueTest: payload.continueTest
      ? {
          id: payload.continueTest.id,
          module: payload.continueTest.module,
          title: payload.continueTest.title,
          level: payload.continueTest.level,
          lastActiveLabel: payload.continueTest.lastActiveLabel,
          progressQuestions: payload.continueTest.progressQuestions,
          totalQuestions: payload.continueTest.totalQuestions,
          href: payload.continueTest.href
        }
      : null,
    scoreProgress: payload.scoreProgress.map((item) => ({
      label: item.label,
      band: item.band
    })),
    skillsSnapshot: payload.skillsSnapshot,
    overallJourneyPct,
    weakAreas: payload.weakAreas.map((item) => ({
      id: item.id,
      title: item.questionTypeLabel || item.title,
      module: item.module,
      accuracy: item.accuracy,
      actionLabel: item.actionLabel
    })),
    aiRecommendation: payload.aiRecommendation ?? null,
    recentHistory: payload.recentHistory.map((item) => ({
      id: item.id,
      testName: item.testName,
      date: formatDateLabel(item.date),
      module: item.module,
      score: item.score
    })),
    achievements:
      payload.achievements.length > 0
        ? payload.achievements
        : DASHBOARD_DATA.achievements
  };
}

export function DashboardClient() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardViewModel>({
    ...DASHBOARD_DATA,
    continueTest: {...DASHBOARD_DATA.continueTest},
    aiRecommendation: DASHBOARD_DATA.aiRecommendation
  });

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const pushNotice = (title: string, description: string) => {
    setNotice({title, description});
  };

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      try {
        const response = await studentDashboardService.getDashboard();
        if (!active) return;
        setDashboardData(buildDashboardViewModel(response));
      } catch {
        if (!active) return;
      }
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const handleWeakAreaAction = (module: "reading" | "listening" | "writing" | "speaking") => {
    if (module === "reading" || module === "listening") {
      router.push(`/${locale}/${module}`);
      return;
    }

    pushNotice(t("feedback.placeholder.title"), t("feedback.placeholder.description"));
  };

  return (
    <main className="mx-auto min-w-0 w-full max-w-445 overflow-x-hidden px-2 py-5 sm:px-4 sm:py-6 lg:px-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("welcome", {name: dashboardData.userSummary.name, bandsAway: dashboardData.userSummary.bandsAway})}
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto">
          <Button variant="outline" onClick={() => document.getElementById("weak-areas")?.scrollIntoView({behavior: "smooth"})}>
            {t("practiceWeakAreas")}
          </Button>
          <Button asChild>
            <Link href={`/${locale}/reading`}>{t("startNewTest")}</Link>
          </Button>
          <Button variant="secondary" onClick={() => pushNotice(t("feedback.placeholder.title"), t("feedback.placeholder.description"))}>
            <span>
              <CalendarClock className="size-4" />
              {t("actions.bookSession")}
            </span>
          </Button>
        </div>
      </section>

      {notice ? (
        <Card className="mt-4 rounded-xl border border-blue-400/35 bg-blue-500/10 shadow-none">
          <CardContent className="p-3">
            <p className="text-sm font-semibold text-blue-700 dark:text-blue-100">{notice.title}</p>
            <p className="text-sm text-blue-700/90 dark:text-blue-100/85">{notice.description}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-5">
        <DashboardKpis
          summary={dashboardData.userSummary}
          onCurrentBandClick={() => document.getElementById("skills-snapshot")?.scrollIntoView({behavior: "smooth", block: "start"})}
        />
        <p className="mt-2 text-xs text-muted-foreground">{t("kpis.streakRule")}</p>
      </div>

      {dashboardData.continueTest ? (
        <section className="mt-4">
          <ContinueCard
            test={dashboardData.continueTest}
            onReviewDetails={() => pushNotice(t("feedback.reviewDetails.title"), t("feedback.reviewDetails.description"))}
          />
        </section>
      ) : null}

      <section className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ScoreProgressChart points={dashboardData.scoreProgress} />
        <SkillsSnapshot
          id="skills-snapshot"
          skills={dashboardData.skillsSnapshot}
          summary={dashboardData.userSummary}
          overallJourneyPct={dashboardData.overallJourneyPct}
        />
      </section>

      <section className="mt-4 grid min-w-0 gap-4 xl:grid-cols-2">
        <Card id="weak-areas" className="rounded-2xl border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>{t("weakAreas.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboardData.weakAreas.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{t(`skills.${item.module}`)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-rose-500">{item.accuracy}</p>
                  <Button variant="link" className="h-auto p-0 text-xs" onClick={() => handleWeakAreaAction(item.module)}>
                    {item.actionLabel}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="size-4 text-blue-400" />
              {t("aiRecommendations.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="mb-3">{dashboardData.aiRecommendation?.tag ?? "Tutor insight"}</Badge>
            <p className="rounded-xl bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground">
              {dashboardData.aiRecommendation?.message ?? "Keep practicing daily to build consistency."}
            </p>
            <Button className="mt-4" onClick={() => pushNotice(t("feedback.placeholder.title"), t("feedback.placeholder.description"))}>
              <Sparkles className="size-4" />
              {t("aiRecommendations.startTutorial")}
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4">
        <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/70">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>{t("recentHistory.title")}</CardTitle>
            <Button variant="link" className="h-auto p-0" onClick={() => pushNotice(t("feedback.placeholder.title"), t("feedback.placeholder.description"))}>
              {t("recentHistory.viewAll")}
            </Button>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-180">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("recentHistory.columns.testName")}</TableHead>
                    <TableHead>{t("recentHistory.columns.date")}</TableHead>
                    <TableHead>{t("recentHistory.columns.module")}</TableHead>
                    <TableHead>{t("recentHistory.columns.score")}</TableHead>
                    <TableHead>{t("recentHistory.columns.action")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData.recentHistory.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.testName}</TableCell>
                      <TableCell className="text-muted-foreground">{row.date}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{t(`skills.${row.module}`)}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">{row.score}</TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          className="h-auto p-0 text-blue-400"
                          onClick={() => pushNotice(t("feedback.reviewDetails.title"), t("feedback.reviewDetails.description"))}
                        >
                          {t("recentHistory.review")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-4">
        <AchievementsGrid achievements={dashboardData.achievements} />
      </section>
    </main>
  );
}
