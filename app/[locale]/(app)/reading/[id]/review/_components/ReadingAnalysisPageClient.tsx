"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { getReadingAnswerMeta } from "@/data/reading-answer-keys";
import { getReadingTestById } from "@/data/reading-tests";
import { buildReviewPassages } from "@/data/review-reading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { gradeTest, type GradeableQuestion } from "@/lib/grading";
import { loadAttemptResult, loadLatestAttemptResult, type PersistedAttempt } from "@/lib/test-attempt-storage";
import { ReviewPassagePanel } from "../../result/_components/ReviewPassagePanel";
import { ReviewQuestionsPanel } from "../../result/_components/ReviewQuestionsPanel";

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
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const attempt = useMemo<PersistedAttempt | null>(() => {
    if (!isClient || !test) return null;
    if (!attemptId) return loadLatestAttemptResult("reading", test.id);
    return loadAttemptResult("reading", test.id, attemptId);
  }, [attemptId, isClient, test]);

  const gradeableQuestions = useMemo<GradeableQuestion[]>(() => {
    if (!test) return [];
    return test.questions.map((question) => {
      const meta = getReadingAnswerMeta(question.id);
      return {
        id: question.id,
        number: question.number,
        type: question.type,
        correctAnswer: meta?.correctAnswer,
        acceptableAnswers: meta?.acceptableAnswers,
      };
    });
  }, [test]);

  const grading = useMemo(() => {
    if (!test || !attempt) return null;
    return gradeTest(gradeableQuestions, attempt.answers);
  }, [attempt, gradeableQuestions, test]);

  const reviewPassages = useMemo(() => {
    if (!test) return [];
    return buildReviewPassages(test);
  }, [test]);

  useEffect(() => {
    if (!highlightedParagraphId) return;
    const timer = window.setTimeout(() => setHighlightedParagraphId(null), 2200);
    return () => window.clearTimeout(timer);
  }, [highlightedParagraphId]);

  const handleJumpEvidence = useCallback((questionId: string) => {
    const meta = getReadingAnswerMeta(questionId);
    const paragraphIndex = meta?.evidence.paragraphIndex;
    if (!meta?.evidence.passageId || paragraphIndex == null) return;

    const paragraphId = `review-para-${meta.evidence.passageId}-${paragraphIndex}`;
    setActivePassageId(meta.evidence.passageId);
    setHighlightedParagraphId(paragraphId);

    window.setTimeout(() => {
      const node = document.getElementById(paragraphId);
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }, []);

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

  if (!isClient) {
    return (
      <section className="mx-auto w-full max-w-445 space-y-5 px-2 pb-10 pt-4 sm:px-4 lg:px-6">
        <Card className="rounded-2xl border-border/70 bg-card/70 p-6">
          <p className="text-sm text-muted-foreground">{tResults("title")}</p>
        </Card>
      </section>
    );
  }

  if (!attempt || !grading) {
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

  return (
    <section className="mx-auto w-full max-w-445 space-y-5 px-2 pb-10 pt-4 sm:px-4 lg:px-6">
      <Card className="rounded-3xl border-slate-200/85 bg-white/95 p-4 shadow-sm shadow-slate-200/50 dark:border-border/75 dark:bg-card/75 dark:shadow-none sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{t("reviewAnswers")}</p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{test.title}</h1>
            <p className="text-sm text-muted-foreground">
              {t("passageAnalysis")} · {t("questionAnalysis")}
            </p>
          </div>
          <Button asChild className="h-9 rounded-xl px-4">
            <Link href={`/${locale}/reading/${test.id}/result?attempt=${attempt.attemptId}`}>{t("resultsButton")}</Link>
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
          questions={test.questions}
          answers={attempt.answers}
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

