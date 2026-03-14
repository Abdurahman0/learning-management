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

type Notice = {
  title: string;
  description: string;
};

export function DashboardClient() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);

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

  const handleWeakAreaAction = (module: "reading" | "listening" | "writing" | "speaking") => {
    if (module === "reading" || module === "listening") {
      router.push(`/${locale}/${module}`);
      return;
    }

    pushNotice(t("feedback.placeholder.title"), t("feedback.placeholder.description"));
  };

  return (
    <main className="mx-auto min-w-0 w-full max-w-[1780px] overflow-x-hidden px-2 py-5 sm:px-4 sm:py-6 lg:px-6">
      <section className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t("title")}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("welcome", {name: DASHBOARD_DATA.userSummary.name, bandsAway: DASHBOARD_DATA.userSummary.bandsAway})}
          </p>
        </div>

        <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto">
          <Button variant="outline" onClick={() => document.getElementById("weak-areas")?.scrollIntoView({behavior: "smooth"})}>
            {t("practiceWeakAreas")}
          </Button>
          <Button asChild>
            <Link href={`/${locale}/reading`}>{t("startNewTest")}</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/${locale}/sessions`}>
              <CalendarClock className="size-4" />
              {t("actions.bookSession")}
            </Link>
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
          summary={DASHBOARD_DATA.userSummary}
          onCurrentBandClick={() => document.getElementById("skills-snapshot")?.scrollIntoView({behavior: "smooth", block: "start"})}
        />
        <p className="mt-2 text-xs text-muted-foreground">{t("kpis.streakRule")}</p>
      </div>

      <section className="mt-4">
        <ContinueCard
          test={DASHBOARD_DATA.continueTest}
          onReviewDetails={() => pushNotice(t("feedback.reviewDetails.title"), t("feedback.reviewDetails.description"))}
        />
      </section>

      <section className="mt-4 grid min-w-0 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <ScoreProgressChart points={DASHBOARD_DATA.scoreProgress} />
        <SkillsSnapshot
          id="skills-snapshot"
          skills={DASHBOARD_DATA.skillsSnapshot}
          summary={DASHBOARD_DATA.userSummary}
          overallJourneyPct={DASHBOARD_DATA.overallJourneyPct}
        />
      </section>

      <section className="mt-4 grid min-w-0 gap-4 xl:grid-cols-2">
        <Card id="weak-areas" className="rounded-2xl border-border/70 bg-card/70">
          <CardHeader>
            <CardTitle>{t("weakAreas.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {DASHBOARD_DATA.weakAreas.map((item) => (
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
            <Badge className="mb-3">{DASHBOARD_DATA.aiRecommendation.tag}</Badge>
            <p className="rounded-xl bg-muted/60 p-4 text-sm leading-relaxed text-muted-foreground">{DASHBOARD_DATA.aiRecommendation.message}</p>
            <Button className="mt-4" onClick={() => router.push(`/${locale}/ai-coach`)}>
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
            <Button variant="link" className="h-auto p-0" onClick={() => router.push(`/${locale}/analytics`)}>
              {t("recentHistory.viewAll")}
            </Button>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-[720px]">
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
                  {DASHBOARD_DATA.recentHistory.map((row) => (
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
        <AchievementsGrid achievements={DASHBOARD_DATA.achievements} />
      </section>
    </main>
  );
}
