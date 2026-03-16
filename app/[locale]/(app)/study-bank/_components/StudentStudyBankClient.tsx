"use client";

import {useEffect, useMemo, useState} from "react";
import {useLocale, useTranslations} from "next-intl";
import {useRouter} from "next/navigation";
import {
  BookMarked,
  BookOpen,
  Download,
  Headphones,
  Mic,
  PenSquare,
  Search,
  Sparkles,
  Trash2
} from "lucide-react";

import {
  STUDENT_SAVED_QUESTIONS,
  STUDY_BANK_DIFFICULTY_OPTIONS,
  STUDY_BANK_MODULE_OPTIONS,
  STUDY_BANK_QUESTION_TYPE_OPTIONS,
  STUDY_BANK_SORT_OPTIONS
} from "@/data/student/study-bank";
import type {
  StudentModuleKey,
  StudentSavedQuestion,
  StudentStudyBankDifficulty,
  StudentStudyBankQuestionTypeKey,
  StudentStudyBankSortKey
} from "@/types/student";
import {Badge} from "@/components/ui/badge";
import {Button} from "@/components/ui/button";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {cn} from "@/lib/utils";

type Notice = {
  title: string;
  description: string;
};

const cardClassName =
  "rounded-2xl border border-border/70 bg-card/95 dark:border-slate-700/45 dark:bg-[linear-gradient(155deg,rgba(17,24,39,0.92),rgba(15,23,42,0.9))] shadow-none";

const moduleIconMap: Record<StudentModuleKey, typeof BookOpen> = {
  reading: BookOpen,
  listening: Headphones,
  writing: PenSquare,
  speaking: Mic
};

const difficultyTone = {
  easy: "border-emerald-400/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200",
  medium: "border-amber-400/30 bg-amber-500/12 text-amber-700 dark:text-amber-200",
  hard: "border-rose-400/30 bg-rose-500/12 text-rose-700 dark:text-rose-200"
} as const;

const moduleBadgeTone = {
  reading: "border-indigo-400/35 bg-indigo-500/14 text-indigo-700 dark:text-indigo-200",
  listening: "border-blue-400/35 bg-blue-500/14 text-blue-700 dark:text-blue-200",
  writing: "border-violet-400/35 bg-violet-500/14 text-violet-700 dark:text-violet-200",
  speaking: "border-cyan-400/35 bg-cyan-500/14 text-cyan-700 dark:text-cyan-200"
} as const;

const difficultyRank: Record<StudentStudyBankDifficulty, number> = {
  easy: 1,
  medium: 2,
  hard: 3
};

