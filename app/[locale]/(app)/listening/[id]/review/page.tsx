"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { gradeTest, type GradeableQuestion } from "@/lib/grading";
import { studentAttemptsService } from "@/src/services/student/attempts.service";
import type { StudentAttemptReviewResponse } from "@/src/services/student/types";
import { cn } from "@/lib/utils";
import { ListeningQuestionAnalysisPanel } from "../result/_components/ListeningQuestionAnalysisPanel";
import { ListeningTranscriptReviewPanel } from "../result/_components/ListeningTranscriptReviewPanel";
import {
  adaptListeningBackendReview,
  type AdaptedListeningBackendReview,
  type ListeningBackendAnswerMeta,
} from "../result/_components/backendReviewAdapters";

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

  const testId = typeof params?.id === "string" ? params.id : "";
  const attemptId = searchParams.get("attempt")?.trim() ?? "";
  const resolvedBackendAttemptId = isUuid(attemptId) ? attemptId : "";

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [activeSectionId, setActiveSectionId] = useState("s1");
  const [highlightedEvidenceQuestionId, setHighlightedEvidenceQuestionId] = useState<string | null>(null);
  const [mobilePanel, setMobilePanel] = useState<"transcript" | "questions">("transcript");
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

  const answers = useMemo(
    () => normalizeStoredAnswers(backendReview?.answers ?? {}),
    [backendReview],
  );

  const grading = useMemo(() => {
    if (!gradeableQuestions.length) return null;
    return gradeTest(gradeableQuestions, answers);
  }, [answers, gradeableQuestions]);

  useEffect(() => {
    if (!highlightedEvidenceQuestionId) return;
    const timer = window.setTimeout(() => setHighlightedEvidenceQuestionId(null), 2400);
    return () => window.clearTimeout(timer);
  }, [highlightedEvidenceQuestionId]);

  const reviewSections = useMemo(() => {
    if (!backendReview || !grading) return [];
    return backendReview.reviewSections.map((section, index) => ({
      ...section,
      label: t("partLabel", { index: index + 1 }),
      evidenceItems: section.evidenceItems.map((item) => ({
        ...item,
        status: getQuestionStatus(grading, item.questionId),
      })),
    }));
  }, [backendReview, grading, t]);

  const answerMetaByQuestionId = useMemo(() => {
    return (backendReview?.answerMeta ?? []).reduce<Record<string, ListeningBackendAnswerMeta>>(
      (accumulator, item) => {
        accumulator[item.questionId] = item;
        return accumulator;
      },
      {},
    );
  }, [backendReview]);

  const handleJumpEvidence = useCallback((questionId: string) => {
    const meta = answerMetaByQuestionId[questionId];
    setMobilePanel("transcript");
    if (meta?.evidence.sectionId) {
      setActiveSectionId(meta.evidence.sectionId);
    }
    setHighlightedEvidenceQuestionId(questionId);

    window.setTimeout(() => {
      const node = document.getElementById(`listening-evidence-${questionId}`);
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }, [answerMetaByQuestionId]);

  const handleGoToQuestion = useCallback((questionId: string) => {
    setMobilePanel("questions");
    window.setTimeout(() => {
      const node = document.getElementById(`review-question-${questionId}`);
      node?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
  }, []);

  if (!resolvedBackendAttemptId) {
    return (
      <div className="mx-auto mt-8 max-w-3xl px-4">
        <Card className="p-6">
          <h1 className="text-xl font-semibold">{tResults("missingAttemptTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">Attempt ID is required to load backend review.</p>
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
        <Card className="p-6 text-sm text-muted-foreground">Loading backend review...</Card>
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
            <Link href={`/${locale}/listening/${testId}`}>{tResults("retakeTest")}</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const resolvedActiveSectionId = reviewSections.some((section) => section.sectionId === activeSectionId)
    ? activeSectionId
    : (reviewSections[0]?.sectionId ?? "s1");

  return (
    <section className="mx-auto w-full max-w-445 space-y-5 px-2 pb-10 pt-4 sm:px-4 lg:px-6">
      <Card className="rounded-3xl border-slate-200/85 bg-white/95 p-4 shadow-sm shadow-slate-200/50 dark:border-border/75 dark:bg-card/75 dark:shadow-none sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground uppercase">{t("reviewAnswers")}</p>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {reviewPayload?.test_title || "Listening Review"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("listeningReview")} - {t("questionAnalysis")}
            </p>
          </div>
          <Button asChild className="h-9 rounded-xl px-4">
            <Link href={`/${locale}/listening/${testId}/result?attempt=${resolvedBackendAttemptId}`}>{t("resultsButton")}</Link>
          </Button>
        </div>
      </Card>

      <div className="xl:hidden">
        <div className="grid grid-cols-2 rounded-xl border border-border bg-card/70 p-1">
          <Button
            type="button"
            variant={mobilePanel === "transcript" ? "secondary" : "ghost"}
            className="h-8 rounded-lg"
            onClick={() => setMobilePanel("transcript")}
          >
            {t("partLabel", { index: Number(resolvedActiveSectionId.slice(1)) })}
          </Button>
          <Button
            type="button"
            variant={mobilePanel === "questions" ? "secondary" : "ghost"}
            className="h-8 rounded-lg"
            onClick={() => setMobilePanel("questions")}
          >
            {t.has("questions") ? t("questions") : "Questions"}
          </Button>
        </div>
      </div>

      <section
        id="review-main"
        className="grid min-h-0 gap-4 xl:h-[calc(100vh-14.5rem)] xl:grid-cols-[minmax(0,1.04fr)_minmax(0,0.96fr)] xl:items-stretch"
      >
        <div className={cn("min-h-0", mobilePanel !== "transcript" && "hidden xl:block")}>
          <ListeningTranscriptReviewPanel
            sections={reviewSections}
            activeSectionId={resolvedActiveSectionId}
            highlightedQuestionId={highlightedEvidenceQuestionId}
            onSectionChange={setActiveSectionId}
            onGoToQuestion={handleGoToQuestion}
          />
        </div>

        <div className={cn("min-h-0", mobilePanel !== "questions" && "hidden xl:block")}>
          <ListeningQuestionAnalysisPanel
            questions={backendReview.questions}
            answers={backendReview.answers}
            answerMetaByQuestionId={answerMetaByQuestionId}
            grading={grading}
            expanded={expanded}
            scrollResetKey={resolvedActiveSectionId}
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
        </div>
      </section>
    </section>
  );
}
