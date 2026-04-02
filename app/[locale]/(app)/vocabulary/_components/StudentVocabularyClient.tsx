"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  BookMarked,
  Brain,
  Check,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import {
  buildPracticeQuestions,
  buildVocabularyPracticeDeck,
  getDueTodayWords,
  getLearningWords,
  getMasteredWords,
  getSavedWords,
  getStudentVocabularySuggestions,
  getStudentVocabularyWords,
  getVocabularySummary,
} from "@/data/student/vocabulary";
import type { VocabularyPracticeQuestion, VocabularySuggestion, VocabularyWord } from "@/types/vocabulary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SiteToast } from "@/components/ui/site-toast";
import { cn } from "@/lib/utils";

type AddWordFormState = {
  word: string;
  meaning: string;
  example: string;
  note: string;
};

type NoticeState = {
  title: string;
  description: string;
};

const DEFAULT_ADD_FORM: AddWordFormState = {
  word: "",
  meaning: "",
  example: "",
  note: "",
};

const sectionSurface =
  "rounded-2xl border border-border/70 bg-card/90 shadow-none dark:bg-[linear-gradient(155deg,rgba(17,24,39,0.92),rgba(15,23,42,0.9))]";

function normalizeAnswer(value: string) {
  return value.trim().toLowerCase().replace(/[.,!?;:]+$/g, "");
}

function shortText(value: string, maxLength = 70) {
  const normalized = value.trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
}

