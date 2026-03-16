"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { getListeningAnswerMeta } from "@/data/listening-answer-keys";
import { getListeningTestById } from "@/data/listening-tests-full";
import { LISTENING_REVIEW_ACTIONS, type ListeningReviewActionKey } from "@/data/student/listening-review";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { gradeTest, type GradeableQuestion } from "@/lib/grading";
import { flattenListeningQuestions } from "@/lib/listening-questions";
import { buildListeningReviewInsights } from "@/lib/listening-review-insights";
import {
  loadAttemptResult,
  loadLatestAttemptResult,
  type PersistedAttempt,
} from "@/lib/test-attempt-storage";
import { ListeningResultSummaryHeader } from "./_components/ListeningResultSummaryHeader";
import {
  ListeningSectionPerformance,
  type ListeningSectionPerformanceItem,
} from "./_components/ListeningSectionPerformance";
import { ListeningAiLearningCoachCard } from "./_components/ListeningAiLearningCoachCard";
import { ListeningMistakeHeatmapCard } from "./_components/ListeningMistakeHeatmapCard";
import { ListeningNextLearningActions } from "./_components/ListeningNextLearningActions";
import { ListeningTypePerformance } from "./_components/ListeningTypePerformance";

function estimateListeningBand(correct: number) {
  if (correct >= 39) return "9.0";
  if (correct >= 37) return "8.5";
  if (correct >= 35) return "8.0";
  if (correct >= 32) return "7.5";
  if (correct >= 30) return "7.0";
  if (correct >= 26) return "6.5";
  if (correct >= 23) return "6.0";
  if (correct >= 18) return "5.5";
  if (correct >= 16) return "5.0";
  if (correct >= 13) return "4.5";
  if (correct >= 10) return "4.0";
  if (correct >= 8) return "3.5";
  if (correct >= 6) return "3.0";
  if (correct >= 4) return "2.5";
  if (correct >= 2) return "2.0";
  return "1.0";
}

