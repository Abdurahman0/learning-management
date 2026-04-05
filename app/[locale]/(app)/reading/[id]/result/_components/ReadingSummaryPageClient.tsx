"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { getReadingTestById, type ReadingQuestion } from "@/data/reading-tests";
import { getReadingReviewData } from "@/data/review-reading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { gradeTest, type GradeableQuestion } from "@/lib/grading";
import {
  loadAttemptResult,
  loadLatestAttemptResult,
  type PersistedAttempt,
} from "@/lib/test-attempt-storage";
import { studentAttemptsService } from "@/src/services/student/attempts.service";
import {
  QuestionTypePerformance,
  type QuestionTypePerformanceItem,
} from "./QuestionTypePerformance";
import { ReviewAiCoachCard } from "./ReviewAiCoachCard";
import { ReviewHeader } from "./ReviewHeader";
import { ReviewMistakeHeatmap } from "./ReviewMistakeHeatmap";
import { ReviewNextActions } from "./ReviewNextActions";
import { ReviewVideoLessonCard } from "./ReviewVideoLessonCard";
import { adaptReadingBackendReview, type AdaptedReadingBackendReview } from "./backendReviewAdapters";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID_PATTERN.test(value.trim());
}

function normalizeStoredAnswers(input?: Record<string, string | string[] | null>) {
  const normalized: Record<string, string | string[]> = {};
  if (!input) return normalized;

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
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const tResults = useTranslations("testResults");
  const tReview = useTranslations("readingReview");
  const tReadingResult = useTranslations("readingResult");
  const testId = typeof params?.id === "string" ? params.id : "";
  const attemptId = searchParams.get("attempt") ?? "";
  const test = getReadingTestById(testId);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [backendReview, setBackendReview] = useState<AdaptedReadingBackendReview | null>(null);
  const [backendTimeUsedSeconds, setBackendTimeUsedSeconds] = useState<number | null>(null);

  const attempt = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") {
        return () => undefined;
      }
      const handler = () => onStoreChange();
      window.addEventListener("storage", handler);
      return () => window.removeEventListener("storage", handler);
    },
    () => {
      if (typeof window === "undefined" || !test) return null;
      if (!attemptId) return loadLatestAttemptResult("reading", test.id);
      return loadAttemptResult("reading", test.id, attemptId);
    },
    () => null
  ) as PersistedAttempt | null;

  const resolvedBackendAttemptId = useMemo(() => {
    if (isUuid(attemptId)) return attemptId;
    const fromPersisted = attempt?.backendAttemptId ?? "";
    return isUuid(fromPersisted) ? fromPersisted : "";
  }, [attempt?.backendAttemptId, attemptId]);

  useEffect(() => {
    let active = true;

    if (!resolvedBackendAttemptId) {
      return () => {
        active = false;
      };
    }

    const loadBackendReview = async () => {
      try {
        const response = await studentAttemptsService.review(resolvedBackendAttemptId);
        if (!active) return;
        setBackendReview(adaptReadingBackendReview(response));
        setBackendTimeUsedSeconds(typeof response.time_used_seconds === "number" ? response.time_used_seconds : null);
      } catch {
        if (!active) return;
        setBackendReview(null);
        setBackendTimeUsedSeconds(null);
      }
    };

    void loadBackendReview();

    return () => {
      active = false;
    };
  }, [resolvedBackendAttemptId]);

  const activeBackendReview = resolvedBackendAttemptId ? backendReview : null;
  const activeBackendTimeUsedSeconds = resolvedBackendAttemptId ? backendTimeUsedSeconds : null;

  const gradingQuestions = useMemo(
    () => activeBackendReview?.questions ?? test?.questions ?? [],
    [activeBackendReview, test?.questions]
  );

  const gradingAnswers = useMemo(
    () =>
      activeBackendReview
        ? normalizeStoredAnswers(activeBackendReview.answers)
        : normalizeStoredAnswers(attempt?.answers),
    [activeBackendReview, attempt?.answers]
  );

  const gradeableQuestions = useMemo<GradeableQuestion[]>(() => {
    if (!gradingQuestions.length) return [];
    return gradingQuestions.map((question) => {
      return {
        id: question.id,
        number: question.number,
        type: question.type,
        correctAnswer: question.correctAnswer,
        acceptableAnswers: question.acceptableAnswers,
      };
    });
  }, [gradingQuestions]);

  const grading = useMemo(() => {
    if (!gradeableQuestions.length) return null;
    return gradeTest(gradeableQuestions, gradingAnswers);
  }, [gradeableQuestions, gradingAnswers]);

  const accuracyByType = useMemo(() => {
    if (!grading || !gradingQuestions.length) return [] as QuestionTypePerformanceItem[];
    const buckets = new Map<
      ReadingQuestion["type"],
      { correct: number; total: number }
    >();

    for (const question of gradingQuestions) {
      const result = grading.byQuestion[question.id];
      const key = question.type;
      const previous = buckets.get(key) ?? { correct: 0, total: 0 };
      previous.total += 1;
      if (result?.isCorrect) {
        previous.correct += 1;
      }
      buckets.set(key, previous);
    }

    return [...buckets.entries()].map(([type, stats]) => ({
      type,
      correct: stats.correct,
      total: stats.total,
      percent: stats.total ? Math.round((stats.correct / stats.total) * 100) : 0,
    }));
  }, [grading, gradingQuestions]);

  const reviewData = useMemo(() => getReadingReviewData(testId), [testId]);

  const dynamicHeatmap = useMemo(() => {
    if (!test || !grading) return reviewData.heatmap;

    return test.passages.map((passage, index) => {
      const inPassage = gradingQuestions.filter((question) => question.passageId === passage.id);
      const total = inPassage.length;
      const answeredCorrectly = inPassage.reduce((sum, question) => sum + (grading.byQuestion[question.id]?.isCorrect ? 1 : 0), 0);
      const ratio = total ? answeredCorrectly / total : 0;
      const level = ratio >= 0.75 ? "excellent" : ratio >= 0.5 ? "average" : "critical";
      return {
        passageId: passage.id,
        label: `P${index + 1}`,
        level,
        answeredCorrectly,
        total,
      } as const;
    });
  }, [grading, gradingQuestions, reviewData.heatmap, test]);

  useEffect(() => {
    if (!actionNotice) return;
    const timer = window.setTimeout(() => setActionNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [actionNotice]);

  const handleAction = useCallback(
    (actionLabel: string) => {
      setActionNotice(tReview("actionPlaceholder", { action: actionLabel }));
    },
    [tReview]
  );

  if (!test) {
    return (
      <div className="mx-auto mt-8 max-w-3xl px-4">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">{tResults("missingAttemptTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tResults("missingAttemptDescription")}
          </p>
          <Button className="mt-4" asChild>
            <Link href={`/${locale}/reading/${testId}?restart=1`}>
              {tResults("retakeTest")}
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  if ((!attempt && !activeBackendReview) || !grading) {
    return (
      <div className="mx-auto mt-8 max-w-3xl px-4">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">{tResults("missingAttemptTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tResults("missingAttemptDescription")}
          </p>
          <Button className="mt-4" asChild>
            <Link href={`/${locale}/reading/${testId}?restart=1`}>
              {tResults("retakeTest")}
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const timerSpentSec = attempt
    ? Math.max(0, test.durationMinutes * 60 - attempt.timeRemainingSec)
    : 0;
  const fallbackSpentSec = attempt
    ? Math.max(0, attempt.finishedAt ? Math.floor((attempt.finishedAt - attempt.startedAt) / 1000) : 0)
    : 0;
  const effectiveSpentSec = activeBackendTimeUsedSeconds ?? (attempt?.timerUsed ? timerSpentSec : fallbackSpentSec);
  const minutes = Math.floor(effectiveSpentSec / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (effectiveSpentSec % 60).toString().padStart(2, "0");
  const dynamicMistakeBreakdown = accuracyByType.length
    ? [...accuracyByType]
        .sort((a, b) => a.percent - b.percent)
        .map((item) => ({
          id: item.type,
          label: tReadingResult(`questionTypes.${item.type}`),
          successRate: item.percent,
        }))
    : reviewData.mistakeBreakdown;
  const weakestQuestionType = dynamicMistakeBreakdown[0]?.label ?? reviewData.aiCoach.weakestQuestionType;
  const weakestPassageNumber = [...dynamicHeatmap]
    .sort((a, b) => {
      const ratioA = a.total > 0 ? a.answeredCorrectly / a.total : 0;
      const ratioB = b.total > 0 ? b.answeredCorrectly / b.total : 0;
      return ratioA - ratioB;
    })[0]?.label.replace(/\D/g, "");
  const dynamicCoach = {
    ...reviewData.aiCoach,
    score: `${grading.correctCount}/${grading.total}`,
    accuracy: `${grading.scorePercent}%`,
    timeUsed: attempt ? (attempt.timerUsed ? `${minutes}:${seconds}` : tReadingResult("practiceTest")) : `${minutes}:${seconds}`,
    weakestQuestionType,
    weakestPassage: weakestPassageNumber
      ? tReadingResult("passageLabel", { index: Number(weakestPassageNumber) })
      : reviewData.aiCoach.weakestPassage,
  };
  const reviewAttemptParam = resolvedBackendAttemptId || attempt?.attemptId || "";

  return (
    <section className="mx-auto w-full max-w-445 space-y-5 px-2 pb-10 pt-4 sm:px-4 lg:px-6">
      <ReviewHeader
        testId={test.id}
        testTitle={test.title}
        correct={grading.correctCount}
        incorrect={grading.incorrectCount}
        unanswered={grading.unansweredCount}
        total={grading.total}
        scorePercent={grading.scorePercent}
        minutes={minutes}
        seconds={seconds}
        timerUsed={attempt?.timerUsed ?? true}
        reviewHref={
          reviewAttemptParam
            ? `/${locale}/reading/${test.id}/review?attempt=${reviewAttemptParam}`
            : `/${locale}/reading/${test.id}/review`
        }
      />

      <QuestionTypePerformance items={accuracyByType} />

      {actionNotice ? (
        <Card className="border-blue-300/70 bg-blue-100/70 p-3 text-sm text-blue-700 dark:border-blue-500/35 dark:bg-blue-500/10 dark:text-blue-100">
          {actionNotice}
        </Card>
      ) : null}

      <ReviewVideoLessonCard lesson={reviewData.videoLesson} onAction={handleAction} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <ReviewAiCoachCard coach={dynamicCoach} mistakeBreakdown={dynamicMistakeBreakdown} onAction={handleAction} />
        <ReviewMistakeHeatmap items={dynamicHeatmap} />
      </div>

      <ReviewNextActions actions={reviewData.nextActions} onAction={handleAction} />
    </section>
  );
}
