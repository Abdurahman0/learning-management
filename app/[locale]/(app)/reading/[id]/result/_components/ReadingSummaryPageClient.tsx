"use client";

import Link from "next/link";
import {useEffect, useMemo, useRef, useState} from "react";
import {useParams, useRouter, useSearchParams} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";

import {getReadingReviewData} from "@/data/review-reading";
import {getReadingTestById} from "@/data/reading-tests";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {PostTestMistakeReasonsPanel} from "@/components/mistake-reasons/PostTestMistakeReasonsPanel";
import {gradeTest, type GradeableQuestion} from "@/lib/grading";
import {loadAttemptResult} from "@/lib/test-attempt-storage";
import {studentAttemptsService} from "@/src/services/student/attempts.service";
import {studentMistakeReasonsService} from "@/src/services/student/mistakeReasons.service";
import type {
  MistakeReasonCategory,
  MistakeReasonDetail,
  MistakeReasonUsageStatus,
  StudentAttemptDetail,
  StudentAttemptReviewResponse
} from "@/src/services/student/types";
import {QuestionTypePerformance, type QuestionTypePerformanceItem} from "./QuestionTypePerformance";
import {ReviewAiCoachCard} from "./ReviewAiCoachCard";
import {ReviewHeader} from "./ReviewHeader";
import {ReviewMistakeHeatmap} from "./ReviewMistakeHeatmap";
import {ReviewNextActions} from "./ReviewNextActions";
import {adaptReadingBackendReview, type AdaptedReadingBackendReview} from "./backendReviewAdapters";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_PATTERN.test(value.trim());
}

function normalizeStoredAnswers(input: Record<string, string | string[] | null>) {
  const normalized: Record<string, string | string[]> = {};

  for (const [questionId, value] of Object.entries(input)) {
    if (typeof value === "string") {
      normalized[questionId] = value;
      continue;
    }

    if (Array.isArray(value)) {
      normalized[questionId] = value;
    }
  }

  return normalized;
}

function getReadingCategoryQuestionNumbers(review: StudentAttemptReviewResponse | null): Partial<Record<MistakeReasonCategory, number[]>> {
  const result: Partial<Record<MistakeReasonCategory, number[]>> = {
    blank_answer: [],
    fully_incorrect: []
  };

  for (const passage of review?.passages ?? []) {
    for (const group of passage.question_groups ?? []) {
      for (const question of group.questions ?? []) {
        if (question.is_skipped) {
          result.blank_answer?.push(question.question_number);
        } else if (!question.is_correct) {
          result.fully_incorrect?.push(question.question_number);
        }
      }
    }
  }

  return result;
}