export default function ListeningResultPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const tResults = useTranslations("testResults");
  const t = useTranslations("listeningResult");
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const testId = typeof params?.id === "string" ? params.id : "";
  const attemptId = searchParams.get("attempt") ?? "";
  const test = getListeningTestById(testId);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const flatQuestions = useMemo(() => {
    if (!test) return [];
    return flattenListeningQuestions(test.id, test.sections);
  }, [test]);

  const attempt = useMemo<PersistedAttempt | null>(() => {
    if (!isClient || !test) return null;
    if (!attemptId) return loadLatestAttemptResult("listening", test.id);
    return loadAttemptResult("listening", test.id, attemptId);
  }, [attemptId, isClient, test]);

  const gradeable = useMemo<GradeableQuestion[]>(() => {
    return flatQuestions.map((question) => {
      const meta = getListeningAnswerMeta(question.id);
      return {
        id: question.id,
        number: question.number,
        type: question.type,
        correctAnswer: meta?.correctAnswer,
        acceptableAnswers: meta?.acceptableAnswers,
      };
    });
  }, [flatQuestions]);

  const grading = useMemo(() => {
    if (!attempt) return null;
    return gradeTest(gradeable, attempt.answers);
  }, [attempt, gradeable]);

  const sectionPerformance = useMemo(() => {
    if (!test || !grading) return [] as ListeningSectionPerformanceItem[];

    return test.sections.map((section, index) => {
      const sectionQuestions = flatQuestions.filter(
        (question) => question.sectionId === section.id,
      );
      const total = sectionQuestions.length;
      const correct = sectionQuestions.reduce(
        (sum, question) => sum + (grading.byQuestion[question.id]?.isCorrect ? 1 : 0),
        0,
      );
      return {
        sectionId: section.id,
        label: t("partLabel", { index: index + 1 }),
        correct,
        total,
        percent: total ? Math.round((correct / total) * 100) : 0,
      };
    });
  }, [flatQuestions, grading, t, test]);

  useEffect(() => {
    if (!actionNotice) return;
    const timer = window.setTimeout(() => setActionNotice(null), 2200);
    return () => window.clearTimeout(timer);
  }, [actionNotice]);

  if (!test) {
    return (
      <div className="mx-auto mt-8 max-w-3xl px-4">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">{tResults("missingAttemptTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {tResults("missingAttemptDescription")}
          </p>
          <Button className="mt-4" asChild>
            <Link href={`/${locale}/listening/${testId}?restart=1`}>
              {tResults("retakeTest")}
            </Link>
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
          <p className="mt-2 text-sm text-muted-foreground">
            {tResults("missingAttemptDescription")}
          </p>
          <Button className="mt-4" asChild>
            <Link href={`/${locale}/listening/${testId}?restart=1`}>
              {tResults("retakeTest")}
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const timerSpentSec = Math.max(
    0,
    test.durationMinutes * 60 - attempt.timeRemainingSec,
  );
  const fallbackSpentSec = Math.max(
    0,
    attempt.finishedAt ? Math.floor((attempt.finishedAt - attempt.startedAt) / 1000) : 0,
  );
  const effectiveSpentSec = attempt.timerUsed ? timerSpentSec : fallbackSpentSec;
  const minutes = Math.floor(effectiveSpentSec / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (effectiveSpentSec % 60).toString().padStart(2, "0");
  const estimatedBand = estimateListeningBand(grading.correctCount);
  const reviewInsights = buildListeningReviewInsights({
    questions: flatQuestions,
    grading,
    sectionPerformance,
  });
  const weakestTypeLabel = reviewInsights.weakestType
    ? t(`questionTypes.${reviewInsights.weakestType.type}`)
    : t("notAvailable");
  const weakestSectionLabel = reviewInsights.weakestSection?.label ?? t("notAvailable");
  const coachInsights = [
    t("coachInsightWeakPart", { part: weakestSectionLabel }),
    t("coachInsightWeakType", { type: weakestTypeLabel }),
    t("coachInsightSkipped", { count: reviewInsights.skippedCount }),
  ];
  const handleLearningAction = (actionKey: ListeningReviewActionKey) => {
    if (actionKey === "openAiCoach") {
      router.push(`/${locale}/ai-coach`);
      return;
    }
    if (
      actionKey === "practiceWeakPart" ||
      actionKey === "practiceWeakType" ||
      actionKey === "startSimilarListening"
    ) {
      router.push(`/${locale}/listening`);
      return;
    }
    if (actionKey === "openReviewCenter") {
      router.push(`/${locale}/review-center`);
      return;
    }
    setActionNotice(t("actionPlaceholder", { action: t(actionKey) }));
  };

  return (
    <section className="mx-auto w-full max-w-445 space-y-5 px-2 pb-10 pt-4 sm:px-4 lg:px-6">
      <ListeningResultSummaryHeader
        testId={test.id}
        testTitle={test.title}
        correct={grading.correctCount}
        incorrect={grading.incorrectCount}
        unanswered={grading.unansweredCount}
        total={grading.total}
        scorePercent={grading.scorePercent}
        estimatedBand={estimatedBand}
        timerUsed={attempt.timerUsed}
        minutes={minutes}
        seconds={seconds}
        reviewHref={`/${locale}/listening/${test.id}/review?attempt=${attempt.attemptId}`}
      />

      <ListeningSectionPerformance items={sectionPerformance} />
      <ListeningTypePerformance items={reviewInsights.typePerformance} />

      {actionNotice ? (
        <Card className="border-blue-300/70 bg-blue-100/70 p-3 text-sm text-blue-700 dark:border-blue-500/35 dark:bg-blue-500/10 dark:text-blue-100">
          {actionNotice}
        </Card>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <ListeningAiLearningCoachCard
          weakestSectionLabel={weakestSectionLabel}
          weakestTypeLabel={weakestTypeLabel}
          skippedCount={reviewInsights.skippedCount}
          accuracy={reviewInsights.overallAccuracy}
          insights={coachInsights}
          onAction={handleLearningAction}
        />
        <ListeningMistakeHeatmapCard items={reviewInsights.heatmap} />
      </div>

      <ListeningNextLearningActions
        actions={LISTENING_REVIEW_ACTIONS}
        onAction={handleLearningAction}
      />
    </section>
  );
}
