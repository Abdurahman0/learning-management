"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { getReadingTestById } from "@/data/reading-tests";
import { buildReviewPassages } from "@/data/review-reading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { gradeTest, type GradeableQuestion } from "@/lib/grading";
import { loadAttemptResult, loadLatestAttemptResult, type PersistedAttempt } from "@/lib/test-attempt-storage";
import { studentAttemptsService } from "@/src/services/student/attempts.service";
import { ReviewPassagePanel } from "../../result/_components/ReviewPassagePanel";
import { ReviewQuestionsPanel } from "../../result/_components/ReviewQuestionsPanel";
import { adaptReadingBackendReview, type AdaptedReadingBackendReview } from "../../result/_components/backendReviewAdapters";

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

export function ReadingAnalysisPageClient() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const tResults = useTranslations("testResults");
  const t = useTranslations("readingResult");

  const testId = typeof params?.id === "string" ? params.id : "";
  const attemptId = searchParams.get("attempt") ?? "";
  const test = getReadingTestById(testId);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activePassageId, setActivePassageId] = useState<"p1" | "p2" | "p3">("p1");
  const [highlightedParagraphId, setHighlightedParagraphId] = useState<string | null>(null);
  const passageScrollRef = useRef<HTMLDivElement | null>(null);
  const [backendReview, setBackendReview] = useState<AdaptedReadingBackendReview | null>(null);
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
      } catch {
        if (!active) return;
        setBackendReview(null);
      }
    };

    void loadBackendReview();

    return () => {
      active = false;
    };
  }, [resolvedBackendAttemptId]);

  const activeBackendReview = resolvedBackendAttemptId ? backendReview : null;

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
    return gradingQuestions.map((question) => ({
      id: question.id,
      number: question.number,
      type: question.type,
      correctAnswer: question.correctAnswer,
      acceptableAnswers: question.acceptableAnswers,
    }));
  }, [gradingQuestions]);

  const grading = useMemo(() => {
    if (!gradeableQuestions.length) return null;
    return gradeTest(gradeableQuestions, gradingAnswers);
  }, [gradeableQuestions, gradingAnswers]);

  const reviewPassages = useMemo(() => {
    if (activeBackendReview) return activeBackendReview.passages;
    if (!test) return [];
    return buildReviewPassages(test);
  }, [activeBackendReview, test]);

  useEffect(() => {
    if (!highlightedParagraphId) return;
    const timer = window.setTimeout(() => setHighlightedParagraphId(null), 2200);
    return () => window.clearTimeout(timer);
  }, [highlightedParagraphId]);

  const handleJumpEvidence = useCallback(
    (questionId: string) => {
      const question = gradingQuestions.find((item) => item.id === questionId);
      const evidence = question?.evidenceSpans[0];
      if (!evidence) return;

      const paragraphId = `review-para-${evidence.passageId}-${evidence.paragraphIndex}`;
      setActivePassageId(evidence.passageId);
      setHighlightedParagraphId(paragraphId);

      window.setTimeout(() => {
        const node = document.getElementById(paragraphId);
        node?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 120);
    },
    [gradingQuestions]
  );

  if (!test) {
    return (
      <div className="mx-auto mt-8 max-w-3xl px-4">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">{tResults("missingAttemptTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{tResults("missingAttemptDescription")}</p>
          <Button className="mt-4" asChild>
            <Link href={`/${locale}/reading/${testId}?restart=1`}>{tResults("retakeTest")}</Link>
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
          <p className="mt-2 text-sm text-muted-foreground">{tResults("missingAttemptDescription")}</p>
          <Button className="mt-4" asChild>
            <Link href={`/${locale}/reading/${testId}?restart=1`}>{tResults("retakeTest")}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const resultsAttemptParam = resolvedBackendAttemptId || attempt?.attemptId || "";

  return (
    <section className="mx-auto w-full max-w-445 space-y-5 px-2 pb-10 pt-4 sm:px-4 lg:px-6">
      <Card className="rounded-3xl border-slate-200/85 bg-white/95 p-4 shadow-sm shadow-slate-200/50 dark:border-border/75 dark:bg-card/75 dark:shadow-none sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{t("reviewAnswers")}</p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{test.title}</h1>
            <p className="text-sm text-muted-foreground">
              {t("passageAnalysis")} - {t("questionAnalysis")}
            </p>
          </div>
          <Button asChild className="h-9 rounded-xl px-4">
            <Link
              href={
                resultsAttemptParam
                  ? `/${locale}/reading/${test.id}/result?attempt=${resultsAttemptParam}`
                  : `/${locale}/reading/${test.id}/result`
              }
            >
              {t("resultsButton")}
            </Link>
          </Button>
        </div>
      </Card>

      <section id="review-main" className="grid min-h-0 items-start gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <ReviewPassagePanel
          passages={reviewPassages}
          activePassageId={activePassageId}
          highlightedParagraphId={highlightedParagraphId}
          passageScrollRef={passageScrollRef}
          onPassageChange={setActivePassageId}
        />
        <ReviewQuestionsPanel
          questions={gradingQuestions}
          answers={gradingAnswers}
          grading={grading}
          expanded={expanded}
          onToggleExplanation={(questionId) => {
            setExpanded((previous) => {
              const next = new Set(previous);
              if (next.has(questionId)) {
                next.delete(questionId);
              } else {
                next.add(questionId);
              }
              return next;
            });
          }}
          onJumpEvidence={handleJumpEvidence}
        />
      </section>
    </section>
  );
}
