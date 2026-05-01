"use client";

import {useEffect, useId, useMemo, useState} from "react";
import {useTranslations} from "next-intl";
import {ArrowUpRight, ChevronDown, Download, Sparkles, Target, TrendingUp, TriangleAlert} from "lucide-react";
import {Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";

import {
  STUDENT_MISTAKE_RANGE_OPTIONS,
  type StudentMistakeRangeKey
} from "@/data/student-mistake-analysis";
import {getQuestionTypeDisplayLabel, getQuestionTypeShortCode} from "@/src/services/student/questionTypeLabels";
import {studentMistakeReasonsService} from "@/src/services/student/mistakeReasons.service";
import {studentReviewCenterService} from "@/src/services/student/reviewCenter.service";
import type {StudentMistakeAdvice, StudentReviewCenterResponse} from "@/src/services/student/types";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ChartContainer} from "@/components/ui/chart";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {InlineBoldText} from "@/components/test/InlineBoldText";
import {cn} from "@/lib/utils";

type SupportedModule = "reading" | "listening";

type QuestionTypeSeriesItem = {
  id: string;
  type: string;
  label: string;
  shortLabel: string;
  mistakes: number;
};

type ModuleSeriesItem = {
  id: string;
  module: SupportedModule;
  label: string;
  share: number;
  color: string;
};

const cardClassName =
  "rounded-2xl border border-border/70 bg-card/95 dark:border-slate-700/45 dark:bg-[linear-gradient(155deg,rgba(17,24,39,0.92),rgba(15,23,42,0.9))] shadow-none";

const MODULE_COLORS: Record<SupportedModule, string> = {
  reading: "#6366f1",
  listening: "#3b82f6"
};

const RANGE_DAYS: Record<StudentMistakeRangeKey, number> = {
  last7Days: 7,
  last30Days: 30,
  last3Months: 90,
  last6Months: 180,
  lastYear: 365
};

const API_DATE_RANGE_BY_KEY: Record<StudentMistakeRangeKey, string> = {
  last7Days: "last_7_days",
  last30Days: "last_30_days",
  last3Months: "last_3_months",
  last6Months: "last_6_months",
  lastYear: "last_year"
};

const EMPTY_REVIEW_CENTER: StudentReviewCenterResponse = {
  summary: null,
  mistakesByType: [],
  mistakesByModule: [],
  items: [],
  count: 0,
  next: null,
  previous: null,
  raw: null
};

function isSupportedModule(value: string): value is SupportedModule {
  return value === "reading" || value === "listening";
}

function toTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getRangeItems<T extends {createdAt?: string | null}>(items: T[], selectedRange: StudentMistakeRangeKey) {
  const now = Date.now();
  const rangeMilliseconds = RANGE_DAYS[selectedRange] * 24 * 60 * 60 * 1000;
  const itemsWithDate = items.filter((item) => toTimestamp(item.createdAt) !== null);

  if (itemsWithDate.length === 0) {
    return items;
  }

  const filtered = items.filter((item) => {
    const timestamp = toTimestamp(item.createdAt);
    if (timestamp === null) {
      return false;
    }
    return now - timestamp <= rangeMilliseconds;
  });

  return filtered.length > 0 ? filtered : itemsWithDate;
}

function getRangeDelta<T extends {createdAt?: string | null}>(items: T[], selectedRange: StudentMistakeRangeKey) {
  const now = Date.now();
  const rangeMilliseconds = RANGE_DAYS[selectedRange] * 24 * 60 * 60 * 1000;
  const timestamps = items
    .map((item) => toTimestamp(item.createdAt))
    .filter((value): value is number => value !== null);

  if (timestamps.length === 0) {
    return 0;
  }

  const currentWindow = timestamps.filter((timestamp) => now - timestamp <= rangeMilliseconds).length;
  const previousWindow = timestamps.filter((timestamp) => {
    const age = now - timestamp;
    return age > rangeMilliseconds && age <= rangeMilliseconds * 2;
  }).length;

  return Math.max(0, currentWindow - previousWindow);
}

function formatAdviceDate(value: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(undefined, {month: "short", day: "numeric"}).format(date);
}

