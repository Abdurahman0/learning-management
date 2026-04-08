"use client";

import Link from "next/link";
import {useEffect, useMemo, useState} from "react";
import {useParams, useSearchParams} from "next/navigation";
import {useLocale, useTranslations} from "next-intl";

import {Button} from "@/components/ui/button";
import {Card} from "@/components/ui/card";
import {gradeTest, type GradeableQuestion} from "@/lib/grading";
import {studentAttemptsService} from "@/src/services/student/attempts.service";
import type {StudentAttemptReviewResponse} from "@/src/services/student/types";
import {QuestionTypePerformance, type QuestionTypePerformanceItem} from "./QuestionTypePerformance";
import {ReviewHeader} from "./ReviewHeader";
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
  const [backendReview, setBackendReview] = useState<AdaptedReadingBackendReview | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(resolvedBackendAttemptId));

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
        const response = await studentAttemptsService.review(resolvedBackendAttemptId);
        if (!active) return;
        setReviewPayload(response);
        setBackendReview(adaptReadingBackendReview(response));
      } catch {
        if (!active) return;
        setReviewPayload(null);
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

  const timeUsedSeconds = Math.max(0, reviewPayload?.time_used_seconds ?? 0);
  const minutes = Math.floor(timeUsedSeconds / 60).toString().padStart(2, "0");
  const seconds = (timeUsedSeconds % 60).toString().padStart(2, "0");
  const testTitle = reviewPayload?.test_title || "Reading Test";

  return (
    <section className="mx-auto w-full max-w-445 space-y-5 px-2 pb-10 pt-4 sm:px-4 lg:px-6">
      <ReviewHeader
        testId={testId}
        testTitle={testTitle}
        correct={grading.correctCount}
        incorrect={grading.incorrectCount}
        unanswered={grading.unansweredCount}
        total={grading.total}
        scorePercent={grading.scorePercent}
        minutes={minutes}
        seconds={seconds}
        timerUsed={Boolean(reviewPayload?.time_used_seconds)}
        reviewHref={`/${locale}/reading/${testId}/review?attempt=${resolvedBackendAttemptId}`}
      />

      <QuestionTypePerformance items={accuracyByType} />

      {/* Mock-backed reading AI/video/action widgets are temporarily hidden until backend endpoints are finalized. */}
      <Card className="rounded-3xl border-border/70 bg-card/80 p-4 text-sm text-muted-foreground">
        Extra coaching widgets are temporarily hidden while backend-only integration is in progress.
      </Card>
    </section>
  );
}