function sourceLabel(word: VocabularyWord, t: ReturnType<typeof useTranslations>) {
  if (word.source === "ai") return t("source.ai");
  if (word.source === "manual") return t("source.manual");
  return t("source.testDerived");
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function StudentVocabularyClient() {
  const t = useTranslations("studentVocabulary");
  const [words, setWords] = useState<VocabularyWord[]>(() => getStudentVocabularyWords());
  const [suggestions, setSuggestions] = useState<VocabularySuggestion[]>(() => getStudentVocabularySuggestions());
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeWordId, setActiveWordId] = useState<string>("");
  const [addWordOpen, setAddWordOpen] = useState(false);
  const [addWordForm, setAddWordForm] = useState<AddWordFormState>(DEFAULT_ADD_FORM);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [practiceWordIds, setPracticeWordIds] = useState<string[]>([]);
  const [practiceIndex, setPracticeIndex] = useState(0);
  const [practiceInput, setPracticeInput] = useState("");
  const [practiceResults, setPracticeResults] = useState<Record<string, boolean>>({});
  const [practiceSummaryOpen, setPracticeSummaryOpen] = useState(false);
  const [masteredExpanded, setMasteredExpanded] = useState(false);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredWords = useMemo(() => {
    if (!normalizedSearch) return words;
    return words.filter((word) => {
      const haystack = `${word.word} ${word.meaning} ${word.example ?? ""} ${word.note ?? ""} ${word.sourceLabel ?? ""}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [normalizedSearch, words]);

  const filteredSuggestions = useMemo(() => {
    if (!normalizedSearch) return suggestions;
    return suggestions.filter((item) => `${item.word} ${item.meaning} ${item.sourceLabel}`.toLowerCase().includes(normalizedSearch));
  }, [normalizedSearch, suggestions]);

  const summary = useMemo(() => getVocabularySummary(words, suggestions), [suggestions, words]);
  const dueWords = useMemo(() => getDueTodayWords(filteredWords), [filteredWords]);
  const learningWords = useMemo(() => getLearningWords(filteredWords), [filteredWords]);
  const masteredWords = useMemo(() => getMasteredWords(filteredWords), [filteredWords]);
  const savedWords = useMemo(() => getSavedWords(filteredWords), [filteredWords]);
  const practiceDeck = useMemo(() => {
    const source = practiceWordIds.length
      ? words.filter((word) => practiceWordIds.includes(word.id))
      : buildVocabularyPracticeDeck(words);
    return source;
  }, [practiceWordIds, words]);
  const practiceQuestions = useMemo(() => buildPracticeQuestions(practiceDeck), [practiceDeck]);

  const activeWord = useMemo(() => words.find((word) => word.id === activeWordId) ?? null, [activeWordId, words]);
  const currentQuestion: VocabularyPracticeQuestion | null = practiceQuestions[practiceIndex] ?? null;
  const correctPracticeCount = Object.values(practiceResults).filter(Boolean).length;
  const practiceProgress = practiceQuestions.length
    ? Math.round(((practiceIndex + (practiceSummaryOpen ? 1 : 0)) / practiceQuestions.length) * 100)
    : 0;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const openWordDetails = (wordId: string) => {
    setActiveWordId(wordId);
    setDetailsOpen(true);
  };

  const openPractice = (wordIds?: string[]) => {
    setPracticeWordIds(wordIds ?? []);
    setPracticeOpen(true);
    setPracticeIndex(0);
    setPracticeInput("");
    setPracticeResults({});
    setPracticeSummaryOpen(false);
  };

  const closePractice = () => {
    setPracticeOpen(false);
    setPracticeWordIds([]);
    setPracticeIndex(0);
    setPracticeInput("");
    setPracticeResults({});
    setPracticeSummaryOpen(false);
  };

  const updateWord = (wordId: string, updater: (word: VocabularyWord) => VocabularyWord) => {
    setWords((current) => current.map((word) => (word.id === wordId ? updater(word) : word)));
  };

  const handleMarkReviewed = (wordId: string) => {
    updateWord(wordId, (word) => {
      const nextMastery = Math.min(100, word.mastery + 8);
      return {
        ...word,
        status: nextMastery >= 88 ? "mastered" : "learning",
        mastery: nextMastery,
        stability: Math.min(100, (word.stability ?? 0) + 10),
        correctStreak: word.correctStreak + 1,
        lastReviewedAt: new Date().toISOString(),
        nextReviewAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      };
    });
    setNotice({
      title: t("notices.reviewed.title"),
      description: t("notices.reviewed.description"),
    });
  };

  const handleRemoveFromLearning = (wordId: string) => {
    updateWord(wordId, (word) => ({
      ...word,
      status: "mastered",
      mastery: Math.max(word.mastery, 90),
      stability: Math.max(word.stability ?? 0, 80),
      nextReviewAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    }));
    setNotice({
      title: t("notices.removedFromLearning.title"),
      description: t("notices.removedFromLearning.description"),
    });
  };

  const handleDeleteWord = (wordId: string) => {
    setWords((current) => current.filter((word) => word.id !== wordId));
    setDetailsOpen(false);
    setNotice({
      title: t("notices.removed.title"),
      description: t("notices.removed.description"),
    });
  };

  const handleAddSuggestion = (suggestionId: string) => {
    const target = suggestions.find((item) => item.id === suggestionId);
    if (!target) return;

    const newWord: VocabularyWord = {
      id: `v-manual-added-${Date.now()}`,
      word: target.word,
      meaning: target.meaning,
      explanation: target.explanation,
      source: "ai",
      module: target.module,
      sourceLabel: target.sourceLabel,
      status: "due",
      mastery: 22,
      stability: 16,
      correctStreak: 0,
      addedAt: new Date().toISOString(),
      nextReviewAt: new Date().toISOString(),
      reviewStats: {
        total: 2,
        correct: 1,
        incorrect: 1,
      },
    };

    setWords((current) => [newWord, ...current]);
    setSuggestions((current) => current.filter((item) => item.id !== suggestionId));
    setNotice({
      title: t("notices.addedSuggestion.title"),
      description: t("notices.addedSuggestion.description", { word: target.word }),
    });
  };

  const handleDismissSuggestion = (suggestionId: string) => {
    const target = suggestions.find((item) => item.id === suggestionId);
    setSuggestions((current) => current.filter((item) => item.id !== suggestionId));
    setNotice({
      title: t("notices.dismissedSuggestion.title"),
      description: target
        ? t("notices.dismissedSuggestion.description", { word: target.word })
        : t("notices.dismissedSuggestion.fallbackDescription"),
    });
  };

  const handleSaveManualWord = () => {
    const word = addWordForm.word.trim();
    const meaning = addWordForm.meaning.trim();
    if (!word || !meaning) {
      setNotice({
        title: t("notices.validation.title"),
        description: t("notices.validation.description"),
      });
      return;
    }

    const manualWord: VocabularyWord = {
      id: `v-manual-${Date.now()}`,
      word,
      meaning,
      explanation: t("manual.defaultExplanation"),
      example: addWordForm.example.trim() || undefined,
      note: addWordForm.note.trim() || undefined,
      source: "manual",
      status: "learning",
      mastery: 25,
      stability: 20,
      correctStreak: 0,
      addedAt: new Date().toISOString(),
      nextReviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      reviewStats: {
        total: 0,
        correct: 0,
        incorrect: 0,
      },
    };

    setWords((current) => [manualWord, ...current]);
    setAddWordForm(DEFAULT_ADD_FORM);
    setAddWordOpen(false);
    setNotice({
      title: t("notices.savedWord.title"),
      description: t("notices.savedWord.description", { word }),
    });
  };

  const handlePracticeCheck = () => {
    if (!currentQuestion) return;
    const normalizedInput = normalizeAnswer(practiceInput);
    if (!normalizedInput) return;

    const isCorrect = normalizedInput === normalizeAnswer(currentQuestion.answer);
    setPracticeResults((current) => ({ ...current, [currentQuestion.id]: isCorrect }));
    if (practiceIndex >= practiceQuestions.length - 1) {
      setPracticeSummaryOpen(true);
      return;
    }

    setPracticeIndex((current) => current + 1);
    setPracticeInput("");
  };

  const applyPracticeProgress = () => {
    const byWordId = new Map<string, boolean[]>();
    practiceQuestions.forEach((question) => {
      const result = practiceResults[question.id];
      const previous = byWordId.get(question.wordId) ?? [];
      if (typeof result === "boolean") {
        previous.push(result);
      }
      byWordId.set(question.wordId, previous);
    });

    setWords((current) =>
      current.map((word) => {
        const outcomes = byWordId.get(word.id);
        if (!outcomes || outcomes.length === 0) return word;

        const correct = outcomes.filter(Boolean).length;
        const incorrect = outcomes.length - correct;
        const gained = correct * 8 - incorrect * 2;
        const nextMastery = clamp(Math.max(word.mastery + gained, 0), 0, 100);
        const nextStability = clamp(Math.max((word.stability ?? 0) + correct * 6 - incorrect * 3, 0), 0, 100);
        const nextStatus = nextMastery >= 88 ? "mastered" : nextMastery >= 35 ? "learning" : "due";

        return {
          ...word,
          mastery: nextMastery,
          stability: nextStability,
          status: nextStatus,
          correctStreak: correct > incorrect ? word.correctStreak + 1 : 0,
          lastReviewedAt: new Date().toISOString(),
          nextReviewAt: new Date(Date.now() + (nextStatus === "mastered" ? 10 : 2) * 24 * 60 * 60 * 1000).toISOString(),
          reviewStats: {
            total: (word.reviewStats?.total ?? 0) + outcomes.length,
            correct: (word.reviewStats?.correct ?? 0) + correct,
            incorrect: (word.reviewStats?.incorrect ?? 0) + incorrect,
          },
        };
      })
    );

    setNotice({
      title: t("notices.practiceCompleted.title"),
      description: t("notices.practiceCompleted.description", {
        correct: correctPracticeCount,
        total: practiceQuestions.length,
      }),
    });
    closePractice();
  };

  return (
    <main className="mx-auto min-w-0 w-full max-w-445 overflow-x-hidden px-2 py-5 sm:px-4 sm:py-6 lg:px-6">
      <section className="space-y-6 sm:space-y-7">
        <SiteToast notice={notice} />

        <header className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-[11px] tracking-[0.16em] text-muted-foreground uppercase">{t("eyebrow")}</p>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{t("title")}</h1>
              <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
            </div>
            <Button className="h-10 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400" onClick={() => openPractice()}>
              <Play className="size-4" />
              {t("actions.startPractice")}
            </Button>
          </div>

          <div className="relative max-w-3xl">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-11 rounded-xl border-border/70 bg-background/70 pl-9"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label={t("summary.dueToday.label")}
              value={summary.dueToday}
              support={t("summary.dueToday.support")}
              tone="rose"
            />
            <SummaryCard
              label={t("summary.learning.label")}
              value={summary.learning}
              support={t("summary.learning.support")}
              tone="blue"
            />
            <SummaryCard
              label={t("summary.mastered.label")}
              value={summary.mastered}
              support={t("summary.mastered.support")}
              tone="emerald"
            />
            <SummaryCard
              label={t("summary.recommendations.label")}
              value={summary.recommendations}
              support={t("summary.recommendations.support")}
              tone="violet"
            />
          </div>
        </header>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">{t("sections.dueToday.title")}</h2>
              <Badge className="rounded-full border-rose-400/35 bg-rose-500/12 text-rose-700 dark:text-rose-200">
                {t("cardsCount", { count: dueWords.length })}
              </Badge>
            </div>
          </div>

          <Card className={sectionSurface}>
            <CardContent className="p-0">
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("columns.word")}</TableHead>
                      <TableHead>{t("columns.meaningPreview")}</TableHead>
                      <TableHead>{t("columns.stability")}</TableHead>
                      <TableHead className="w-18 text-right">{t("columns.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dueWords.map((word) => (
                      <TableRow key={word.id} className="hover:bg-muted/35">
                        <TableCell>
                          <button
                            type="button"
                            className="text-left text-base font-semibold text-foreground hover:text-indigo-500"
                            onClick={() => openWordDetails(word.id)}
                          >
                            {word.word}
                          </button>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{shortText(word.meaning, 58)}</TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            <Progress value={word.stability ?? word.mastery} className="h-2.5 bg-muted" />
                            <p className="text-xs text-muted-foreground">{t("masteryPercent", { value: word.mastery })}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <WordActionsMenu
                            t={t}
                            onOpenDetails={() => openWordDetails(word.id)}
                            onPractice={() => openPractice([word.id])}
                            onMarkReviewed={() => handleMarkReviewed(word.id)}
                            onRemoveFromLearning={() => handleRemoveFromLearning(word.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 p-4 md:hidden">
                {dueWords.map((word) => (
                  <Card key={word.id} className="rounded-xl border-border/70 bg-background/65 p-3 shadow-none">
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        className="text-left text-base font-semibold text-foreground"
                        onClick={() => openWordDetails(word.id)}
                      >
                        {word.word}
                      </button>
                      <WordActionsMenu
                        t={t}
                        onOpenDetails={() => openWordDetails(word.id)}
                        onPractice={() => openPractice([word.id])}
                        onMarkReviewed={() => handleMarkReviewed(word.id)}
                        onRemoveFromLearning={() => handleRemoveFromLearning(word.id)}
                      />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{shortText(word.meaning, 120)}</p>
                    <div className="mt-3 space-y-1.5">
                      <Progress value={word.stability ?? word.mastery} className="h-2.5 bg-muted" />
                      <p className="text-xs text-muted-foreground">{t("stabilityPercent", { value: word.stability ?? word.mastery })}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-indigo-400" />
              <h2 className="text-xl font-semibold">{t("sections.aiSuggested.title")}</h2>
              <Badge className="rounded-full border-indigo-400/30 bg-indigo-500/12 text-indigo-700 dark:text-indigo-200">
                {filteredSuggestions.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {filteredSuggestions.length === 0 ? (
                <Card className={cn(sectionSurface, "p-5")}>
                  <p className="text-sm text-muted-foreground">{t("empty.aiSuggested")}</p>
                </Card>
              ) : (
                filteredSuggestions.map((suggestion) => (
                  <Card key={suggestion.id} className={cn(sectionSurface, "p-4")}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-lg font-semibold">{suggestion.word}</p>
                        <p className="text-sm text-muted-foreground">{suggestion.meaning}</p>
                        <p className="text-xs text-muted-foreground">{suggestion.sourceLabel}</p>
                        <p className="text-xs text-indigo-300/90">{suggestion.recommendedReason}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg border-border/70 bg-background/70"
                          onClick={() => handleDismissSuggestion(suggestion.id)}
                        >
                          {t("actions.dismiss")}
                        </Button>
                        <Button size="sm" className="h-8 rounded-lg bg-indigo-500 text-white hover:bg-indigo-400" onClick={() => handleAddSuggestion(suggestion.id)}>
                          {t("actions.add")}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">{t("sections.mySaved.title")}</h2>
            <button
              type="button"
              className="group block w-full rounded-2xl border border-dashed border-border/70 bg-card/75 p-6 text-left transition-colors hover:border-indigo-400/55 hover:bg-indigo-500/8"
              onClick={() => setAddWordOpen(true)}
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-xl border border-border/70 bg-background/60 group-hover:border-indigo-400/50 group-hover:text-indigo-400">
                  <Plus className="size-5" />
                </span>
                <div>
                  <p className="text-base font-semibold">{t("sections.mySaved.addCardTitle")}</p>
                  <p className="text-sm text-muted-foreground">{t("sections.mySaved.addCardDesc")}</p>
                </div>
              </div>
            </button>

            <div className="space-y-2">
              {savedWords.slice(0, 8).map((word) => (
                <button
                  key={word.id}
                  type="button"
                  className="w-full rounded-xl border border-border/70 bg-card/80 p-3 text-left transition-colors hover:border-indigo-400/40"
                  onClick={() => openWordDetails(word.id)}
                >
                  <p className="text-base font-semibold">{word.word}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{shortText(word.meaning, 84)}</p>
                </button>
              ))}
              {savedWords.length === 0 ? (
                <Card className={cn(sectionSurface, "p-4")}>
                  <p className="text-sm text-muted-foreground">{t("empty.saved")}</p>
                </Card>
              ) : null}
            </div>
          </section>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{t("sections.learning.title")}</h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {learningWords.slice(0, 9).map((word) => (
              <Card key={word.id} className={cn(sectionSurface, "p-4")}>
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    className="text-left text-lg font-semibold hover:text-indigo-400"
                    onClick={() => openWordDetails(word.id)}
                  >
                    {word.word}
                  </button>
                  <Badge className="rounded-full border-blue-400/35 bg-blue-500/12 text-blue-700 dark:text-blue-200">
                    {t("labels.learning")}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{shortText(word.meaning, 90)}</p>
                <div className="mt-4 space-y-1.5">
                  <Progress value={word.mastery} className="h-2.5 bg-muted" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("labels.masteryProgress")}</span>
                    <span>{word.mastery}%</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-card/85 px-4 py-3 text-left transition-colors hover:bg-card"
            onClick={() => setMasteredExpanded((current) => !current)}
            aria-expanded={masteredExpanded}
          >
            <div className="flex items-center gap-2">
              <Check className="size-4 text-emerald-400" />
              <span className="text-xl font-semibold">{t("sections.mastered.title", { count: summary.mastered })}</span>
            </div>
            {masteredExpanded ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
          </button>

          {masteredExpanded ? (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {masteredWords.slice(0, 24).map((word) => (
                <button
                  key={word.id}
                  type="button"
                  className="rounded-xl border border-border/70 bg-card/80 p-3 text-left hover:border-emerald-400/45"
                  onClick={() => openWordDetails(word.id)}
                >
                  <p className="font-semibold">{word.word}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{shortText(word.meaning, 86)}</p>
                </button>
              ))}
            </div>
          ) : null}
        </section>
      </section>

      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-lg">
          {activeWord ? (
            <>
              <SheetHeader className="border-b border-border/70 pb-4">
                <SheetTitle className="flex items-center gap-2 text-2xl">
                  <BookMarked className="size-5 text-indigo-400" />
                  {activeWord.word}
                </SheetTitle>
                <SheetDescription>{activeWord.meaning}</SheetDescription>
              </SheetHeader>
              <div className="space-y-5 p-6 pt-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className="rounded-full border-border/70 bg-background/70">{sourceLabel(activeWord, t)}</Badge>
                  <Badge className="rounded-full border-border/70 bg-background/70">{t(`status.${activeWord.status}`)}</Badge>
                  {activeWord.module ? <Badge className="rounded-full border-border/70 bg-background/70">{t(`module.${activeWord.module}`)}</Badge> : null}
                </div>

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("details.explanation")}</h3>
                  <p className="text-sm leading-7 text-foreground/90">{activeWord.explanation}</p>
                </section>

                {activeWord.example ? (
                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("details.exampleSentence")}</h3>
                    <p className="rounded-xl border border-border/70 bg-card/85 p-3 text-sm leading-7 text-foreground/90">{activeWord.example}</p>
                  </section>
                ) : null}

                <section className="space-y-2">
                  <h3 className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">{t("details.masteryProgress")}</h3>
                  <Progress value={activeWord.mastery} className="h-2.5 bg-muted" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("masteryPercent", { value: activeWord.mastery })}</span>
                    <span>{t("stabilityPercent", { value: activeWord.stability ?? activeWord.mastery })}</span>
                  </div>
                </section>

                <section className="grid grid-cols-3 gap-2">
                  <StatChip label={t("details.totalReviews")} value={activeWord.reviewStats?.total ?? 0} />
                  <StatChip label={t("details.correct")} value={activeWord.reviewStats?.correct ?? 0} />
                  <StatChip label={t("details.streak")} value={activeWord.correctStreak} />
                </section>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button className="rounded-xl bg-indigo-500 text-white hover:bg-indigo-400" onClick={() => openPractice([activeWord.id])}>
                    {t("actions.practiceThisWord")}
                  </Button>
                  <Button variant="outline" className="rounded-xl border-border/70 bg-background/70" onClick={() => handleMarkReviewed(activeWord.id)}>
                    {t("actions.markAsLearned")}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl border-rose-400/35 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-200"
                    onClick={() => handleDeleteWord(activeWord.id)}
                  >
                    <Trash2 className="size-4" />
                    {t("actions.remove")}
                  </Button>
                  <Button variant="ghost" className="rounded-xl" onClick={() => setDetailsOpen(false)}>
                    {t("actions.close")}
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={addWordOpen} onOpenChange={setAddWordOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border/70 pb-4">
            <SheetTitle>{t("addModal.title")}</SheetTitle>
            <SheetDescription>{t("addModal.description")}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 p-6 pt-4">
            <FieldLabel label={t("addModal.word")} required />
            <Input
              value={addWordForm.word}
              onChange={(event) => setAddWordForm((current) => ({ ...current, word: event.target.value }))}
              placeholder={t("addModal.wordPlaceholder")}
              className="h-10 rounded-xl border-border/70 bg-background/70"
            />

            <FieldLabel label={t("addModal.meaning")} required />
            <Input
              value={addWordForm.meaning}
              onChange={(event) => setAddWordForm((current) => ({ ...current, meaning: event.target.value }))}
              placeholder={t("addModal.meaningPlaceholder")}
              className="h-10 rounded-xl border-border/70 bg-background/70"
            />

            <FieldLabel label={t("addModal.example")} />
            <Input
              value={addWordForm.example}
              onChange={(event) => setAddWordForm((current) => ({ ...current, example: event.target.value }))}
              placeholder={t("addModal.examplePlaceholder")}
              className="h-10 rounded-xl border-border/70 bg-background/70"
            />

            <FieldLabel label={t("addModal.note")} />
            <Input
              value={addWordForm.note}
              onChange={(event) => setAddWordForm((current) => ({ ...current, note: event.target.value }))}
              placeholder={t("addModal.notePlaceholder")}
              className="h-10 rounded-xl border-border/70 bg-background/70"
            />

            <div className="flex items-center gap-2 pt-2">
              <Button className="rounded-xl bg-indigo-500 text-white hover:bg-indigo-400" onClick={handleSaveManualWord}>
                {t("actions.save")}
              </Button>
              <Button variant="outline" className="rounded-xl border-border/70 bg-background/70" onClick={() => setAddWordOpen(false)}>
                {t("actions.cancel")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {practiceOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-3 sm:p-6">
          <Card className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border-border/70 bg-background/95">
            <CardHeader className="border-b border-border/70 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Brain className="size-5 text-indigo-400" />
                    {t("practice.title")}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {practiceSummaryOpen
                      ? t("practice.summarySubtitle")
                      : t("practice.progressLabel", { current: practiceIndex + 1, total: practiceQuestions.length })}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={closePractice} aria-label={t("actions.close")}>
                  <X className="size-4" />
                </Button>
              </div>
              <Progress value={practiceProgress} className="mt-3 h-2.5 bg-muted" />
            </CardHeader>

            <CardContent className="space-y-4 p-5 sm:p-6">
              {!practiceQuestions.length ? (
                <p className="text-sm text-muted-foreground">{t("practice.empty")}</p>
              ) : practiceSummaryOpen ? (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-400/35 bg-emerald-500/10 p-4">
                    <p className="text-sm text-emerald-700 dark:text-emerald-200">{t("practice.scoreLabel")}</p>
                    <p className="mt-1 text-3xl font-semibold text-emerald-700 dark:text-emerald-100">
                      {correctPracticeCount}/{practiceQuestions.length}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button className="rounded-xl bg-indigo-500 text-white hover:bg-indigo-400" onClick={applyPracticeProgress}>
                      {t("practice.finishAndApply")}
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-xl border-border/70 bg-background/70"
                      onClick={() => {
                        setPracticeIndex(0);
                        setPracticeInput("");
                        setPracticeResults({});
                        setPracticeSummaryOpen(false);
                      }}
                    >
                      {t("practice.restart")}
                    </Button>
                  </div>
                </div>
              ) : currentQuestion ? (
                <>
                  <div className="space-y-3">
                    <Badge className="rounded-full border-border/70 bg-background/70">
                      {t(`practice.type.${currentQuestion.type}`)}
                    </Badge>
                    <p className="text-base font-medium leading-relaxed">{currentQuestion.prompt}</p>
                  </div>

                  {currentQuestion.choices?.length ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {currentQuestion.choices.map((choice) => {
                        const selected = practiceInput === choice;
                        return (
                          <button
                            key={choice}
                            type="button"
                            className={cn(
                              "rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                              selected
                                ? "border-indigo-400/60 bg-indigo-500/15 text-foreground"
                                : "border-border/70 bg-background/60 hover:border-indigo-400/40"
                            )}
                            onClick={() => setPracticeInput(choice)}
                          >
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <Input
                      value={practiceInput}
                      onChange={(event) => setPracticeInput(event.target.value)}
                      placeholder={t("practice.answerPlaceholder")}
                      className="h-11 rounded-xl border-border/70 bg-background/70"
                    />
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="rounded-xl bg-indigo-500 text-white hover:bg-indigo-400"
                      onClick={handlePracticeCheck}
                      disabled={!normalizeAnswer(practiceInput)}
                    >
                      {t("practice.check")}
                    </Button>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </main>
  );
}

function SummaryCard({
  label,
  value,
  support,
  tone,
}: {
  label: string;
  value: number;
  support: string;
  tone: "rose" | "blue" | "emerald" | "violet";
}) {
  const toneClass = {
    rose: "border-rose-400/35 bg-rose-500/12 text-rose-700 dark:text-rose-200",
    blue: "border-blue-400/35 bg-blue-500/12 text-blue-700 dark:text-blue-200",
    emerald: "border-emerald-400/35 bg-emerald-500/12 text-emerald-700 dark:text-emerald-200",
    violet: "border-violet-400/35 bg-violet-500/12 text-violet-700 dark:text-violet-200",
  } as const;

  return (
    <Card className={sectionSurface}>
      <CardContent className="space-y-2 p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="flex items-end justify-between gap-3">
          <p className="text-4xl font-semibold tracking-tight text-foreground">{value}</p>
          <Badge className={cn("rounded-full", toneClass[tone])}>{support}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function FieldLabel({ label, required = false }: { label: string; required?: boolean }) {
  return (
    <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
      {label}
      {required ? " *" : ""}
    </p>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/80 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function WordActionsMenu({
  t,
  onOpenDetails,
  onPractice,
  onMarkReviewed,
  onRemoveFromLearning,
}: {
  t: ReturnType<typeof useTranslations>;
  onOpenDetails: () => void;
  onPractice: () => void;
  onMarkReviewed: () => void;
  onRemoveFromLearning: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 rounded-lg" aria-label={t("actions.rowMenu")}>
          <MoreVertical className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={onOpenDetails}>{t("actions.openDetails")}</DropdownMenuItem>
        <DropdownMenuItem onClick={onPractice}>{t("actions.practiceThisWord")}</DropdownMenuItem>
        <DropdownMenuItem onClick={onMarkReviewed}>{t("actions.markReviewed")}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-rose-700 dark:text-rose-200" onClick={onRemoveFromLearning}>
          {t("actions.removeFromLearning")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