function isSafeDownloadUrl(value: string | null) {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function getAdviceResourceUrl(item: StudentMistakeAdvice) {
  return item.reason.resource_url ?? item.reason.file_url ?? item.reason.link_url;
}

function getResourceFileName(value: string | null, fallback: string) {
  if (!value) return fallback;
  try {
    const url = new URL(value);
    const name = url.pathname.split("/").filter(Boolean).pop();
    return name ? decodeURIComponent(name).replace(/[_-]+/g, " ") : fallback;
  } catch {
    return fallback;
  }
}

export function StudentMistakeAnalysisPageClient() {
  const t = useTranslations("studentMistakes");
  const gradientId = useId().replace(/:/g, "");

  const [selectedRange, setSelectedRange] = useState<StudentMistakeRangeKey>("last30Days");
  const [isLoading, setIsLoading] = useState(true);
  const [reviewData, setReviewData] = useState<StudentReviewCenterResponse>(EMPTY_REVIEW_CENTER);
  const [adviceItems, setAdviceItems] = useState<StudentMistakeAdvice[]>([]);
  const [expandedAdviceIds, setExpandedAdviceIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let active = true;

    const loadMistakeData = async () => {
      setIsLoading(true);
      try {
        const response = await studentReviewCenterService.list({dateRange: API_DATE_RANGE_BY_KEY[selectedRange]});
        if (!active) {
          return;
        }

        setReviewData({
          ...response,
          summary: response.summary
            ? {
                ...response.summary,
                weakestModule: response.summary.weakestModule === "listening" ? "listening" : "reading"
              }
            : null,
          items: response.items.filter((item) => isSupportedModule(item.module)),
          mistakesByModule: response.mistakesByModule.filter((item) => isSupportedModule(item.module))
        });
      } catch {
        if (!active) {
          return;
        }
        setReviewData(EMPTY_REVIEW_CENTER);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadMistakeData();

    return () => {
      active = false;
    };
  }, [selectedRange]);

  useEffect(() => {
    let active = true;

    const loadAdvice = async () => {
      try {
        const response = await studentMistakeReasonsService.advice();
        if (!active) return;
        setAdviceItems(response);
      } catch {
        if (!active) return;
        setAdviceItems([]);
      }
    };

    void loadAdvice();

    return () => {
      active = false;
    };
  }, []);

  const itemsInRange = useMemo(() => getRangeItems(reviewData.items, selectedRange), [reviewData.items, selectedRange]);

  const reviewedDelta = useMemo(() => getRangeDelta(reviewData.items, selectedRange), [reviewData.items, selectedRange]);

  const questionTypeSeries = useMemo<QuestionTypeSeriesItem[]>(() => {
    const counts = new Map<string, number>();

    for (const item of itemsInRange) {
      const questionType = item.questionType?.trim();
      if (!questionType) {
        continue;
      }
      counts.set(questionType, (counts.get(questionType) ?? 0) + 1);
    }

    const fromItems = [...counts.entries()].map(([type, mistakes], index) => ({
      id: `range-type-${index + 1}-${type}`,
      type,
      mistakes
    }));

    const fallback = reviewData.mistakesByType
      .filter((item) => item.type.trim().length > 0)
      .map((item, index) => ({
        id: item.id || `api-type-${index + 1}`,
        type: item.type,
        mistakes: item.count
      }));

    const source = (fromItems.length ? fromItems : fallback).sort((left, right) => right.mistakes - left.mistakes);

    return source.map((item, index) => ({
      id: item.id,
      type: item.type,
      label: getQuestionTypeDisplayLabel(item.type, {fallback: "-"}),
      shortLabel: getQuestionTypeShortCode(item.type, `${index + 1}`),
      mistakes: item.mistakes
    }));
  }, [itemsInRange, reviewData.mistakesByType]);

  const moduleSeries = useMemo<ModuleSeriesItem[]>(() => {
    const counts = new Map<SupportedModule, number>([
      ["reading", 0],
      ["listening", 0]
    ]);

    for (const item of itemsInRange) {
      if (!isSupportedModule(item.module)) {
        continue;
      }
      counts.set(item.module, (counts.get(item.module) ?? 0) + 1);
    }

    const totalFromItems = [...counts.values()].reduce((sum, value) => sum + value, 0);
    if (totalFromItems > 0) {
      return (["reading", "listening"] as const).map((module) => {
        const count = counts.get(module) ?? 0;
        const share = Number(((count / totalFromItems) * 100).toFixed(1));

        return {
          id: `module-${module}`,
          module,
          label: t(`modules.${module}`),
          share,
          color: MODULE_COLORS[module]
        };
      }).filter((item) => item.share > 0);
    }

    const fallback: ModuleSeriesItem[] = [];
    for (const item of reviewData.mistakesByModule) {
      if (!isSupportedModule(item.module) || item.share <= 0) {
        continue;
      }

      fallback.push({
        id: item.id,
        module: item.module,
        label: t(`modules.${item.module}`),
        share: item.share,
        color: MODULE_COLORS[item.module]
      });
    }

    return fallback;
  }, [itemsInRange, reviewData.mistakesByModule, t]);

  const dominantModule = useMemo(() => {
    if (moduleSeries.length === 0) {
      return null;
    }

    return [...moduleSeries].sort((left, right) => right.share - left.share)[0];
  }, [moduleSeries]);

  const summary = useMemo(() => {
    const totalFromTypes = questionTypeSeries.reduce((sum, item) => sum + item.mistakes, 0);
    const totalMistakesReviewed = itemsInRange.length > 0
      ? itemsInRange.length
      : reviewData.summary?.questionsToReview ?? totalFromTypes;
    const mostDifficultType = questionTypeSeries[0]?.type || reviewData.summary?.mostDifficultType || "";
    const weakestModule = dominantModule?.module
      || (reviewData.summary?.weakestModule === "listening" ? "listening" : "reading");
    const accuracyTrend = Number.isFinite(reviewData.summary?.accuracyTrend)
      ? reviewData.summary?.accuracyTrend ?? 0
      : 0;

    return {
      totalMistakesReviewed,
      reviewedDelta,
      mostDifficultTypeLabel: mostDifficultType ? getQuestionTypeDisplayLabel(mostDifficultType, {fallback: "-"}) : "-",
      weakestModule,
      accuracyTrend
    };
  }, [dominantModule?.module, itemsInRange.length, questionTypeSeries, reviewData.summary, reviewedDelta]);

  return (
    <main className="mx-auto min-w-0 w-full max-w-445 overflow-x-hidden px-2 py-5 sm:px-4 sm:py-6 lg:px-6">
      <section className="space-y-5 sm:space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t("title")}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-[15px]">{t("subtitle")}</p>
        </header>

        <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className={cn(cardClassName, "relative overflow-hidden")}>
            <span className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full bg-blue-500/18 blur-2xl" />
            <CardContent className="relative p-5">
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/14 text-blue-700 dark:text-blue-300">
                <Target className="size-4.5" />
              </div>
              <p className="text-sm text-muted-foreground">{t("summary.totalMistakesReviewed.label")}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-foreground">{summary.totalMistakesReviewed}</p>
              <p className="mt-1 text-xs text-blue-600 dark:text-blue-300">{t("summary.totalMistakesReviewed.meta", {value: summary.reviewedDelta})}</p>
            </CardContent>
          </Card>

          <Card className={cn(cardClassName, "relative overflow-hidden")}>
            <span className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full bg-indigo-500/16 blur-2xl" />
            <CardContent className="relative p-5">
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl border border-indigo-400/30 bg-indigo-500/14 text-indigo-700 dark:text-indigo-300">
                <TriangleAlert className="size-4.5" />
              </div>
              <p className="text-sm text-muted-foreground">{t("summary.mostDifficultType.label")}</p>
              <p className="mt-1 text-xl font-semibold tracking-tight text-foreground">{summary.mostDifficultTypeLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("summary.mostDifficultType.meta")}</p>
            </CardContent>
          </Card>

          <Card className={cn(cardClassName, "relative overflow-hidden border-rose-400/35")}>
            <span className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full bg-rose-500/16 blur-2xl" />
            <CardContent className="relative p-5">
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl border border-rose-400/35 bg-rose-500/14 text-rose-700 dark:text-rose-300">
                <TriangleAlert className="size-4.5" />
              </div>
              <p className="text-sm text-muted-foreground">{t("summary.weakestModule.label")}</p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-rose-600 dark:text-rose-300">{t(`modules.${summary.weakestModule}`)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("summary.weakestModule.meta")}</p>
            </CardContent>
          </Card>

          <Card className={cn(cardClassName, "relative overflow-hidden")}>
            <span className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full bg-emerald-500/16 blur-2xl" />
            <CardContent className="relative p-5">
              <div className="mb-3 inline-flex size-10 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/14 text-emerald-700 dark:text-emerald-300">
                <TrendingUp className="size-4.5" />
              </div>
              <p className="text-sm text-muted-foreground">{t("summary.accuracyTrend.label")}</p>
              <p className="mt-1 flex items-center gap-1 text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-300">
                {summary.accuracyTrend > 0 ? "+" : ""}
                {summary.accuracyTrend}%
                <ArrowUpRight className="size-4.5" />
              </p>
              <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-200/90">{t("summary.accuracyTrend.meta")}</p>
            </CardContent>
          </Card>
        </section>

        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
          <Card className={cardClassName}>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="text-xl font-semibold tracking-tight text-foreground">{t("charts.questionType.title")}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{t("charts.questionType.subtitle")}</p>
              </div>
              <Select value={selectedRange} onValueChange={(value) => setSelectedRange(value as StudentMistakeRangeKey)}>
                <SelectTrigger className="w-full max-w-42.5 rounded-xl border-border/70 bg-background/80 text-foreground dark:border-slate-600/70 dark:bg-slate-900/65 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STUDENT_MISTAKE_RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="pt-1">
              <ChartContainer className="w-full rounded-xl border border-border/70 bg-background/80 p-2 sm:p-3 dark:border-slate-700/45 dark:bg-slate-950/35">
                <div className="h-90 sm:hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={questionTypeSeries} layout="vertical" margin={{top: 6, right: 6, left: 8, bottom: 6}} barCategoryGap={10}>
                      <defs>
                        <linearGradient id={`mistake-bar-mobile-${gradientId}`} x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#4f46e5" />
                          <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                      <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{fontSize: 11, fill: "#94a3b8"}} />
                      <YAxis
                        type="category"
                        dataKey="shortLabel"
                        width={76}
                        tickLine={false}
                        axisLine={false}
                        tick={{fontSize: 11, fill: "#94a3b8"}}
                      />
                      <Tooltip
                        cursor={false}
                        content={({active, payload}) => {
                          if (!active || !payload?.length) {
                            return null;
                          }

                          const point = payload[0]?.payload as QuestionTypeSeriesItem;

                          return (
                            <div className="rounded-xl border border-border/70 bg-popover/95 px-3 py-2 text-xs dark:border-slate-600/70 dark:bg-slate-900/95">
                              <p className="font-semibold text-foreground dark:text-slate-100">{point.label}</p>
                              <p className="mt-1 text-muted-foreground dark:text-slate-300">{t("charts.tooltips.mistakes", {value: point.mistakes})}</p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="mistakes" fill={`url(#mistake-bar-mobile-${gradientId})`} radius={[0, 7, 7, 0]} maxBarSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="hidden h-80 sm:block">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={questionTypeSeries} margin={{top: 8, right: 8, left: -20, bottom: 0}} barCategoryGap={16}>
                      <defs>
                        <linearGradient id={`mistake-bar-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818cf8" />
                          <stop offset="100%" stopColor="#4f46e5" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                      <XAxis
                        dataKey="shortLabel"
                        interval={0}
                        tickLine={false}
                        axisLine={false}
                        height={46}
                        tick={{fontSize: 12, fill: "#94a3b8"}}
                      />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{fontSize: 12, fill: "#94a3b8"}} />
                      <Tooltip
                        cursor={false}
                        content={({active, payload}) => {
                          if (!active || !payload?.length) {
                            return null;
                          }

                          const point = payload[0]?.payload as QuestionTypeSeriesItem;

                          return (
                            <div className="rounded-xl border border-border/70 bg-popover/95 px-3 py-2 text-xs dark:border-slate-600/70 dark:bg-slate-900/95">
                              <p className="font-semibold text-foreground dark:text-slate-100">{point.label}</p>
                              <p className="mt-1 text-muted-foreground dark:text-slate-300">{t("charts.tooltips.mistakes", {value: point.mistakes})}</p>
                            </div>
                          );
                        }}
                      />
                      <Bar dataKey="mistakes" fill={`url(#mistake-bar-${gradientId})`} radius={[8, 8, 0, 0]} maxBarSize={54} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className={cardClassName}>
            <CardHeader>
              <CardTitle className="text-xl font-semibold tracking-tight text-foreground">{t("charts.module.title")}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{t("charts.module.subtitle")}</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <ChartContainer className="relative h-65">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={moduleSeries}
                      dataKey="share"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={62}
                      outerRadius={92}
                      paddingAngle={2}
                      stroke="rgba(15,23,42,0.9)"
                      strokeWidth={2}
                    >
                      {moduleSeries.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({active, payload}) => {
                        if (!active || !payload?.length) {
                          return null;
                        }

                        const point = payload[0]?.payload as ModuleSeriesItem;

                        return (
                          <div className="rounded-xl border border-border/70 bg-popover/95 px-3 py-2 text-xs dark:border-slate-600/70 dark:bg-slate-900/95">
                            <p className="font-semibold text-foreground dark:text-slate-100">{point.label}</p>
                            <p className="mt-1 text-muted-foreground dark:text-slate-300">{t("charts.tooltips.share", {value: point.share})}</p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {dominantModule ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-4xl font-semibold tracking-tight text-foreground dark:text-slate-100">{dominantModule.share}%</p>
                      <p className="text-xs text-muted-foreground dark:text-slate-300">{t("charts.module.centerLabel", {module: dominantModule.label})}</p>
                    </div>
                  </div>
                ) : null}
              </ChartContainer>

              <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
                {moduleSeries.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm text-muted-foreground dark:text-slate-300">
                    <span className="size-2.5 rounded-full" style={{backgroundColor: item.color}} />
                    <span>{t("charts.module.legendItem", {module: item.label, value: item.share})}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-200">
                <Sparkles className="size-3.5" />
                {t("sections.recommendedAdvice")}
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{t("advice.modernTitle")}</h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{t("sections.recommendedAdviceDescription")}</p>
            </div>
            {adviceItems.length ? (
              <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
                {t("advice.count", {count: adviceItems.length})}
              </Badge>
            ) : null}
          </div>
          {adviceItems.length ? (
            <div className="space-y-3">
              {adviceItems.map((item) => {
                const isOpen = expandedAdviceIds.has(item.id);
                const generalSolution = item.reason.general_solution.trim()
                  || [item.reason.solution_1, item.reason.solution_2, item.reason.solution_3].map((solution) => solution.trim()).filter(Boolean)[0]
                  || "";
                const resourceUrl = getAdviceResourceUrl(item);

                return (
                  <article
                    key={item.id}
                    className={cn(
                      "group relative overflow-hidden rounded-3xl border border-border/70 bg-card/90 shadow-none transition-colors",
                      isOpen && "border-blue-400/45 bg-blue-500/5"
                    )}
                  >
                    <span className="pointer-events-none absolute -right-12 -top-12 size-32 rounded-full bg-blue-500/10 blur-2xl" />
                    <button
                      type="button"
                      className="relative flex w-full items-start justify-between gap-4 p-4 text-left"
                      onClick={() => {
                        setExpandedAdviceIds((current) => {
                          const next = new Set(current);
                          if (next.has(item.id)) {
                            next.delete(item.id);
                          } else {
                            next.add(item.id);
                          }
                          return next;
                        });
                      }}
                    >
                      <span className="flex min-w-0 gap-3">
                        <span className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/12 text-sm font-semibold text-blue-700 dark:text-blue-200">
                          {item.slot}
                        </span>
                        <span className="min-w-0">
                        <span className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge className="rounded-full border-blue-400/30 bg-blue-500/10 text-blue-700 dark:text-blue-200">
                            {item.reason.module_display}
                          </Badge>
                          {"mistake_category_display" in item.reason && item.reason.mistake_category_display ? (
                            <Badge variant="outline" className="rounded-full">{item.reason.mistake_category_display}</Badge>
                          ) : null}
                          <span className="text-xs text-muted-foreground">{t("advice.updated", {date: formatAdviceDate(item.updated_at)})}</span>
                        </span>
                        <span className="block text-base font-semibold leading-snug text-foreground">
                          <InlineBoldText text={item.reason.reason} />
                        </span>
                        {generalSolution ? (
                          <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">
                            <InlineBoldText text={generalSolution} />
                          </span>
                        ) : null}
                        </span>
                      </span>
                      <span className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/70">
                        <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                      </span>
                    </button>

                    {isOpen ? (
                      <div className="relative space-y-3 border-t border-border/70 px-4 pb-4 pt-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("advice.planLabel")}</p>
                        <div className="rounded-2xl border border-blue-400/20 bg-blue-500/8 p-3 text-sm leading-relaxed text-foreground/90">
                          {generalSolution ? <InlineBoldText text={generalSolution} /> : t("advice.noGeneralSolution")}
                        </div>
                        {isSafeDownloadUrl(resourceUrl) ? (
                          <Button size="sm" variant="outline" className="rounded-xl" asChild>
                            <a href={resourceUrl ?? "#"} target="_blank" rel="noopener noreferrer">
                              {item.reason.resource_type === "link" ? <ArrowUpRight className="size-4" /> : <Download className="size-4" />}
                              {item.reason.resource_type === "link"
                                ? t("advice.openResource")
                                : getResourceFileName(resourceUrl, t("advice.download"))}
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          ) : (
            <Card className={cardClassName}>
              <CardContent className="p-4 text-sm text-muted-foreground">{t("advice.empty")}</CardContent>
            </Card>
          )}
        </section>

        {/* Common Error Patterns is temporarily hidden. */}
        {/*
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{t("sections.commonErrorPatterns")}</h2>
          <div className="space-y-2">
            {STUDENT_COMMON_ERROR_PATTERNS.map((pattern) => {
              const Icon = patternIcons[pattern.icon];

              return (
                <div key={pattern.id} className="flex gap-3 rounded-2xl border border-border/70 bg-card/85 p-4">
                  <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/14 text-blue-700 dark:text-blue-300">
                      <Icon className="size-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold tracking-tight text-foreground">{t(`errorPatterns.items.${pattern.id}.title`)}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground dark:text-slate-300">{t(`errorPatterns.items.${pattern.id}.description`)}</p>
                    <p className="mt-2 text-sm leading-relaxed text-foreground/90 dark:text-slate-200">
                      <span className="font-semibold text-blue-600 dark:text-blue-300">{t("errorPatterns.learningTip")}: </span>
                      {t(`errorPatterns.items.${pattern.id}.tip`)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        */}

        {/* Recommended Next Steps is temporarily hidden. */}
        {/*
        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{t("sections.recommendedNextSteps")}</h2>
          <div className="space-y-2">
            {STUDENT_RECOMMENDED_FOCUS_AREAS.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/85 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">{t(`actions.items.${item.id}.title`)}</h3>
                    <Badge className="border border-blue-400/30 bg-blue-500/10 text-blue-700 dark:text-blue-200">{t(`modules.${item.module}`)}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground dark:text-slate-300">{t(`actions.items.${item.id}.description`)}</p>
                </div>
                <Button
                  className="h-10 shrink-0 rounded-xl bg-indigo-500 text-slate-50 hover:bg-indigo-400"
                  variant="default"
                  onClick={() => handleFocusAction(item)}
                >
                  {t(`actions.items.${item.id}.button`)}
                </Button>
              </div>
            ))}
          </div>
        </section>
        */}
      </section>
    </main>
  );
}
