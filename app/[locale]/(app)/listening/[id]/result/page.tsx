"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { gradeTest, type GradeableQuestion } from "@/lib/grading";
import { studentAttemptsService } from "@/src/services/student/attempts.service";
import type { StudentAttemptReviewResponse } from "@/src/services/student/types";
import { ListeningResultSummaryHeader } from "./_components/ListeningResultSummaryHeader";
import {
  ListeningSectionPerformance,
} from "./_components/ListeningSectionPerformance";
import { ListeningTypePerformance } from "./_components/ListeningTypePerformance";
import { adaptListeningBackendReview, type AdaptedListeningBackendReview } from "./_components/backendReviewAdapters";

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

export default function ListeningResultPage() {
  const params = useParams<{id: string}>();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const tResults = useTranslations("testResults");
  const testId = typeof params?.id === "string" ? params.id : "";
  const attemptId = searchParams.get("attempt")?.trim() ?? "";
  const resolvedBackendAttemptId = isUuid(attemptId) ? attemptId : "";
  const [reviewPayload, setReviewPayload] = useState<StudentAttemptReviewResponse | null>(null);
  const [backendReview, setBackendReview] = useState<AdaptedListeningBackendReview | null>(null);
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
        setBackendReview(adaptListeningBackendReview(response));
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

  const gradeableQuestions = useMemo<GradeableQuestion[]>(() => {
    return (backendReview?.questions ?? []).map((question) => {
      const meta = backendReview?.answerMeta.find((item) => item.questionId === question.id);
      return {
        id: question.id,
        number: question.number,
        type: question.type,
        correctAnswer: meta?.correctAnswer,
        acceptableAnswers: meta?.acceptableAnswers,
      };
    });
  }, [backendReview]);

  const gradingAnswers = useMemo(
    () => normalizeStoredAnswers(backendReview?.answers ?? {}),
    [backendReview],
  );

  const grading = useMemo(() => {
    if (!gradeableQuestions.length) return null;
    return gradeTest(gradeableQuestions, gradingAnswers);
  }, [gradeableQuestions, gradingAnswers]);

  if (!resolvedBackendAttemptId) {
    return (
      <div className="mx-auto mt-8 max-w-3xl px-4">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">{tResults("missingAttemptTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Attempt ID is required to load backend results.</p>
          <Button className="mt-4" asChild>
            <Link href={`/${locale}/listening/${testId}`}>{tResults("retakeTest")}</Link>
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
          <p className="mt-2 text-sm text-muted-foreground">
            {tResults("missingAttemptDescription")}
          </p>
          <Button className="mt-4" asChild>
            <Link href={`/${locale}/listening/${testId}`}>{tResults("retakeTest")}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const timeUsedSeconds = Math.max(0, reviewPayload?.time_used_seconds ?? 0);
  const minutes = Math.floor(timeUsedSeconds / 60).toString().padStart(2, "0");
  const seconds = (timeUsedSeconds % 60).toString().padStart(2, "0");
  const testTitle = reviewPayload?.test_title || "Listening Test";

  return (
    <section className="mx-auto w-full max-w-445 space-y-5 px-2 pb-10 pt-4 sm:px-4 lg:px-6">
      <ListeningResultSummaryHeader
        testId={testId}
        testTitle={testTitle}
        correct={grading.correctCount}
        incorrect={grading.incorrectCount}
        unanswered={grading.unansweredCount}
        total={grading.total}
        scorePercent={grading.scorePercent}
        estimatedBand={backendReview.stats.estimatedBand}
        timerUsed={Boolean(reviewPayload?.time_used_seconds)}
        minutes={minutes}
        seconds={seconds}
        reviewHref={`/${locale}/listening/${testId}?review=1&attempt=${resolvedBackendAttemptId}`}
        reviewVariant="analysis"
      />

      <ListeningSectionPerformance items={backendReview.sectionPerformance} />
      <ListeningTypePerformance items={backendReview.typePerformance} />

      {/* Mock-backed listening AI/action widgets are temporarily hidden until backend endpoints are finalized. */}
      <Card className="rounded-3xl border-border/70 bg-card/80 p-4 text-sm text-muted-foreground">
        Extra coaching widgets are temporarily hidden while backend-only integration is in progress.
      </Card>
    </section>
  );
}