export function StudentStudyBankClient() {
  const t = useTranslations("studentStudyBank");
  const locale = useLocale();
  const router = useRouter();

  const [savedQuestions, setSavedQuestions] = useState<StudentSavedQuestion[]>(STUDENT_SAVED_QUESTIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<"all" | StudentModuleKey>("all");
  const [questionTypeFilter, setQuestionTypeFilter] = useState<"all" | StudentStudyBankQuestionTypeKey>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | StudentStudyBankDifficulty>("all");
  const [sortBy, setSortBy] = useState<StudentStudyBankSortKey>("newest");
  const [selectedId, setSelectedId] = useState<string>(STUDENT_SAVED_QUESTIONS[0]?.id ?? "");
  const [notice, setNotice] = useState<Notice | null>(null);

  const coveredModules = useMemo(() => {
    return Array.from(new Set(savedQuestions.map((item) => item.module)));
  }, [savedQuestions]);

  const visibleQuestions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    const filtered = savedQuestions.filter((item) => {
      if (moduleFilter !== "all" && item.module !== moduleFilter) {
        return false;
      }

      if (questionTypeFilter !== "all" && item.questionType !== questionTypeFilter) {
        return false;
      }

      if (difficultyFilter !== "all" && item.difficulty !== difficultyFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = `${item.sourceLabel} ${item.snippet} ${item.question} ${item.context}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });

    const sorted = [...filtered];
    sorted.sort((left, right) => {
      if (sortBy === "newest") {
        return new Date(right.savedAt).getTime() - new Date(left.savedAt).getTime();
      }

      if (sortBy === "oldest") {
        return new Date(left.savedAt).getTime() - new Date(right.savedAt).getTime();
      }

      if (sortBy === "difficulty") {
        return difficultyRank[right.difficulty] - difficultyRank[left.difficulty];
      }

      return left.module.localeCompare(right.module);
    });

    return sorted;
  }, [difficultyFilter, moduleFilter, questionTypeFilter, savedQuestions, searchQuery, sortBy]);

  const selectedQuestion = useMemo(() => {
    if (!visibleQuestions.length) {
      return null;
    }

    return visibleQuestions.find((item) => item.id === selectedId) ?? visibleQuestions[0];
  }, [selectedId, visibleQuestions]);

  const weakAreaCount = useMemo(() => savedQuestions.filter((item) => item.isWeakArea).length, [savedQuestions]);
  const newCount = useMemo(() => savedQuestions.filter((item) => item.isNew).length, [savedQuestions]);

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const resetFilters = () => {
    setSearchQuery("");
    setModuleFilter("all");
    setQuestionTypeFilter("all");
    setDifficultyFilter("all");
    setSortBy("newest");
  };

  const handleDownload = () => {
    setNotice({
      title: t("feedback.download.title"),
      description: t("feedback.download.description")
    });
  };

  const handlePractice = (item: StudentSavedQuestion) => {
    router.push(`/${locale}${item.linkedPracticePath}?source=study-bank&item=${item.id}`);
  };

  const handleRemove = (itemId: string) => {
    setSavedQuestions((current) => current.filter((item) => item.id !== itemId));
    if (selectedId === itemId) {
      setSelectedId("");
    }
    setNotice({
      title: t("feedback.remove.title"),
      description: t("feedback.remove.description")
    });
  };

  const modulesPrimary = coveredModules.length
    ? coveredModules.map((module) => t(`modules.${module}`)).join(", ")
    : t("summary.modulesCovered.empty");
  const speakingCovered = coveredModules.includes("speaking");

  return (
    <main className="mx-auto min-w-0 w-full max-w-445 overflow-x-hidden px-2 py-5 sm:px-4 sm:py-6 lg:px-6">
      <section className="space-y-5 sm:space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground dark:text-slate-100 sm:text-3xl">{t("title")}</h1>
              <BookMarked className="size-5 text-indigo-600 dark:text-indigo-300" />
            </div>
            <p className="mt-2 text-sm text-muted-foreground dark:text-slate-300 sm:text-[15px]">{t("subtitle")}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 rounded-xl border-border/70 dark:border-slate-600/70 bg-background/70 dark:bg-slate-900/45 text-foreground dark:text-slate-100 hover:bg-muted dark:hover:bg-slate-800/70"
            onClick={handleDownload}
          >
            <Download className="size-4" />
            {t("actions.downloadBank")}
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

        <section className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card className={cn(cardClassName, "relative overflow-hidden")}>
            <span className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full bg-indigo-500/16 blur-2xl" />
            <CardContent className="relative p-5">
              <p className="text-sm text-muted-foreground dark:text-slate-300">{t("summary.savedQuestions.label")}</p>
              <p className="mt-2 flex items-end gap-3 text-4xl leading-none font-semibold tracking-tight text-foreground dark:text-slate-100 sm:text-5xl">
                {savedQuestions.length}
                <span className="mb-1 text-xl font-medium text-emerald-600 dark:text-emerald-300">+{newCount}</span>
              </p>
              <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-300">{t("summary.savedQuestions.support")}</p>
            </CardContent>
          </Card>

          <Card className={cn(cardClassName, "relative overflow-hidden")}>
            <span className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full bg-blue-500/16 blur-2xl" />
            <CardContent className="relative p-5">
              <p className="text-sm text-muted-foreground dark:text-slate-300">{t("summary.modulesCovered.label")}</p>
              <p className="mt-2 text-2xl leading-snug font-semibold tracking-tight text-foreground dark:text-slate-100 sm:text-[28px]">{modulesPrimary}</p>
              <p className="mt-2 text-sm text-indigo-600 dark:text-indigo-300">
                {speakingCovered ? t("summary.modulesCovered.allCovered") : t("summary.modulesCovered.speakingPending")}
              </p>
            </CardContent>
          </Card>

          <Card className={cn(cardClassName, "relative overflow-hidden")}>
            <span className="pointer-events-none absolute -top-10 right-0 h-24 w-24 rounded-full bg-rose-500/16 blur-2xl" />
            <CardContent className="relative p-5">
              <p className="text-sm text-muted-foreground dark:text-slate-300">{t("summary.weakAreaQuestions.label")}</p>
              <p className="mt-2 flex items-end gap-3 text-4xl leading-none font-semibold tracking-tight text-rose-600 dark:text-rose-300 sm:text-5xl">
                {weakAreaCount}
                <span className="mb-1 text-xl font-medium text-muted-foreground dark:text-slate-300">{t("summary.weakAreaQuestions.support")}</span>
              </p>
            </CardContent>
          </Card>
        </section>

        <section className={cn(cardClassName, "p-4 sm:p-5")}>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(280px,1.55fr)_repeat(4,minmax(0,0.7fr))]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground dark:text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("filters.searchPlaceholder")}
                className="h-10 rounded-xl border-border/70 dark:border-slate-600/70 bg-background/70 dark:bg-slate-900/45 pr-3 pl-9 text-foreground dark:text-slate-100 placeholder:text-muted-foreground dark:placeholder:text-slate-400"
              />
            </div>

            <Select value={moduleFilter} onValueChange={(value) => setModuleFilter(value as "all" | StudentModuleKey)}>
              <SelectTrigger className="h-10 rounded-xl border-border/70 dark:border-slate-600/70 bg-background/70 dark:bg-slate-900/45 text-foreground dark:text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STUDY_BANK_MODULE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={questionTypeFilter} onValueChange={(value) => setQuestionTypeFilter(value as "all" | StudentStudyBankQuestionTypeKey)}>
              <SelectTrigger className="h-10 rounded-xl border-border/70 dark:border-slate-600/70 bg-background/70 dark:bg-slate-900/45 text-foreground dark:text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STUDY_BANK_QUESTION_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={difficultyFilter} onValueChange={(value) => setDifficultyFilter(value as "all" | StudentStudyBankDifficulty)}>
              <SelectTrigger className="h-10 rounded-xl border-border/70 dark:border-slate-600/70 bg-background/70 dark:bg-slate-900/45 text-foreground dark:text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STUDY_BANK_DIFFICULTY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value) => setSortBy(value as StudentStudyBankSortKey)}>
              <SelectTrigger className="h-10 rounded-xl border-border/70 dark:border-slate-600/70 bg-background/70 dark:bg-slate-900/45 text-foreground dark:text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STUDY_BANK_SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {t(option.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="grid min-w-0 items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(350px,1fr)]">
          <section className="space-y-4">
            {savedQuestions.length === 0 ? (
              <Card className={cn(cardClassName, "p-6")}>
                <h3 className="text-lg font-semibold text-foreground dark:text-slate-100">{t("empty.all.title")}</h3>
                <p className="mt-2 text-sm text-muted-foreground dark:text-slate-300">{t("empty.all.description")}</p>
                <div className="mt-4">
                  <Button className="rounded-xl bg-indigo-500 text-white hover:bg-indigo-400" onClick={() => router.push(`/${locale}/reading`)}>
                    {t("actions.goToPractice")}
                  </Button>
                </div>
              </Card>
            ) : null}

            {savedQuestions.length > 0 && visibleQuestions.length === 0 ? (
              <Card className={cn(cardClassName, "p-6")}>
                <h3 className="text-lg font-semibold text-foreground dark:text-slate-100">{t("empty.filtered.title")}</h3>
                <p className="mt-2 text-sm text-muted-foreground dark:text-slate-300">{t("empty.filtered.description")}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="outline" className="rounded-xl border-border/70 dark:border-slate-600/70 bg-background/70 dark:bg-slate-900/45 text-foreground dark:text-slate-100" onClick={resetFilters}>
                    {t("actions.resetFilters")}
                  </Button>
                  <Button className="rounded-xl bg-indigo-500 text-white hover:bg-indigo-400" onClick={() => router.push(`/${locale}/reading`)}>
                    {t("actions.goToPractice")}
                  </Button>
                </div>
              </Card>
            ) : null}

            {visibleQuestions.map((item) => {
              const ModuleIcon = moduleIconMap[item.module];
              const isSelected = selectedQuestion?.id === item.id;

              return (
                <Card
                  key={item.id}
                  className={cn(
                    cardClassName,
                    "cursor-pointer p-5 transition-colors",
                    isSelected
                      ? "border-indigo-400/60 bg-indigo-500/8 dark:bg-indigo-500/12"
                      : "border-border/70 dark:border-slate-600/70 hover:border-primary/35"
                  )}
                  onClick={() => setSelectedId(item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedId(item.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex items-start gap-3">
                      <span className={cn("mt-0.5 inline-flex size-9 items-center justify-center rounded-lg border", moduleBadgeTone[item.module])}>
                        <ModuleIcon className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold tracking-tight text-foreground dark:text-slate-100 sm:text-xl">
                          {t(`modules.${item.module}`)} - {t(`questionTypes.${item.questionType}`)}
                        </h3>
                        <p className="truncate text-sm text-muted-foreground dark:text-slate-300">{item.sourceLabel}</p>
                      </div>
                    </div>
                    <Badge className={cn("border font-semibold uppercase", difficultyTone[item.difficulty])}>{t(`difficulty.${item.difficulty}`)}</Badge>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-muted-foreground dark:text-slate-300">{item.snippet}</p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground dark:text-slate-400">{t(`savedAgo.${item.savedAgoKey}`)}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 px-2 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-500/12 hover:text-indigo-500 dark:hover:text-indigo-200"
                        onClick={(event) => {
                          event.stopPropagation();
                          handlePractice(item);
                        }}
                      >
                        {t("actions.practiceAgain")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-8 px-2 text-muted-foreground dark:text-slate-300 hover:bg-rose-500/12 hover:text-rose-700 dark:hover:text-rose-200"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemove(item.id);
                        }}
                      >
                        {t("actions.remove")}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </section>

          <aside className="xl:sticky xl:top-6">
            <Card className={cn(cardClassName, "p-5 sm:p-6")}>
              <CardHeader className="px-0">
                <CardTitle className="text-2xl font-semibold tracking-tight text-foreground dark:text-slate-100 sm:text-3xl">{t("preview.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 px-0 pt-0">
                {selectedQuestion ? (
                  <>
                    <section>
                      <p className="mb-2 text-xs font-semibold tracking-[0.08em] text-indigo-600 dark:text-indigo-300 uppercase">{t("preview.contextTitle")}</p>
                      <blockquote className="rounded-lg border-l-2 border-indigo-400/60 pl-3 text-base leading-7 text-foreground/90 dark:text-slate-200 italic sm:text-lg">
                        {selectedQuestion.context}
                      </blockquote>
                    </section>

                    <section>
                      <p className="mb-2 text-xs font-semibold tracking-[0.08em] text-indigo-600 dark:text-indigo-300 uppercase">{t("preview.questionTitle")}</p>
                      <p className="text-lg leading-snug font-semibold text-foreground dark:text-slate-100 sm:text-2xl">{selectedQuestion.question}</p>
                    </section>

                    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/10 p-4">
                        <p className="text-xs font-semibold tracking-[0.08em] text-emerald-700 dark:text-emerald-300 uppercase">{t("preview.correctAnswer")}</p>
                        <p className="mt-2 text-lg font-semibold tracking-tight text-emerald-700 dark:text-emerald-100 sm:text-2xl">{selectedQuestion.correctAnswer}</p>
                      </div>
                      <div className="rounded-xl border border-rose-400/35 bg-rose-500/10 p-4">
                        <p className="text-xs font-semibold tracking-[0.08em] text-rose-700 dark:text-rose-300 uppercase">{t("preview.lastAttempt")}</p>
                        <p className="mt-2 text-lg font-semibold tracking-tight text-rose-700 dark:text-rose-100 sm:text-2xl">{selectedQuestion.previousAnswer}</p>
                      </div>
                    </section>

                    <section>
                      <p className="mb-2 text-xs font-semibold tracking-[0.08em] text-indigo-600 dark:text-indigo-300 uppercase">{t("preview.explanationTitle")}</p>
                      <p className="text-base leading-8 text-foreground/90 dark:text-slate-200">{selectedQuestion.explanation}</p>
                    </section>

                    <div className="flex flex-wrap items-center gap-3 border-t border-border/70 dark:border-slate-700/50 pt-4">
                      <Button className="h-10 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400" onClick={() => handlePractice(selectedQuestion)}>
                        {t("actions.practiceAgain")}
                      </Button>
                      <Button
                        variant="outline"
                        className="h-10 rounded-xl border-border/70 dark:border-slate-600/70 bg-background/70 dark:bg-slate-900/45 text-foreground dark:text-slate-100"
                        onClick={() => handleRemove(selectedQuestion.id)}
                      >
                        <Trash2 className="size-4" />
                        {t("actions.removeFromBank")}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl border border-border/70 dark:border-slate-700/60 bg-background/70 dark:bg-slate-900/35 p-5">
                    <p className="text-sm text-muted-foreground dark:text-slate-300">{t("preview.empty")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className={cn(cardClassName, "mt-4 p-5")}>
              <CardContent className="p-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-7 items-center justify-center rounded-full border border-indigo-400/35 bg-indigo-500/12 text-indigo-600 dark:text-indigo-300">
                    <Sparkles className="size-3.5" />
                  </span>
                  <p className="text-lg font-semibold text-foreground dark:text-slate-100">{t("suggestedReview.title")}</p>
                </div>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90 dark:text-slate-200">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-indigo-500" />
                    <span>{t("suggestedReview.items.weakType", {type: t(`questionTypes.${selectedQuestion?.questionType ?? "matchingHeadings"}`)})}</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90 dark:text-slate-200">
                    <span className="mt-2 size-1.5 shrink-0 rounded-full bg-indigo-500" />
                    <span>{t("suggestedReview.items.band7")}</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </aside>
        </section>
      </section>
    </main>
  );
}

