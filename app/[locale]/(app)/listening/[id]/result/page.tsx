"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {MistakeReasonAiResponseCard} from "@/components/mistake-reasons/MistakeReasonAiResponseCard";
import {PostTestMistakeReasonsPanel} from "@/components/mistake-reasons/PostTestMistakeReasonsPanel";
import { gradeTest, type GradeableQuestion } from "@/lib/grading";
import { loadAttemptResult } from "@/lib/test-attempt-storage";
import { getListeningTestById } from "@/data/listening-tests-full";
import { studentAttemptsService } from "@/src/services/student/attempts.service";
import {studentMistakeReasonsService} from "@/src/services/student/mistakeReasons.service";
import type {MistakeReasonDetail, StudentAttemptReviewResponse} from "@/src/services/student/types";
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
  const router = useRouter();
  const tResults = useTranslations("testResults");
  const testId = typeof params?.id === "string" ? params.id : "";
  const attemptId = searchParams.get("attempt")?.trim() ?? "";
  const resolvedBackendAttemptId = isUuid(attemptId) ? attemptId : "";
  const localAttemptId = !resolvedBackendAttemptId && attemptId ? attemptId : "";
  const localResult = useMemo(() => {
    if (!localAttemptId) return null;
    return loadAttemptResult("listening", testId, localAttemptId);
  }, [localAttemptId, testId]);
  const [reviewPayload, setReviewPayload] = useState<StudentAttemptReviewResponse | null>(null);
  const [backendReview, setBackendReview] = useState<AdaptedListeningBackendReview | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(resolvedBackendAttemptId));
  const [showAiInsights, setShowAiInsights] = useState(false);
  const aiInsightsRef = useRef<HTMLDivElement | null>(null);
  const [mistakeReasons, setMistakeReasons] = useState<MistakeReasonDetail[]>([]);
  const [selectedMistakeReason, setSelectedMistakeReason] = useState<MistakeReasonDetail | null>(null);
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
        const response = await studentMistakeReasonsService.listForAttempt(resolvedBackendAttemptId);
        if (!active) return;
        setMistakeReasons(response);
      } catch (error) {
        if (!active) return;
        setMistakeReasons([]);
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

  const scrollToAiInsights = () => {
    setShowAiInsights(true);
    window.setTimeout(() => {
      aiInsightsRef.current?.scrollIntoView({behavior: "smooth", block: "start"});
    }, 80);
  };

  const handleMistakeReasonSelect = (reason: MistakeReasonDetail) => {
    setMistakeReasonsError(null);
    setSelectedMistakeReason(reason);
    scrollToAiInsights();
  };

  useEffect(() => {
    if (resolvedBackendAttemptId) return;
    const backendId = localResult?.backendAttemptId?.trim() ?? "";
    if (!backendId || !isUuid(backendId)) return;
    router.replace(`/${locale}/listening/${testId}/result?attempt=${backendId}`);
  }, [locale, localResult?.backendAttemptId, resolvedBackendAttemptId, router, testId]);

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
    if (!localAttemptId) {
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

    if (!localResult) {
      return (
        <div className="mx-auto mt-8 max-w-3xl px-4">
          <Card className="p-6">
            <h1 className="text-xl font-semibold">{tResults("missingAttemptTitle")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{tResults("missingAttemptDescription")}</p>
            <Button className="mt-4" asChild>
              <Link href={`/${locale}/listening/${testId}`}>{tResults("retakeTest")}</Link>
            </Button>
          </Card>
        </div>
      );
    }

    const test = getListeningTestById(testId);
    const title = test?.title || "Listening Test";
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
          <p className="text-xs font-medium tracking-wider text-muted-foreground">LISTENING RESULT</p>
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
              <Link href={`/${locale}/listening/${testId}`}>{tResults("retakeTest")}</Link>
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
        showAiAnalysisButton
        onAiAnalysisClick={scrollToAiInsights}
      />

      <ListeningSectionPerformance items={backendReview.sectionPerformance} />
      <ListeningTypePerformance items={backendReview.typePerformance} />

      <PostTestMistakeReasonsPanel
        reasons={mistakeReasons}
        selectedReason={selectedMistakeReason}
        isLoading={isReasonsLoading}
        error={mistakeReasonsError}
        onSelectReason={handleMistakeReasonSelect}
      />

      {showAiInsights ? (
        <div ref={aiInsightsRef}>
          <MistakeReasonAiResponseCard selectedReason={selectedMistakeReason} />
        </div>
      ) : null}
    </section>
  );
}
