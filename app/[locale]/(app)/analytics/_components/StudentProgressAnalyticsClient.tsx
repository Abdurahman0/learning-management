"use client";

import {useEffect, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {Activity, ArrowRight, Download, Goal, Target, TrendingUp} from "lucide-react";
import {Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";

import {getQuestionTypeDisplayLabel} from "@/src/services/student/questionTypeLabels";
import {studentAnalyticsService} from "@/src/services/student/analytics.service";
import type {StudentAnalyticsPracticeActivity, StudentAnalyticsResponse} from "@/src/services/student/types";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ChartContainer} from "@/components/ui/chart";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {cn} from "@/lib/utils";

type Notice = {
  title: string;
  description: string;
};

type RangeKey = "last6Tests" | "last12Tests";

const cardClassName =
  "rounded-2xl border border-border/70 bg-card/95 dark:border-slate-700/45 dark:bg-[linear-gradient(155deg,rgba(17,24,39,0.92),rgba(15,23,42,0.9))] shadow-none";

const insightToneClassName = {
  positive: "bg-emerald-400",
  neutral: "bg-blue-400",
  warning: "bg-amber-400"
} as const;

const moduleToneClassName = {
  reading: "border-indigo-400/35 bg-indigo-500/12 text-indigo-700 dark:text-indigo-200",
  listening: "border-blue-400/35 bg-blue-500/12 text-blue-700 dark:text-blue-200",
  writing: "border-violet-400/35 bg-violet-500/12 text-violet-700 dark:text-violet-200",
  speaking: "border-cyan-400/35 bg-cyan-500/12 text-cyan-700 dark:text-cyan-200"
} as const;

const moduleBarColor = {
  reading: "#6366f1",
  listening: "#3b82f6",
  writing: "#8b5cf6",
  speaking: "#06b6d4"
} as const;

const EMPTY_ANALYTICS: StudentAnalyticsResponse = {
  summary: {
    currentBandEstimate: 0,
    currentBandDelta: 0,
    targetBand: 0,
    practiceSessions: 0,
    averageAccuracy: 0,
    accuracyDelta: 0
  },
  bandProgression: [],
  accuracyImprovement: [],
  weeklyStudyActivity: [],
  modulePerformance: [],
  learningInsights: [],
  recentPracticeActivity: [],
  raw: null
};

function formatActivityDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value || "-";
  }

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function getRangePoints<T>(items: T[], range: RangeKey) {
  const count = range === "last6Tests" ? 6 : 12;
  return items.slice(-count);
}

function getDomain(values: number[], fallback: [number, number], minBound?: number, maxBound?: number) {
  if (values.length === 0) return fallback;
  const min = Math.min(...values);
  const max = Math.max(...values);
  let domainMin = Math.floor(min - 1);
  let domainMax = Math.ceil(max + 1);

  if (domainMin === domainMax) {
    domainMax += 1;
  }

  if (typeof minBound === "number") {
    domainMin = Math.max(minBound, domainMin);
  }
  if (typeof maxBound === "number") {
    domainMax = Math.min(maxBound, domainMax);
  }

  return [domainMin, domainMax] as [number, number];
}