export function ReadingSummaryPageClient() {
  const params = useParams<{id: string}>();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const router = useRouter();
  const tResults = useTranslations("testResults");
  const tReadingResult = useTranslations("readingResult");
  const testId = typeof params?.id === "string" ? params.id : "";
  const attemptId = searchParams.get("attempt")?.trim() ?? "";
  const resolvedBackendAttemptId = isUuid(attemptId) ? attemptId : "";
  const localAttemptId = !resolvedBackendAttemptId && attemptId ? attemptId : "";
  const localResult = useMemo(() => {
    if (!localAttemptId) return null;
    return loadAttemptResult("reading", testId, localAttemptId);
  }, [localAttemptId, testId]);
  const [reviewPayload, setReviewPayload] = useState<StudentAttemptReviewResponse | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<StudentAttemptDetail | null>(null);
  const [backendReview, setBackendReview] = useState<AdaptedReadingBackendReview | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(resolvedBackendAttemptId));
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const tReadingReview = useTranslations("readingReview");
  const [showAiInsights, setShowAiInsights] = useState(false);
  const [mistakeModalOpen, setMistakeModalOpen] = useState(false);
  const [isMistakeAnalyzing, setIsMistakeAnalyzing] = useState(false);
  const aiInsightsRef = useRef<HTMLDivElement | null>(null);
  const [mistakeReasons, setMistakeReasons] = useState<MistakeReasonDetail[]>([]);
  const [selectedMistakeReason, setSelectedMistakeReason] = useState<MistakeReasonDetail | null>(null);
  const [selectedMistakeReasonIds, setSelectedMistakeReasonIds] = useState<string[]>([]);
  const [analyzedMistakeReasons, setAnalyzedMistakeReasons] = useState<MistakeReasonDetail[]>([]);
  const [mistakeReasonUsageStatus, setMistakeReasonUsageStatus] = useState<MistakeReasonUsageStatus | null>(null);
  const [isMistakeReasonAllowed, setIsMistakeReasonAllowed] = useState(true);
  const [isReasonsLoading, setIsReasonsLoading] = useState(Boolean(resolvedBackendAttemptId));
  const [mistakeReasonsError, setMistakeReasonsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!resolvedBackendAttemptId) {
      setIsLoading(false);
      return () => {
        active = false;
      };
    }

    const loadBackendReview = async () => {
      setIsLoading(true);
      try {
        const [reviewResponse, attemptResponse] = await Promise.all([
          studentAttemptsService.review(resolvedBackendAttemptId),
          studentAttemptsService.getById(resolvedBackendAttemptId)
        ]);
        if (!active) return;
        setReviewPayload(reviewResponse);
        setAttemptDetail(attemptResponse);
        setBackendReview(adaptReadingBackendReview(reviewResponse));
      } catch {
        if (!active) return;
        setReviewPayload(null);
        setAttemptDetail(null);
        setBackendReview(null);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadBackendReview();

    return () => {
      active = false;
    };
  }, [resolvedBackendAttemptId]);

  useEffect(() => {
    let active = true;

    if (!resolvedBackendAttemptId) {
      setIsReasonsLoading(false);
      setMistakeReasons([]);
      return () => {
        active = false;
      };
    }

    const loadMistakeReasons = async () => {
      setIsReasonsLoading(true);
      setMistakeReasonsError(null);
      try {
        const response = await studentMistakeReasonsService.listForAttemptWithUsage(resolvedBackendAttemptId);
        if (!active) return;
        setMistakeReasons(response.results);
        setMistakeReasonUsageStatus(response.usage_status);
        setIsMistakeReasonAllowed(response.is_ai_allowed);
      } catch (error) {
        if (!active) return;
        setMistakeReasons([]);
        setMistakeReasonUsageStatus(null);
        setIsMistakeReasonAllowed(false);
        setMistakeReasonsError(error instanceof Error ? error.message : "Could not load mistake reasons.");
      } finally {
        if (active) {
          setIsReasonsLoading(false);
        }
      }
    };

    void loadMistakeReasons();

    return () => {
      active = false;
    };
  }, [resolvedBackendAttemptId]);

  useEffect(() => {
    if (resolvedBackendAttemptId) return;
    const backendId = localResult?.backendAttemptId?.trim() ?? "";
    if (!backendId || !isUuid(backendId)) return;
    router.replace(`/${locale}/reading/${testId}/result?attempt=${backendId}`);
  }, [locale, localResult?.backendAttemptId, resolvedBackendAttemptId, router, testId]);

  const gradingQuestions = useMemo(() => backendReview?.questions ?? [], [backendReview]);
  const gradingAnswers = useMemo(
    () => normalizeStoredAnswers(backendReview?.answers ?? {}),
    [backendReview]
  );

  const gradeableQuestions = useMemo<GradeableQuestion[]>(() => {
    return gradingQuestions.map((question) => ({
      id: question.id,
      number: question.number,
      type: question.type,
      correctAnswer: question.correctAnswer,
      acceptableAnswers: question.acceptableAnswers
    }));
  }, [gradingQuestions]);

  const grading = useMemo(() => {
    if (!gradeableQuestions.length) return null;
    return gradeTest(gradeableQuestions, gradingAnswers);
  }, [gradeableQuestions, gradingAnswers]);

  const accuracyByType = useMemo(() => {
    if (!grading || !gradingQuestions.length) return [] as QuestionTypePerformanceItem[];

    const buckets = new Map<string, {correct: number; total: number}>();

    for (const question of gradingQuestions) {
      const result = grading.byQuestion[question.id];
      const previous = buckets.get(question.type) ?? {correct: 0, total: 0};
      previous.total += 1;
      if (result?.isCorrect) previous.correct += 1;
      buckets.set(question.type, previous);
    }

    return [...buckets.entries()].map(([type, stats]) => ({
      type: type as QuestionTypePerformanceItem["type"],
      correct: stats.correct,
      total: stats.total,
      percent: stats.total ? Math.round((stats.correct / stats.total) * 100) : 0
    }));
  }, [grading, gradingQuestions]);

  const reviewData = useMemo(() => getReadingReviewData(testId), [testId]);

  useEffect(() => {
    if (!actionNotice) return;
    const timer = window.setTimeout(() => setActionNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [actionNotice]);

  const handleAiAnalysisClick = () => {
    setMistakeModalOpen(true);
  };

  const handleMistakeReasonSelect = (reason: MistakeReasonDetail) => {
    setMistakeReasonsError(null);
    setSelectedMistakeReason(reason);
    setSelectedMistakeReasonIds((current) => {
      if (current.includes(reason.id)) {
        return current.filter((id) => id !== reason.id);
      }
      return [...current, reason.id];
    });
  };

  const selectedMistakeReasons = useMemo(
    () => mistakeReasons.filter((reason) => selectedMistakeReasonIds.includes(reason.id)),
    [mistakeReasons, selectedMistakeReasonIds]
  );

  const handleAnalyzeMistakes = async () => {
    if (!selectedMistakeReasons.length || !isMistakeReasonAllowed || !resolvedBackendAttemptId) return;
    setIsMistakeAnalyzing(true);
    setMistakeReasonsError(null);
    try {
      const response = await studentMistakeReasonsService.selectForAttempt(resolvedBackendAttemptId, selectedMistakeReasonIds);
      const detailedReasons = response.results.length ? response.results : selectedMistakeReasons;
      setMistakeReasonUsageStatus(response.usage_status);
      setIsMistakeReasonAllowed(response.is_ai_allowed || Boolean(response.usage_status?.already_used_for_attempt));
      setAnalyzedMistakeReasons(detailedReasons);
      setSelectedMistakeReason(detailedReasons[0] ?? null);

      window.setTimeout(() => {
      setIsMistakeAnalyzing(false);
      setMistakeModalOpen(false);
      setShowAiInsights(true);
      window.setTimeout(() => {
        const node = aiInsightsRef.current;
        if (node) {
          node.scrollIntoView({behavior: "smooth", block: "start"});
          return;
        }
        const fallback = document.getElementById("ai-insights");
        fallback?.scrollIntoView({behavior: "smooth", block: "start"});
      }, 80);
      }, 900);
    } catch (error) {
      setIsMistakeAnalyzing(false);
      setMistakeReasonsError(error instanceof Error ? error.message : "Could not analyze selected mistake reasons.");
    }
  };

  const categoryQuestionNumbers = useMemo(
    () => getReadingCategoryQuestionNumbers(reviewPayload),
    [reviewPayload]
  );

  if (!resolvedBackendAttemptId) {
    if (!localAttemptId) {
      return (
        <div className="mx-auto mt-8 max-w-3xl px-4">
          <Card className="p-6">
            <h1 className="text-xl font-semibold">{tResults("missingAttemptTitle")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Attempt ID is required to load backend results.</p>
            <Button className="mt-4" asChild>
              <Link href={`/${locale}/reading/${testId}`}>{tResults("retakeTest")}</Link>
            </Button>
          </Card>
        </div>
      );
    }

    if (!localResult) {
      return (
        <div className="mx-auto mt-8 max-w-3xl px-4">
          <Card className="p-6">
            <h1 className="text-xl font-semibold">{tResults("missingAttemptTitle")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{tResults("missingAttemptDescription")}</p>
            <Button className="mt-4" asChild>
              <Link href={`/${locale}/reading/${testId}`}>{tResults("retakeTest")}</Link>
            </Button>
          </Card>
        </div>
      );
    }

    const test = getReadingTestById(testId);
    const title = test?.title || (tReadingResult.has("headerLabel") ? tReadingResult("headerLabel") : "Reading Result");
    const total = test?.totalQuestions ?? 40;
    const answered = Object.values(localResult.answers ?? {}).filter((value) => {
      if (typeof value === "string") return value.trim().length > 0;
      if (Array.isArray(value)) return value.length > 0;
      return false;
    }).length;
    const flagged = localResult.markedQuestionIds?.length ?? 0;
    const elapsedSeconds = Math.max(0, Math.floor(((localResult.finishedAt ?? Date.now()) - localResult.startedAt) / 1000));
    const mm = Math.floor(elapsedSeconds / 60).toString().padStart(2, "0");
    const ss = (elapsedSeconds % 60).toString().padStart(2, "0");

    return (
      <section className="mx-auto w-full max-w-3xl space-y-4 px-4 pb-10 pt-6">
        <Card className="rounded-3xl border-border/70 bg-card/80 p-6">
          <p className="text-xs font-medium tracking-wider text-muted-foreground">{tReadingResult.has("resultLabel") ? tReadingResult("resultLabel") : "READING RESULT"}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
              <p className="text-[11px] font-medium text-muted-foreground">Answered</p>
              <p className="mt-1 text-xl font-semibold">{answered} / {total}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
              <p className="text-[11px] font-medium text-muted-foreground">Flagged</p>
              <p className="mt-1 text-xl font-semibold">{flagged}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/40 p-4">
              <p className="text-[11px] font-medium text-muted-foreground">Time used</p>
              <p className="mt-1 text-xl font-semibold">{mm}:{ss}</p>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            You finished as a guest. Your answers are saved on this device. Create an account to get scoring, band estimate, explanations, and to sync this attempt to your history.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/${locale}/register`}>Create account</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/${locale}/login`}>Log in</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href={`/${locale}/reading/${testId}`}>{tResults("retakeTest")}</Link>
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto mt-8 max-w-3xl px-4">
        <Card className="p-6 text-sm text-muted-foreground">Loading backend result...</Card>
      </div>
    );
  }

  if (!backendReview || !grading) {
    return (
      <div className="mx-auto mt-8 max-w-3xl px-4">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">{tResults("missingAttemptTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{tResults("missingAttemptDescription")}</p>
          <Button className="mt-4" asChild>
            <Link href={`/${locale}/reading/${testId}`}>{tResults("retakeTest")}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const totalQuestions = Math.max(0, attemptDetail?.total_questions ?? grading.total);
  const correctCount = Math.max(0, attemptDetail?.correct_count ?? grading.correctCount);
  const incorrectCount = Math.max(0, attemptDetail?.incorrect_count ?? grading.incorrectCount);
  const unansweredCount = Math.max(0, attemptDetail?.unanswered_count ?? grading.unansweredCount);
  const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : grading.scorePercent;
  const timeUsedSeconds = Math.max(0, attemptDetail?.time_used_seconds ?? reviewPayload?.time_used_seconds ?? 0);
  const minutes = Math.floor(timeUsedSeconds / 60).toString().padStart(2, "0");
  const seconds = (timeUsedSeconds % 60).toString().padStart(2, "0");
  const testTitle = attemptDetail?.practice_test_title || reviewPayload?.test_title || "Reading Test";
  const questionTypeStats = attemptDetail?.question_type_stats_json ?? null;
  const passageStats = attemptDetail?.passage_stats_json ?? null;
  const dynamicMistakeBreakdown = accuracyByType.length
    ? [...accuracyByType]
        .sort((a, b) => a.percent - b.percent)
        .map((item) => ({
          id: item.type,
          label: tReadingResult(`questionTypes.${item.type}`),
          successRate: item.percent
        }))
    : reviewData.mistakeBreakdown;
  const dynamicHeatmap = (reviewPayload?.passages?.length
    ? reviewPayload.passages.map((passage, index) => {
        const correct = typeof passage.correct_count === "number" ? passage.correct_count : 0;
        const total = typeof passage.total_count === "number" ? passage.total_count : (typeof passage.max_questions === "number" ? passage.max_questions : 0);
        const ratio = total > 0 ? correct / total : 0;
        const level = ratio >= 0.75 ? "excellent" : ratio >= 0.5 ? "average" : "critical";
        return {
          passageId: `p${index + 1}`,
          label: `P${index + 1}`,
          level,
          answeredCorrectly: correct,
          total
        } as const;
      })
    : passageStats
      ? Object.entries(passageStats).map(([, stats], index) => {
          const row = (stats && typeof stats === "object" ? (stats as Record<string, unknown>) : {}) ?? {};
          const correct = typeof row.correct === "number" ? row.correct : 0;
          const total = typeof row.total === "number" ? row.total : 0;
          const ratio = total > 0 ? correct / total : 0;
          const level = ratio >= 0.75 ? "excellent" : ratio >= 0.5 ? "average" : "critical";
          return {
            passageId: `p${index + 1}`,
            label: `P${index + 1}`,
            level,
            answeredCorrectly: correct,
            total
          } as const;
        })
      : reviewData.heatmap);
  const weakestQuestionType = dynamicMistakeBreakdown[0]?.label ?? reviewData.aiCoach.weakestQuestionType;
  const weakestPassage = [...dynamicHeatmap]
    .sort((a, b) => {
      const ratioA = a.total > 0 ? a.answeredCorrectly / a.total : 0;
      const ratioB = b.total > 0 ? b.answeredCorrectly / b.total : 0;
      return ratioA - ratioB;
    })[0]?.label ?? reviewData.aiCoach.weakestPassage;
  const dynamicCoach = {
    ...reviewData.aiCoach,
    score: `${correctCount}/${totalQuestions}`,
    accuracy: `${scorePercent}%`,
    timeUsed: `${minutes}:${seconds}`,
    weakestQuestionType,
    weakestPassage
  };

  return (
    <section className="mx-auto w-full max-w-445 space-y-5 px-2 pb-10 pt-4 sm:px-4 lg:px-6">
      <ReviewHeader
        testId={testId}
        testTitle={testTitle}
        correct={correctCount}
        incorrect={incorrectCount}
        unanswered={unansweredCount}
        total={totalQuestions}
        scorePercent={scorePercent}
        minutes={minutes}
        seconds={seconds}
        timerUsed={Boolean(timeUsedSeconds)}
        reviewHref={`/${locale}/reading/${testId}?review=1&attempt=${resolvedBackendAttemptId}`}
        bandScore={attemptDetail?.band_score ?? reviewPayload?.band_score ?? null}
        reviewVariant="analysis"
        showAiAnalysisButton
        onAiAnalysisClick={handleAiAnalysisClick}
      />

      {/* Attempt metadata card is temporarily hidden. */}
      {/*
        <Card className="rounded-3xl border-border/70 bg-card/80 p-4 text-sm">
          <div className="grid gap-2 sm:grid-cols-2">
            <div><span className="text-muted-foreground">Attempt ID:</span> {attemptDetail?.id ?? resolvedBackendAttemptId}</div>
            <div><span className="text-muted-foreground">Status:</span> {attemptDetail?.status ?? "UNKNOWN"}</div>
            <div><span className="text-muted-foreground">Score:</span> {attemptDetail?.score ?? correctCount}</div>
            <div><span className="text-muted-foreground">Band Score:</span> {attemptDetail?.band_score ?? "-"}</div>
            <div><span className="text-muted-foreground">Mode:</span> {attemptDetail?.mode ?? "-"}</div>
            <div><span className="text-muted-foreground">Time Used:</span> {timeUsedSeconds}s</div>
          </div>
        </Card>
      */}

      <QuestionTypePerformance items={accuracyByType} />

      <PostTestMistakeReasonsPanel
        open={mistakeModalOpen}
        reasons={mistakeReasons}
        selectedReasonIds={selectedMistakeReasonIds}
        isLoading={isReasonsLoading}
        isAnalyzing={isMistakeAnalyzing}
        error={mistakeReasonsError}
        canAnalyze={isMistakeReasonAllowed || Boolean(mistakeReasonUsageStatus?.already_used_for_attempt)}
        disabledReason={mistakeReasonUsageStatus?.reset_message || null}
        categoryQuestionNumbers={categoryQuestionNumbers}
        onOpenChange={setMistakeModalOpen}
        onToggleReason={handleMistakeReasonSelect}
        onAnalyze={handleAnalyzeMistakes}
      />

      {questionTypeStats ? (
        <Card className="rounded-3xl border-border/70 bg-card/80 p-4 text-sm">
          <h3 className="mb-3 text-base font-semibold">Question Type Stats</h3>
          <div className="space-y-2">
            {Object.entries(questionTypeStats).map(([type, stats]) => {
              const row = (stats && typeof stats === "object" ? stats as Record<string, unknown> : {}) ?? {};
              const correct = typeof row.correct === "number" ? row.correct : 0;
              const total = typeof row.total === "number" ? row.total : 0;
              const accuracy = typeof row.accuracy_percent === "number" ? row.accuracy_percent : 0;
              return (
                <div key={type} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                  <span>{type}</span>
                  <span className="text-muted-foreground">{correct}/{total} ({accuracy}%)</span>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {passageStats ? (
        <Card className="rounded-3xl border-border/70 bg-card/80 p-4 text-sm">
          <h3 className="mb-3 text-base font-semibold">Passage Stats</h3>
          <div className="space-y-2">
            {Object.entries(passageStats).map(([passage, stats]) => {
              const row = (stats && typeof stats === "object" ? stats as Record<string, unknown> : {}) ?? {};
              const correct = typeof row.correct === "number" ? row.correct : 0;
              const total = typeof row.total === "number" ? row.total : 0;
              return (
                <div key={passage} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2">
                  <span>{passage}</span>
                  <span className="text-muted-foreground">{correct}/{total}</span>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      {actionNotice ? (
        <Card className="border-blue-300/70 bg-blue-100/70 p-3 text-sm text-blue-700 dark:border-blue-500/35 dark:bg-blue-500/10 dark:text-blue-100">
          {actionNotice}
        </Card>
      ) : null}

      {/* Video lesson is temporarily hidden. */}
      {/*
        <ReviewVideoLessonCard
          lesson={reviewData.videoLesson}
          onAction={(message) => setActionNotice(tReadingReview("actionPlaceholder", {action: message}))}
        />
      */}

      <div
        className={
          showAiInsights
            ? "grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]"
            : "grid gap-5"
        }
      >
        {showAiInsights ? (
          <div ref={aiInsightsRef} id="ai-insights" className="scroll-mt-24">
            <ReviewAiCoachCard
              coach={dynamicCoach}
              mistakeBreakdown={dynamicMistakeBreakdown}
              selectedMistakeReason={selectedMistakeReason}
              selectedMistakeReasons={analyzedMistakeReasons}
              onAction={(message) => setActionNotice(tReadingReview("actionPlaceholder", {action: message}))}
            />
          </div>
        ) : null}
        <ReviewMistakeHeatmap items={dynamicHeatmap} />
      </div>

      <ReviewNextActions
        actions={reviewData.nextActions}
        onAction={(message) => setActionNotice(tReadingReview("actionPlaceholder", {action: message}))}
      />
    </section>
  );
}
