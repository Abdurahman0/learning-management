"use client";

import {useEffect, useId, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {ArrowUpRight, Clock3, FileSearch2, Search, Sparkles, TriangleAlert} from "lucide-react";
import {Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";

import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {ChartContainer} from "@/components/ui/chart";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {
  STUDENT_REVIEW_CENTER_INSIGHTS,
  STUDENT_REVIEW_CENTER_MODULE_DISTRIBUTION,
  STUDENT_REVIEW_CENTER_NEXT_STEPS,
  STUDENT_REVIEW_CENTER_QUESTIONS,
  STUDENT_REVIEW_CENTER_QUESTION_TYPE_MISTAKES,
  STUDENT_REVIEW_CENTER_SUMMARY,
  STUDENT_REVIEW_REASON_OPTIONS,
  hasReviewReason
} from "@/data/student/review-center";
import type {StudentModuleKey, StudentReviewReason, StudentSavedQuestion, StudentStudyBankDifficulty} from "@/types/student";
import {cn} from "@/lib/utils";

type Notice = {
  title: string;
  description: string;
};

const cardClassName =
  "rounded-2xl border border-border/70 bg-card/95 shadow-none dark:border-slate-700/45 dark:bg-[linear-gradient(155deg,rgba(17,24,39,0.92),rgba(15,23,42,0.9))]";

const moduleBadgeTone = {
  reading: "border-indigo-400/35 bg-indigo-500/12 text-indigo-700 dark:text-indigo-200",
  listening: "border-blue-400/35 bg-blue-500/12 text-blue-700 dark:text-blue-200",
  writing: "border-violet-400/35 bg-violet-500/12 text-violet-700 dark:text-violet-200",
  speaking: "border-cyan-400/35 bg-cyan-500/12 text-cyan-700 dark:text-cyan-200"
} as const;

const difficultyTone: Record<StudentStudyBankDifficulty, string> = {
  easy: "border-emerald-400/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200",
  medium: "border-amber-400/35 bg-amber-500/12 text-amber-700 dark:text-amber-200",
  hard: "border-rose-400/35 bg-rose-500/12 text-rose-700 dark:text-rose-200"
};

const insightIcon = {
  keyword: FileSearch2,
  time: Clock3,
  instructions: TriangleAlert
} as const;

export function StudentReviewCenterClient() {
  const t = useTranslations("studentReviewCenter");
  const locale = useLocale();
  const router = useRouter();
  const gradientId = useId().replace(/:/g, "");

  const [reviewQuestions, setReviewQuestions] = useState<StudentSavedQuestion[]>(STUDENT_REVIEW_CENTER_QUESTIONS);
  const [selectedId, setSelectedId] = useState<string>(STUDENT_REVIEW_CENTER_QUESTIONS[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<"all" | StudentModuleKey>("all");
  const [reasonFilter, setReasonFilter] = useState<"all" | StudentReviewReason>("all");
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredQuestions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return reviewQuestions.filter((question) => {
      if (moduleFilter !== "all" && question.module !== moduleFilter) {
        return false;
      }

      if (!hasReviewReason(question, reasonFilter)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = `${question.sourceLabel} ${question.snippet} ${question.question} ${question.context}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [moduleFilter, reasonFilter, reviewQuestions, searchQuery]);

  const selectedQuestion = useMemo(() => {
    if (!filteredQuestions.length) {
      return null;
    }

    return filteredQuestions.find((question) => question.id === selectedId) ?? filteredQuestions[0];
  }, [filteredQuestions, selectedId]);

  const questionsToReview = reviewQuestions.length;

  const moduleOptions: {value: "all" | StudentModuleKey; label: string}[] = [
    {value: "all", label: t("filters.module.all")},
    {value: "reading", label: t("modules.reading")},
    {value: "listening", label: t("modules.listening")},
    {value: "writing", label: t("modules.writing")},
    {value: "speaking", label: t("modules.speaking")}
  ];

  const pushNotice = (title: string, description: string) => {
    setNotice({title, description});
  };

  const resolvePracticePath = (question: StudentSavedQuestion) => {
    if (question.linkedPracticePath === "/dashboard") {
      return `/${locale}/reading`;
    }

    return `/${locale}${question.linkedPracticePath}`;
  };

  const handlePracticeNow = () => {
    const target = STUDENT_REVIEW_CENTER_SUMMARY.weakestModule === "listening" ? "listening" : "reading";
    router.push(`/${locale}/${target}`);
  };

  const handlePracticeAgain = (question: StudentSavedQuestion) => {
    router.push(`${resolvePracticePath(question)}?source=review-center&item=${question.id}`);
  };

  const handleRemove = (questionId: string) => {
    setReviewQuestions((current) => current.filter((question) => question.id !== questionId));
    if (selectedId === questionId) {
      setSelectedId("");
    }
    pushNotice(t("feedback.removed.title"), t("feedback.removed.description"));
  };

  const handleOpenAnalytics = () => {
    router.push(`/${locale}/analytics?source=review-center`);
  };

  const handleNextStepAction = (action: "navigate" | "toast", href: string | undefined, noticeKey: string) => {
    if (action === "navigate" && href) {
      if (href === "/dashboard") {
        router.push(`/${locale}/dashboard#weak-areas`);
        return;
      }

      router.push(`/${locale}${href}`);
      return;
    }

    pushNotice(t(`feedback.${noticeKey}.title`), t(`feedback.${noticeKey}.description`));
  };

  const maxMistakes = Math.max(1, ...STUDENT_REVIEW_CENTER_QUESTION_TYPE_MISTAKES.map((item) => item.mistakes));

  return (
    <main className="mx-auto min-w-0 w-full max-w-445 overflow-x-hidden px-2 py-5 sm:px-4 sm:py-6 lg:px-6">
      <section className="space-y-5 sm:space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t("title")}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]">{t("subtitle")}</p>
          </div>
          <Button type="button" className="h-10 rounded-xl bg-indigo-500 text-slate-50 hover:bg-indigo-400" onClick={handlePracticeNow}>
            {t("actions.practiceNow")}
          </Button>
        </header>

        {notice ? (
          <Card className="rounded-xl border border-blue-400/35 bg-blue-500/10 shadow-none">
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
              <p className="text-sm text-muted-foreground">{t("summary.questionsToReview")}</p>
              <p className="mt-2 text-4xl font-semibold tracking-tight text-foreground">{questionsToReview}</p>
            </CardContent>
          </Card>

          <Card className={cn(cardClassName, "relative overflow-hidden")}>
            <span className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full bg-indigo-500/16 blur-2xl" />
            <CardContent className="relative p-5">
              <p className="text-sm text-muted-foreground">{t("summary.mostDifficultType")}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{t(`questionTypes.${STUDENT_REVIEW_CENTER_SUMMARY.mostDifficultType}`)}</p>
            </CardContent>
          </Card>

          <Card className={cn(cardClassName, "relative overflow-hidden border-rose-400/35")}>
            <span className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full bg-rose-500/16 blur-2xl" />
            <CardContent className="relative p-5">
              <p className="text-sm text-muted-foreground">{t("summary.weakestModule")}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-rose-600 dark:text-rose-300">{t(`modules.${STUDENT_REVIEW_CENTER_SUMMARY.weakestModule}`)}</p>
            </CardContent>
          </Card>

          <Card className={cn(cardClassName, "relative overflow-hidden")}>
            <span className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full bg-emerald-500/16 blur-2xl" />
            <CardContent className="relative p-5">
              <p className="text-sm text-muted-foreground">{t("summary.accuracyTrend")}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-300">
                +{STUDENT_REVIEW_CENTER_SUMMARY.accuracyTrend}% <ArrowUpRight className="size-4.5" />
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.95fr)]">
          <Card className={cardClassName}>
            <CardHeader>
              <CardTitle>{t("insights.mistakesByType")}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ChartContainer className="h-75 w-full rounded-xl border border-border/70 bg-background/80 p-2 sm:p-3 dark:border-slate-700/45 dark:bg-slate-950/35">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={STUDENT_REVIEW_CENTER_QUESTION_TYPE_MISTAKES} margin={{top: 8, right: 8, left: -16, bottom: 0}} barCategoryGap={14}>
                    <defs>
                      <linearGradient id={`review-mistake-bar-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#4f46e5" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" />
                    <XAxis
                      dataKey="type"
                      interval={0}
                      tickFormatter={(value) => t(`questionTypesShort.${value}`)}
                      tickLine={false}
                      axisLine={false}
                      height={46}
                      tick={{fontSize: 11, fill: "#94a3b8"}}
                    />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{fontSize: 11, fill: "#94a3b8"}} />
                    <Tooltip
                      cursor={false}
                      content={({active, payload}) => {
                        if (!active || !payload?.length) {
                          return null;
                        }

                        const point = payload[0]?.payload as {type: string; mistakes: number};
                        return (
                          <div className="rounded-xl border border-border/70 bg-popover/95 px-3 py-2 text-xs dark:border-slate-600/70 dark:bg-slate-900/95">
                            <p className="font-semibold text-foreground dark:text-slate-100">{t(`questionTypes.${point.type}`)}</p>
                            <p className="mt-1 text-muted-foreground dark:text-slate-300">{t("insights.mistakeCount", {value: point.mistakes})}</p>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="mistakes" fill={`url(#review-mistake-bar-${gradientId})`} radius={[7, 7, 0, 0]}>
                      {STUDENT_REVIEW_CENTER_QUESTION_TYPE_MISTAKES.map((item) => (
                        <Cell key={item.id} fillOpacity={0.5 + item.mistakes / maxMistakes / 2} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className={cardClassName}>
            <CardHeader>
              <CardTitle>{t("insights.mistakesByModule")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <ChartContainer className="relative h-55">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={STUDENT_REVIEW_CENTER_MODULE_DISTRIBUTION} dataKey="share" nameKey="module" innerRadius={54} outerRadius={86} paddingAngle={2}>
                      {STUDENT_REVIEW_CENTER_MODULE_DISTRIBUTION.map((entry) => (
                        <Cell key={entry.id} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({active, payload}) => {
                        if (!active || !payload?.length) {
                          return null;
                        }

                        const point = payload[0]?.payload as {module: StudentModuleKey; share: number};
                        return (
                          <div className="rounded-xl border border-border/70 bg-popover/95 px-3 py-2 text-xs dark:border-slate-600/70 dark:bg-slate-900/95">
                            <p className="font-semibold text-foreground dark:text-slate-100">{t(`modules.${point.module}`)}</p>
                            <p className="mt-1 text-muted-foreground dark:text-slate-300">{t("insights.moduleShare", {value: point.share})}</p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>

              <div className="space-y-2">
                {STUDENT_REVIEW_CENTER_INSIGHTS.map((item) => {
                  const Icon = insightIcon[item.icon];
                  return (
                    <div key={item.id} className="rounded-lg border border-border/70 bg-background/70 px-3 py-2 dark:border-slate-700/50 dark:bg-slate-900/35">
                      <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground dark:text-slate-100">
                        <Icon className="size-4 text-indigo-500 dark:text-indigo-300" />
                        {t(`patterns.${item.id}.title`)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground dark:text-slate-300">{t(`patterns.${item.id}.description`)}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className={cn(cardClassName, "p-4 sm:p-5")}>
          <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(280px,1.45fr)_220px_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("filters.searchPlaceholder")}
                className="h-10 rounded-xl border-border/70 bg-background/70 pl-9 dark:border-slate-600/70 dark:bg-slate-900/45"
              />
            </div>
            <Select value={moduleFilter} onValueChange={(value) => setModuleFilter(value as "all" | StudentModuleKey)}>
              <SelectTrigger className="h-10 rounded-xl border-border/70 bg-background/70 dark:border-slate-600/70 dark:bg-slate-900/45">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {moduleOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={reasonFilter} onValueChange={(value) => setReasonFilter(value as "all" | StudentReviewReason)}>
              <SelectTrigger className="h-10 rounded-xl border-border/70 bg-background/70 dark:border-slate-600/70 dark:bg-slate-900/45">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STUDENT_REVIEW_REASON_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,1fr)]">
          <Card className={cn(cardClassName, "min-w-0")}>
            <CardHeader>
              <CardTitle>{t("reviewList.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredQuestions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                  {t("reviewList.empty")}
                </div>
              ) : null}

              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className={cn(
                    "rounded-xl border p-4 transition-colors",
                    selectedQuestion?.id === question.id
                      ? "border-indigo-400/55 bg-indigo-500/12"
                      : "border-border/70 bg-background/60 hover:border-primary/35"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground">{t(`modules.${question.module}`)} - {t(`questionTypes.${question.questionType}`)}</p>
                      <p className="text-xs text-muted-foreground">{question.sourceLabel}</p>
                    </div>
                    <Badge className={cn("border", difficultyTone[question.difficulty])}>{t(`difficulty.${question.difficulty}`)}</Badge>
                  </div>

                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{question.snippet}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {question.reviewReasons.map((reason) => (
                      <Badge key={`${question.id}-${reason}`} variant="secondary" className="border border-border/70 bg-background/80 text-xs">
                        {t(`reasons.${reason}`)}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">{t(`savedAgo.${question.savedAgoKey}`)}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" className="h-8 px-2 text-xs" onClick={() => setSelectedId(question.id)}>
                        {t("reviewList.actions.review")}
                      </Button>
                      <Button variant="ghost" className="h-8 px-2 text-xs text-indigo-600 dark:text-indigo-300" onClick={() => handlePracticeAgain(question)}>
                        {t("reviewList.actions.practiceAgain")}
                      </Button>
                      <Button variant="ghost" className="h-8 px-2 text-xs text-rose-600 dark:text-rose-300" onClick={() => handleRemove(question.id)}>
                        {t("reviewList.actions.remove")}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className={cn(cardClassName, "min-w-0")}>
            <CardHeader>
              <CardTitle>{t("preview.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedQuestion ? (
                <>
                  <div>
                    <p className="text-xs font-semibold tracking-[0.08em] text-indigo-600 uppercase dark:text-indigo-300">{t("preview.question")}</p>
                    <p className="mt-1 text-base font-semibold text-foreground">{selectedQuestion.question}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{selectedQuestion.context}</p>
                  </div>

                  {selectedQuestion.options?.length ? (
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold tracking-[0.08em] text-indigo-600 uppercase dark:text-indigo-300">{t("preview.options")}</p>
                      {selectedQuestion.options.map((option) => (
                        <p key={option} className="rounded-lg border border-border/70 bg-background/70 px-3 py-1.5 text-sm text-foreground/90">
                          {option}
                        </p>
                      ))}
                    </div>
                  ) : null}

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-3">
                      <p className="text-xs font-semibold tracking-[0.08em] text-emerald-700 uppercase dark:text-emerald-300">{t("preview.correctAnswer")}</p>
                      <p className="mt-1 font-semibold text-emerald-700 dark:text-emerald-100">{selectedQuestion.correctAnswer}</p>
                    </div>
                    <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 p-3">
                      <p className="text-xs font-semibold tracking-[0.08em] text-rose-700 uppercase dark:text-rose-300">{t("preview.previousAnswer")}</p>
                      <p className="mt-1 font-semibold text-rose-700 dark:text-rose-100">{selectedQuestion.previousAnswer}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold tracking-[0.08em] text-indigo-600 uppercase dark:text-indigo-300">{t("preview.explanation")}</p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/90">{selectedQuestion.explanation}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold tracking-[0.08em] text-indigo-600 uppercase dark:text-indigo-300">{t("preview.whyHere")}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {selectedQuestion.reviewReasons.map((reason) => (
                        <Badge key={`preview-${reason}`} className="border border-border/70 bg-background/70 text-xs text-foreground/90">
                          {t(`reasons.${reason}`)}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 border-t border-border/70 pt-3">
                    <Button className="h-9 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400" onClick={() => handlePracticeAgain(selectedQuestion)}>
                      {t("preview.actions.practiceAgain")}
                    </Button>
                    <Button variant="outline" className="h-9 rounded-xl border-border/70 bg-background/70" onClick={() => handleRemove(selectedQuestion.id)}>
                      {t("preview.actions.remove")}
                    </Button>
                    <Button variant="ghost" className="h-9 rounded-xl" onClick={handleOpenAnalytics}>
                      {t("preview.actions.openAnalytics")}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 bg-background/60 p-4 text-sm text-muted-foreground">
                  {t("preview.empty")}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card className={cardClassName}>
            <CardHeader>
              <CardTitle>{t("nextSteps.title")}</CardTitle>
            </CardHeader>
            <CardContent className="grid min-w-0 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {STUDENT_REVIEW_CENTER_NEXT_STEPS.map((step) => (
                <div key={step.id} className="rounded-xl border border-border/70 bg-background/65 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{t(`nextSteps.items.${step.id}.title`)}</p>
                    <Badge className={cn("border", moduleBadgeTone[step.module])}>{t(`modules.${step.module}`)}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{t(`nextSteps.items.${step.id}.description`)}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      className="h-8 rounded-lg bg-indigo-500 px-3 text-xs text-white hover:bg-indigo-400"
                      onClick={() => handleNextStepAction(step.action, step.href, step.id)}
                    >
                      {t(`nextSteps.items.${step.id}.primaryAction`)}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 rounded-lg border-border/70 bg-background/70 px-3 text-xs"
                      onClick={() => pushNotice(t("feedback.strategy.title"), t("feedback.strategy.description"))}
                    >
                      {t("nextSteps.secondaryAction")}
                    </Button>
                  </div>
                </div>
              ))}

              <div className="rounded-xl border border-border/70 bg-background/65 p-4">
                <p className="inline-flex items-center gap-2 font-semibold text-foreground">
                  <Sparkles className="size-4 text-indigo-600 dark:text-indigo-300" />
                  {t("nextSteps.aiCoach.title")}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">{t("nextSteps.aiCoach.description")}</p>
                <Button className="mt-3 h-8 rounded-lg bg-indigo-500 px-3 text-xs text-white hover:bg-indigo-400" onClick={() => router.push(`/${locale}/ai-coach`)}>
                  {t("nextSteps.aiCoach.action")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </section>
    </main>
  );
}
