"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { getListeningAnswerMeta } from "@/data/listening-answer-keys";
import { getListeningTestById, type ListeningSectionId } from "@/data/listening-tests-full";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { gradeTest, type GradeableQuestion } from "@/lib/grading";
import { flattenListeningQuestions } from "@/lib/listening-questions";
import { loadAttemptResult, loadLatestAttemptResult, type PersistedAttempt } from "@/lib/test-attempt-storage";
import { ListeningQuestionAnalysisPanel } from "../result/_components/ListeningQuestionAnalysisPanel";
import {
  ListeningTranscriptReviewPanel,
  type ListeningReviewSection,
} from "../result/_components/ListeningTranscriptReviewPanel";

type QuestionStatus = "correct" | "incorrect" | "skipped";

function getQuestionStatus(grading: ReturnType<typeof gradeTest>, questionId: string): QuestionStatus {
  const result = grading.byQuestion[questionId];
  if (!result?.normalizedUser) return "skipped";
  return result.isCorrect ? "correct" : "incorrect";
}

export default function ListeningReviewPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const tResults = useTranslations("testResults");
  const t = useTranslations("listeningResult");
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const testId = typeof params?.id === "string" ? params.id : "";
  const attemptId = searchParams.get("attempt") ?? "";
  const test = getListeningTestById(testId);

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeSectionId, setActiveSectionId] = useState<ListeningSectionId>("s1");
  const [highlightedEvidenceQuestionId, setHighlightedEvidenceQuestionId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!highlightedEvidenceQuestionId) return;
    const timer = window.setTimeout(() => setHighlightedEvidenceQuestionId(null), 2400);
    return () => window.clearTimeout(timer);
  }, [highlightedEvidenceQuestionId]);

  const reviewSections = useMemo(() => {
    if (!test || !grading) return [] as ListeningReviewSection[];

    return test.sections.map((section, index) => ({
      sectionId: section.id,
      label: t("partLabel", { index: index + 1 }),
      title: section.title,
      instructions: section.instructions,
      nowPlayingLabel: section.audioMeta.nowPlayingLabel,
      audioTitle: section.audioMeta.currentTrackTitle,
      evidenceItems: flatQuestions
        .filter((question) => question.sectionId === section.id)
        .map((question) => {
          const meta = getListeningAnswerMeta(question.id);
          return {
            questionId: question.id,
            questionNumber: question.number,
            prompt: question.prompt,
            quote: meta?.evidence.transcriptQuote ?? question.prompt,
            timeRange: meta?.evidence.timeRange,
            status: getQuestionStatus(grading, question.id),
          };
        }),
    }));
  }, [flatQuestions, grading, t, test]);

  const handleJumpEvidence = useCallback((questionId: string) => {
    const meta = getListeningAnswerMeta(questionId);
    if (meta?.evidence.sectionId) {
      setActiveSectionId(meta.evidence.sectionId);
    }
    setHighlightedEvidenceQuestionId(questionId);

    window.setTimeout(() => {
      const node = document.getElementById(`listening-evidence-${questionId}`);
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
            <Link href={`/${locale}/listening/${testId}?restart=1`}>{tResults("retakeTest")}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (!isClient) {
    return (
      <section className="mx-auto w-full max-w-[1780px] space-y-5 px-2 pb-10 pt-4 sm:px-4 lg:px-6">
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
            <Link href={`/${locale}/listening/${testId}?restart=1`}>{tResults("retakeTest")}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const resolvedActiveSectionId = test.sections.some((section) => section.id === activeSectionId)
    ? activeSectionId
    : (test.sections[0]?.id ?? "s1");

  return (
    <section className="mx-auto w-full max-w-[1780px] space-y-5 px-2 pb-10 pt-4 sm:px-4 lg:px-6">
      <Card className="rounded-3xl border-slate-200/85 bg-white/95 p-4 shadow-sm shadow-slate-200/50 dark:border-border/75 dark:bg-card/75 dark:shadow-none sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{t("reviewAnswers")}</p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{test.title}</h1>
            <p className="text-sm text-muted-foreground">
              {t("listeningReview")} · {t("questionAnalysis")}
            </p>
          </div>
          <Button asChild className="h-9 rounded-xl px-4">
            <Link href={`/${locale}/listening/${test.id}/result?attempt=${attempt.attemptId}`}>{t("resultsButton")}</Link>
          </Button>
        </div>
      </Card>

      <section id="review-main" className="grid min-h-0 items-start gap-4 xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)]">
        <ListeningTranscriptReviewPanel
          sections={reviewSections}
          activeSectionId={resolvedActiveSectionId}
          highlightedQuestionId={highlightedEvidenceQuestionId}
          onSectionChange={(sectionId) => setActiveSectionId(sectionId as ListeningSectionId)}
        />

        <ListeningQuestionAnalysisPanel
          questions={flatQuestions}
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