export function StudentProgressAnalyticsClient() {
  const t = useTranslations("studentProgress");
  const locale = useLocale();
  const router = useRouter();

  const [selectedRange, setSelectedRange] = useState<RangeKey>("last6Tests");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<StudentAnalyticsResponse>(EMPTY_ANALYTICS);

  useEffect(() => {
    let active = true;

    const loadAnalytics = async () => {
      setIsLoading(true);
      try {
        const response = await studentAnalyticsService.getAnalytics();
        if (!active) return;
        setAnalyticsData(response);
      } catch {
        if (!active) return;
        setAnalyticsData(EMPTY_ANALYTICS);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadAnalytics();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const progressionData = useMemo(
    () =>
      getRangePoints(analyticsData.bandProgression, selectedRange).map((point, index) => ({
        id: point.id,
        label: point.label || `#${index + 1}`,
        band: point.band
      })),
    [analyticsData.bandProgression, selectedRange]
  );

  const accuracyData = useMemo(
    () =>
      analyticsData.accuracyImprovement.map((point, index) => ({
        id: point.id,
        label: point.label || `W${index + 1}`,
        percentage: point.percentage
      })),
    [analyticsData.accuracyImprovement]
  );

  const weeklyActivityData = useMemo(
    () =>
      analyticsData.weeklyStudyActivity.map((point, index) => ({
        id: point.id,
        label: point.label || `W${index + 1}`,
        sessions: point.sessions
      })),
    [analyticsData.weeklyStudyActivity]
  );

  const modulePerformanceData = useMemo(
    () =>
      analyticsData.modulePerformance.filter(
        (item) => item.module === "reading" || item.module === "listening"
      ),
    [analyticsData.modulePerformance]
  );

  const insights = analyticsData.learningInsights.filter((item) => {
    const description = item.description?.trim() ?? "";
    if (!description) {
      return false;
    }
    const normalized = description.toLowerCase();
    return !normalized.includes("writing") && !normalized.includes("speaking");
  });
  const recentActivity = analyticsData.recentPracticeActivity.filter(
    (item) => item.module === "reading" || item.module === "listening"
  );
  const accuracyStart = accuracyData[0]?.percentage ?? 0;
  const accuracyCurrent = accuracyData[accuracyData.length - 1]?.percentage ?? 0;
  const bandDomain = getDomain(
    progressionData.map((item) => item.band),
    [0, 9],
    0,
    9
  );
  const accuracyDomain = getDomain(
    accuracyData.map((item) => item.percentage),
    [0, 100],
    0,
    100
  );

  const handleDownloadReport = () => {
    setNotice({
      title: t("feedback.download.title"),
      description: t("feedback.download.description")
    });
  };

  const handleViewHistory = () => {
    router.push(`/${locale}/dashboard`);
  };

  const handleActivityAction = (row: StudentAnalyticsPracticeActivity) => {
    if (row.action === "navigate" && row.href) {
      router.push(`/${locale}${row.href}`);
      return;
    }

    setNotice({
      title: t("feedback.unavailable.title"),
      description: t("feedback.unavailable.description")
    });
  };

  return (
    <main className="mx-auto min-w-0 w-full max-w-[1780px] overflow-x-hidden px-2 py-5 sm:px-4 sm:py-6 lg:px-6">
      <section className="space-y-5 sm:space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground dark:text-slate-100 sm:text-3xl">{t("title")}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground dark:text-slate-300 sm:text-[15px]">{t("subtitle")}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-border/70 dark:border-slate-600/65 bg-background/70 dark:bg-slate-900/45 text-foreground dark:text-slate-100 hover:bg-muted dark:hover:bg-slate-800/70"
            onClick={handleDownloadReport}
          >
            <Download className="size-4" />
            {t("actions.downloadReport")}
          </Button>
        </header>

        {notice ? (
          <Card className="rounded-xl border-blue-400/35 bg-blue-500/10 shadow-none">
            <CardContent className="p-3">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-100">{notice.title}</p>
              <p className="text-sm text-blue-700/90 dark:text-blue-100/85">{notice.description}</p>
            </CardContent>
          </Card>
        ) : null}

        <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className={cn(cardClassName, "relative overflow-hidden")}>
            <span className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full bg-blue-500/16 blur-2xl" />
            <CardContent className="relative p-5">
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/14 text-blue-700 dark:text-blue-300">
                <TrendingUp className="size-4.5" />
              </div>
              <p className="text-sm text-muted-foreground dark:text-slate-300">{t("summary.currentBand.label")}</p>
              <p className="mt-1 flex items-end gap-2 text-4xl leading-none font-semibold tracking-tight text-foreground dark:text-slate-100">
                {analyticsData.summary.currentBandEstimate.toFixed(1)}
                <span className="mb-1 text-lg font-medium text-emerald-600 dark:text-emerald-300">
                  {analyticsData.summary.currentBandDelta >= 0 ? "+" : ""}
                  {analyticsData.summary.currentBandDelta.toFixed(1)}
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className={cn(cardClassName, "relative overflow-hidden")}>
            <span className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full bg-indigo-500/14 blur-2xl" />
            <CardContent className="relative p-5">
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/14 text-indigo-700 dark:text-indigo-300">
                <Goal className="size-4.5" />
              </div>
              <p className="text-sm text-muted-foreground dark:text-slate-300">{t("summary.targetBand.label")}</p>
              <p className="mt-1 flex items-end gap-2 text-4xl leading-none font-semibold tracking-tight text-foreground dark:text-slate-100">
                {analyticsData.summary.targetBand.toFixed(1)}
                <span className="mb-1 text-sm font-medium text-muted-foreground dark:text-slate-300">{t("summary.targetBand.meta")}</span>
              </p>
            </CardContent>
          </Card>

          <Card className={cn(cardClassName, "relative overflow-hidden")}>
            <span className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full bg-cyan-500/14 blur-2xl" />
            <CardContent className="relative p-5">
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/14 text-cyan-700 dark:text-cyan-300">
                <Activity className="size-4.5" />
              </div>
              <p className="text-sm text-muted-foreground dark:text-slate-300">{t("summary.practiceSessions.label")}</p>
              <p className="mt-1 flex items-end gap-2 text-4xl leading-none font-semibold tracking-tight text-foreground dark:text-slate-100">
                {analyticsData.summary.practiceSessions}
                <span className="mb-1 text-sm font-medium text-muted-foreground dark:text-slate-300">{t("summary.practiceSessions.meta")}</span>
              </p>
            </CardContent>
          </Card>

          <Card className={cn(cardClassName, "relative overflow-hidden")}>
            <span className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full bg-emerald-500/14 blur-2xl" />
            <CardContent className="relative p-5">
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/14 text-emerald-700 dark:text-emerald-300">
                <Target className="size-4.5" />
              </div>
              <p className="text-sm text-muted-foreground dark:text-slate-300">{t("summary.averageAccuracy.label")}</p>
              <p className="mt-1 flex items-end gap-2 text-4xl leading-none font-semibold tracking-tight text-foreground dark:text-slate-100">
                {analyticsData.summary.averageAccuracy}%
                <span className="mb-1 text-lg font-medium text-emerald-600 dark:text-emerald-300">
                  {analyticsData.summary.accuracyDelta >= 0 ? "+" : ""}
                  {analyticsData.summary.accuracyDelta}%
                </span>
              </p>
            </CardContent>
          </Card>
        </section>

        {isLoading ? (
          <Card className={cardClassName}>
            <CardContent className="p-6 text-sm text-muted-foreground">{t("empty.loading")}</CardContent>
          </Card>
        ) : null}

        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,1fr)]">
          <Card className={cardClassName}>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="text-xl font-semibold tracking-tight text-foreground dark:text-slate-100">{t("charts.bandProgress.title")}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">{t("charts.bandProgress.subtitle")}</p>
              </div>
              <Select value={selectedRange} onValueChange={(value) => setSelectedRange(value as RangeKey)}>
                <SelectTrigger className="w-[170px] rounded-xl border-border/70 dark:border-slate-600/70 bg-background/80 dark:bg-slate-900/65 text-foreground dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last6Tests">{t("filters.last6Tests")}</SelectItem>
                  <SelectItem value="last12Tests">{t("filters.last12Tests")}</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="pt-1">
              {progressionData.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">{t("empty.bandProgress")}</p>
              ) : (
                <ChartContainer className="h-[310px] w-full rounded-xl border border-border/70 dark:border-slate-700/45 bg-background/80 dark:bg-slate-950/35 p-2 sm:p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressionData} margin={{top: 12, right: 12, left: -14, bottom: 6}}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{fontSize: 12, fill: "#94a3b8"}} interval="preserveStartEnd" />
                      <YAxis tickLine={false} axisLine={false} tick={{fontSize: 12, fill: "#94a3b8"}} domain={bandDomain} />
                      <Tooltip
                        cursor={false}
                        content={({active, payload}) => {
                          if (!active || !payload?.length) return null;
                          const point = payload[0]?.payload as {label: string; band: number};
                          return (
                            <div className="rounded-xl border border-border/70 dark:border-slate-600/70 bg-popover/95 dark:bg-slate-900/95 px-3 py-2 text-xs">
                              <p className="font-semibold text-foreground dark:text-slate-100">{point.label}</p>
                              <p className="mt-1 text-muted-foreground dark:text-slate-300">{t("charts.bandProgress.tooltip", {value: point.band.toFixed(1)})}</p>
                            </div>
                          );
                        }}
                      />
                      <Line type="monotone" dataKey="band" stroke="#6366f1" strokeWidth={3} dot={{r: 4, fill: "#0f172a", stroke: "#818cf8", strokeWidth: 2}} />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className={cardClassName}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-tight text-foreground dark:text-slate-100">{t("modulePerformance.title")}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">{t("modulePerformance.subtitle")}</p>
            </CardHeader>
            <CardContent className="space-y-5 pt-1">
              {modulePerformanceData.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">{t("empty.modulePerformance")}</p>
              ) : (
                modulePerformanceData.map((item) => (
                  <div key={item.module} className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-foreground/90 dark:text-slate-200">{t(`modules.${item.module}`)}</p>
                      <p className="text-sm font-semibold text-foreground dark:text-slate-100">{item.percentage}%</p>
                    </div>
                    <div className="h-3 w-full overflow-hidden rounded-full bg-muted dark:bg-slate-800">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${item.percentage}%`,
                          background: `linear-gradient(90deg, ${moduleBarColor[item.module]}B3, ${moduleBarColor[item.module]})`
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid min-w-0 gap-4 xl:grid-cols-3">
          <Card className={cardClassName}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-tight text-foreground dark:text-slate-100">{t("charts.accuracy.title")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {accuracyData.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">{t("empty.accuracy")}</p>
              ) : (
                <>
                  <ChartContainer className="h-[210px] w-full rounded-xl border border-border/70 dark:border-slate-700/45 bg-background/80 dark:bg-slate-950/35 p-2 sm:p-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={accuracyData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                        <defs>
                          <linearGradient id="accuracy-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#818cf8" stopOpacity={0.36} />
                            <stop offset="100%" stopColor="#818cf8" stopOpacity={0.05} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{fontSize: 11, fill: "#94a3b8"}} />
                        <YAxis tickLine={false} axisLine={false} tick={{fontSize: 11, fill: "#94a3b8"}} domain={accuracyDomain} />
                        <Tooltip
                          cursor={false}
                          content={({active, payload}) => {
                            if (!active || !payload?.length) return null;
                            const point = payload[0]?.payload as {label: string; percentage: number};
                            return (
                              <div className="rounded-xl border border-border/70 dark:border-slate-600/70 bg-popover/95 dark:bg-slate-900/95 px-3 py-2 text-xs">
                                <p className="font-semibold text-foreground dark:text-slate-100">{point.label}</p>
                                <p className="mt-1 text-muted-foreground dark:text-slate-300">{t("charts.accuracy.tooltip", {value: point.percentage})}</p>
                              </div>
                            );
                          }}
                        />
                        <Area type="monotone" dataKey="percentage" stroke="#818cf8" strokeWidth={2.5} fill="url(#accuracy-fill)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <p className="text-muted-foreground dark:text-slate-400">{t("charts.accuracy.start", {value: accuracyStart})}</p>
                    <p className="font-semibold text-foreground dark:text-slate-100">{t("charts.accuracy.current", {value: accuracyCurrent})}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className={cardClassName}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-tight text-foreground dark:text-slate-100">{t("charts.weekly.title")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {weeklyActivityData.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">{t("empty.weekly")}</p>
              ) : (
                <ChartContainer className="h-[245px] w-full rounded-xl border border-border/70 dark:border-slate-700/45 bg-background/80 dark:bg-slate-950/35 p-2 sm:p-3">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyActivityData} margin={{top: 10, right: 8, left: -18, bottom: 0}} barCategoryGap={16}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{fontSize: 11, fill: "#94a3b8"}} />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{fontSize: 11, fill: "#94a3b8"}} />
                      <Tooltip
                        cursor={false}
                        content={({active, payload}) => {
                          if (!active || !payload?.length) return null;
                          const point = payload[0]?.payload as {label: string; sessions: number};
                          return (
                            <div className="rounded-xl border border-border/70 dark:border-slate-600/70 bg-popover/95 dark:bg-slate-900/95 px-3 py-2 text-xs">
                              <p className="font-semibold text-foreground dark:text-slate-100">{point.label}</p>
                              <p className="mt-1 text-muted-foreground dark:text-slate-300">{t("charts.weekly.tooltip", {value: point.sessions})}</p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="sessions" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={34} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card className={cn(cardClassName, "border-indigo-400/35")}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-tight text-foreground dark:text-slate-100">{t("insights.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-1">
              {insights.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">{t("empty.insights")}</p>
              ) : (
                insights.map((insight) => (
                  <div key={insight.id} className="flex items-start gap-3">
                    <span className={cn("mt-1 size-2 rounded-full", insightToneClassName[insight.tone])} />
                    <p className="text-sm leading-relaxed text-foreground/90 dark:text-slate-200">{insight.description}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className={cardClassName}>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-xl font-semibold tracking-tight text-foreground dark:text-slate-100">{t("table.title")}</CardTitle>
              <Button
                variant="link"
                className="h-auto p-0 text-indigo-600 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-200"
                onClick={handleViewHistory}
              >
                {t("actions.viewAllHistory")}
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentActivity.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">{t("empty.recentActivity")}</p>
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/70 dark:border-slate-700/50 bg-background/70 dark:bg-slate-900/35">
                          <TableHead className="text-muted-foreground dark:text-slate-300">{t("table.columns.date")}</TableHead>
                          <TableHead className="text-muted-foreground dark:text-slate-300">{t("table.columns.module")}</TableHead>
                          <TableHead className="text-muted-foreground dark:text-slate-300">{t("table.columns.questionType")}</TableHead>
                          <TableHead className="text-muted-foreground dark:text-slate-300">{t("table.columns.accuracy")}</TableHead>
                          <TableHead className="text-muted-foreground dark:text-slate-300">{t("table.columns.duration")}</TableHead>
                          <TableHead className="text-right text-muted-foreground dark:text-slate-300">{t("table.columns.action")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {recentActivity.map((row) => (
                          <TableRow key={row.id} className="border-border/70 dark:border-slate-700/40">
                            <TableCell className="text-foreground dark:text-slate-100">{formatActivityDate(row.dateLabel, locale)}</TableCell>
                            <TableCell>
                              <Badge className={cn("border", moduleToneClassName[row.module])}>{t(`modules.${row.module}`)}</Badge>
                            </TableCell>
                            <TableCell className="text-foreground/90 dark:text-slate-200">
                              {getQuestionTypeDisplayLabel(row.questionType, {fallback: "-"} as const)}
                            </TableCell>
                            <TableCell className="font-semibold text-foreground dark:text-slate-100">{row.accuracy}%</TableCell>
                            <TableCell className="text-muted-foreground dark:text-slate-300">{t("table.duration", {value: row.durationMinutes})}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleActivityAction(row)}>
                                <ArrowRight className="size-4 text-foreground/90 dark:text-slate-200" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="space-y-3 p-4 md:hidden">
                    {recentActivity.map((row) => (
                      <div key={row.id} className="rounded-xl border border-border/70 dark:border-slate-700/55 bg-background/70 dark:bg-slate-900/35 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-foreground dark:text-slate-100">{formatActivityDate(row.dateLabel, locale)}</p>
                          <Badge className={cn("border", moduleToneClassName[row.module])}>{t(`modules.${row.module}`)}</Badge>
                        </div>
                        <p className="mt-2 text-sm text-foreground/90 dark:text-slate-200">{getQuestionTypeDisplayLabel(row.questionType, {fallback: "-"})}</p>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground dark:text-slate-300">{t("table.columns.accuracy")}</span>
                          <span className="font-semibold text-foreground dark:text-slate-100">{row.accuracy}%</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-sm">
                          <span className="text-muted-foreground dark:text-slate-300">{t("table.columns.duration")}</span>
                          <span className="text-foreground dark:text-slate-100">{t("table.duration", {value: row.durationMinutes})}</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-3 h-9 w-full rounded-lg border-border/70 dark:border-slate-600/70 bg-background/70 dark:bg-slate-900/40 text-foreground dark:text-slate-100"
                          onClick={() => handleActivityAction(row)}
                        >
                          {t("actions.openActivity")}
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}
