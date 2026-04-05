"use client";

import {useEffect, useId, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {ArrowUpRight, BookCheck, Clock3, FileSearch2, Target, TrendingUp, TriangleAlert} from "lucide-react";
import {Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";

import {
  STUDENT_COMMON_ERROR_PATTERNS,
  STUDENT_MISTAKE_RANGE_OPTIONS,
  STUDENT_RECOMMENDED_FOCUS_AREAS,
  type StudentFocusAreaAction,
  type StudentMistakeRangeKey
} from "@/data/student-mistake-analysis";
import {getQuestionTypeDisplayLabel, getQuestionTypeShortCode} from "@/src/services/student/questionTypeLabels";
import {studentReviewCenterService} from "@/src/services/student/reviewCenter.service";
import type {StudentReviewCenterResponse} from "@/src/services/student/types";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ChartContainer} from "@/components/ui/chart";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {cn} from "@/lib/utils";

type ActionNotice = {
  title: string;
  description: string;
};

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

const patternIcons = {
  keyword: FileSearch2,
  time: Clock3,
  instructions: TriangleAlert
} as const;

const MODULE_COLORS: Record<SupportedModule, string> = {
  reading: "#6366f1",
  listening: "#3b82f6"
};

const RANGE_DAYS: Record<StudentMistakeRangeKey, number> = {
  last7Days: 7,
  last30Days: 30,
  last3Months: 90
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

export function StudentMistakeAnalysisPageClient() {
  const t = useTranslations("studentMistakes");
  const locale = useLocale();
  const router = useRouter();
  const gradientId = useId().replace(/:/g, "");

  const [selectedRange, setSelectedRange] = useState<StudentMistakeRangeKey>("last30Days");
  const [notice, setNotice] = useState<ActionNotice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewData, setReviewData] = useState<StudentReviewCenterResponse>(EMPTY_REVIEW_CENTER);

  useEffect(() => {
    let active = true;

    const loadMistakeData = async () => {
      setIsLoading(true);
      try {
        const response = await studentReviewCenterService.list();
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
  }, []);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 2500);
    return () => window.clearTimeout(timer);
  }, [notice]);

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

  const handleFocusAction = (action: StudentFocusAreaAction) => {
    if (action.action === "navigate" && action.href) {
      if (action.href === "/dashboard") {
        router.push(`/${locale}/dashboard#weak-areas`);
        return;
      }

      router.push(`/${locale}${action.href}`);
      return;
    }

    setNotice({
      title: t(`actions.feedback.${action.id}.title`),
      description: t(`actions.feedback.${action.id}.description`)
    });
  };

  return (
    <main className="mx-auto min-w-0 w-full max-w-445 overflow-x-hidden px-2 py-5 sm:px-4 sm:py-6 lg:px-6">
      <section className="space-y-5 sm:space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t("title")}</h1>
          <p className="max-w-3xl text-sm text-muted-foreground sm:text-[15px]">{t("subtitle")}</p>
        </header>

        {isLoading ? (
          <Card className={cardClassName}>
            <CardContent className="p-4 text-sm text-muted-foreground">{t("subtitle")}</CardContent>
          </Card>
        ) : null}

        {notice ? (
          <Card className="rounded-xl border-blue-400/35 bg-blue-500/10 shadow-none">
            <CardContent className="flex items-start gap-3 p-3 text-sm">
              <span className="mt-0.5 inline-flex size-6 items-center justify-center rounded-md bg-blue-500/20 text-blue-700 dark:text-blue-200">
                <BookCheck className="size-3.5" />
              </span>
              <div>
                <p className="font-semibold text-blue-700 dark:text-blue-100">{notice.title}</p>
                <p className="text-blue-700/90 dark:text-blue-100/85">{notice.description}</p>
              </div>
            </CardContent>
          </Card>
        ) : null}

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
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{t("sections.commonErrorPatterns")}</h2>
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {STUDENT_COMMON_ERROR_PATTERNS.map((pattern) => {
              const Icon = patternIcons[pattern.icon];

              return (
                <Card key={pattern.id} className={cn(cardClassName, "relative h-full overflow-hidden")}>
                  <span className="pointer-events-none absolute -right-8 -bottom-8 h-24 w-24 rounded-full bg-blue-500/10 blur-2xl" />
                  <CardContent className="relative flex h-full flex-col p-5">
                    <div className="mb-4 inline-flex size-10 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/14 text-blue-700 dark:text-blue-300">
                      <Icon className="size-4.5" />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">{t(`errorPatterns.items.${pattern.id}.title`)}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground dark:text-slate-300">{t(`errorPatterns.items.${pattern.id}.description`)}</p>
                    <div className="mt-4 rounded-xl border border-border/70 bg-background/70 p-3 dark:border-slate-700/55 dark:bg-slate-900/40">
                      <p className="text-xs font-semibold tracking-[0.08em] text-blue-600 dark:text-blue-300 uppercase">{t("errorPatterns.learningTip")}</p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/90 dark:text-slate-200">{t(`errorPatterns.items.${pattern.id}.tip`)}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">{t("sections.recommendedNextSteps")}</h2>
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {STUDENT_RECOMMENDED_FOCUS_AREAS.map((item) => (
              <Card key={item.id} className={cn(cardClassName, "h-full")}>
                <CardContent className="flex h-full flex-col p-5">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-foreground">{t(`actions.items.${item.id}.title`)}</h3>
                    <Badge className="border border-blue-400/30 bg-blue-500/10 text-blue-700 dark:text-blue-200">{t(`modules.${item.module}`)}</Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground dark:text-slate-300">{t(`actions.items.${item.id}.description`)}</p>
                  <Button
                    className="mt-5 h-10 rounded-xl bg-indigo-500 text-slate-50 hover:bg-indigo-400"
                    variant="default"
                    onClick={() => handleFocusAction(item)}
                  >
                    {t(`actions.items.${item.id}.button`)}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
