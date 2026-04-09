"use client";

import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {useParams, useSearchParams} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";

import {getReadingReviewData} from "@/data/review-reading";
import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {gradeTest, type GradeableQuestion} from "@/lib/grading";
import {studentAttemptsService} from "@/src/services/student/attempts.service";
import type {StudentAttemptDetail, StudentAttemptReviewResponse} from "@/src/services/student/types";
import {QuestionTypePerformance, type QuestionTypePerformanceItem} from "./QuestionTypePerformance";
import {ReviewAiCoachCard} from "./ReviewAiCoachCard";
import {ReviewHeader} from "./ReviewHeader";
import {ReviewMistakeHeatmap} from "./ReviewMistakeHeatmap";
import {ReviewNextActions} from "./ReviewNextActions";
import {ReviewVideoLessonCard} from "./ReviewVideoLessonCard";
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

export function ReadingSummaryPageClient() {
  const params = useParams<{id: string}>();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const tResults = useTranslations("testResults");
  const tReadingResult = useTranslations("readingResult");
  const testId = typeof params?.id === "string" ? params.id : "";
  const attemptId = searchParams.get("attempt")?.trim() ?? "";
  const resolvedBackendAttemptId = isUuid(attemptId) ? attemptId : "";
  const [reviewPayload, setReviewPayload] = useState<StudentAttemptReviewResponse | null>(null);
  const [attemptDetail, setAttemptDetail] = useState<StudentAttemptDetail | null>(null);
  const [backendReview, setBackendReview] = useState<AdaptedReadingBackendReview | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(resolvedBackendAttemptId));
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const tReadingReview = useTranslations("readingReview");

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

  if (!resolvedBackendAttemptId) {
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
        reviewHref={`/${locale}/reading/${testId}/review?attempt=${resolvedBackendAttemptId}`}
      />

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

      <QuestionTypePerformance items={accuracyByType} />

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

      <ReviewVideoLessonCard
        lesson={reviewData.videoLesson}
        onAction={(message) => setActionNotice(tReadingReview("actionPlaceholder", {action: message}))}
      />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <ReviewAiCoachCard
          coach={dynamicCoach}
          mistakeBreakdown={dynamicMistakeBreakdown}
          onAction={(message) => setActionNotice(tReadingReview("actionPlaceholder", {action: message}))}
        />
        <ReviewMistakeHeatmap items={dynamicHeatmap} />
      </div>

      <ReviewNextActions
        actions={reviewData.nextActions}
        onAction={(message) => setActionNotice(tReadingReview("actionPlaceholder", {action: message}))}
      />
    </section>
  );
}
