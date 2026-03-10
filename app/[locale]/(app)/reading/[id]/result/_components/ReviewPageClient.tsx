"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { getReadingAnswerMeta } from "@/data/reading-answer-keys";
import { getReadingTestById, type ReadingQuestion } from "@/data/reading-tests";
import { buildReviewPassages, getReadingReviewData } from "@/data/review-reading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { gradeTest, type GradeableQuestion } from "@/lib/grading";
import { loadAttemptResult, loadLatestAttemptResult, type PersistedAttempt } from "@/lib/test-attempt-storage";
import { ReviewAiCoachCard } from "./ReviewAiCoachCard";
import { ReviewHeader } from "./ReviewHeader";
import { ReviewMistakeHeatmap } from "./ReviewMistakeHeatmap";
import { ReviewNextActions } from "./ReviewNextActions";
import { ReviewPassagePanel } from "./ReviewPassagePanel";
import { ReviewQuestionsPanel } from "./ReviewQuestionsPanel";
import { ReviewVideoLessonCard } from "./ReviewVideoLessonCard";

function toQuestionTypeLabel(type: ReadingQuestion["type"]) {
  switch (type) {
    case "tfng":
      return "TFNG";
    case "mcq":
      return "MCQ";
    case "matchingHeadings":
      return "Matching Headings";
    case "matchingInfo":
      return "Matching Info";
    case "sentenceCompletion":
      return "Sentence Completion";
    default:
      return type;
  }
}

export function ReviewPageClient() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const tResults = useTranslations("testResults");
  const t = useTranslations("readingReview");

  const testId = typeof params?.id === "string" ? params.id : "";
  const attemptId = searchParams.get("attempt") ?? "";
  const test = getReadingTestById(testId);

  const [attempt, setAttempt] = useState<PersistedAttempt | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activePassageId, setActivePassageId] = useState<"p1" | "p2" | "p3">("p1");
  const [highlightedParagraphId, setHighlightedParagraphId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const passageScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!test) {
      setAttempt(null);
      return;
    }

    if (!attemptId) {
      setAttempt(loadLatestAttemptResult("reading", test.id));
      return;
    }

    const resolved = loadAttemptResult("reading", test.id, attemptId);
    if (!resolved) {
      setAttempt(null);
      return;
    }

    setAttempt(resolved);
  }, [attemptId, test]);

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

  const reviewData = useMemo(() => getReadingReviewData(testId), [testId]);

  const accuracyByType = useMemo(() => {
    if (!test || !grading) return [] as Array<{ label: string; value: string }>;
    const buckets = new Map<string, { correct: number; total: number }>();

    for (const question of test.questions) {
      const result = grading.byQuestion[question.id];
      const key = toQuestionTypeLabel(question.type);
      const previous = buckets.get(key) ?? { correct: 0, total: 0 };
      previous.total += 1;
      if (result?.isCorrect) {
        previous.correct += 1;
      }
      buckets.set(key, previous);
    }

    return [...buckets.entries()].map(([label, stats]) => ({
      label,
      value: `${stats.correct}/${stats.total}`,
    }));
  }, [grading, test]);

  const dynamicHeatmap = useMemo(() => {
    if (!test || !grading) return reviewData.heatmap;

    return test.passages.map((passage, index) => {
      const inPassage = test.questions.filter((question) => question.passageId === passage.id);
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
  }, [grading, reviewData.heatmap, test]);

  useEffect(() => {
    if (!highlightedParagraphId) return;
    const timer = window.setTimeout(() => setHighlightedParagraphId(null), 2200);
    return () => window.clearTimeout(timer);
  }, [highlightedParagraphId]);

  useEffect(() => {
    if (!actionNotice) return;
    const timer = window.setTimeout(() => setActionNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [actionNotice]);

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

  const handleAction = useCallback(
    (actionLabel: string) => {
      setActionNotice(t("actionPlaceholder", { action: actionLabel }));
    },
    [t]
  );

  if (!test || !attempt || !grading) {
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

  const timeTakenSec = Math.max(0, attempt.finishedAt ? Math.floor((attempt.finishedAt - attempt.startedAt) / 1000) : 0);
  const minutes = Math.floor(timeTakenSec / 60).toString().padStart(2, "0");
  const seconds = (timeTakenSec % 60).toString().padStart(2, "0");

  return (
    <section className="mx-auto w-full max-w-[1320px] space-y-5 px-3 pb-10 pt-4 sm:px-5 lg:px-8">
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
        timerUsed={attempt.timerUsed}
        accuracyByType={accuracyByType}
      />

      <section id="review-main" className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
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

      <section className="space-y-5">
        {actionNotice ? (
          <Card className="border-blue-500/35 bg-blue-500/10 p-3 text-sm text-blue-100">
            {actionNotice}
          </Card>
        ) : null}

        <ReviewVideoLessonCard lesson={reviewData.videoLesson} onAction={handleAction} />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
          <ReviewAiCoachCard coach={reviewData.aiCoach} mistakeBreakdown={reviewData.mistakeBreakdown} onAction={handleAction} />
          <ReviewMistakeHeatmap items={dynamicHeatmap} />
        </div>

        <ReviewNextActions actions={reviewData.nextActions} onAction={handleAction} />
      </section>
    </section>
  );
}
